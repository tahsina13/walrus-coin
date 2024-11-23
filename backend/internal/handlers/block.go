package handlers

import (
	"bufio"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"

	"github.com/ipfs/boxo/blockstore"
	blocks "github.com/ipfs/go-block-format"
	"github.com/ipfs/go-cid"
	"github.com/libp2p/go-libp2p/core/host"
	"github.com/libp2p/go-libp2p/core/network"
	"github.com/libp2p/go-libp2p/core/peer"
	"github.com/sirupsen/logrus"
)

const marketProtocolID = "/orcanet/market"

type BlockHandler struct {
	node   host.Host
	bstore blockstore.Blockstore
}

type BlockRequest struct {
	Type string `json:"Type"`
	Key  string `json:"Key"`
}

type BlockResponse struct {
	Key   string `json:"Key,omitempty"`
	Size  int    `json:"Size,omitempty"`
	Error string `json:"Error,omitempty"`
}

func NewBlockHandler(node host.Host, bstore blockstore.Blockstore) (*BlockHandler, error) {
	if node == nil {
		return nil, errors.New("node is nil")
	}
	if bstore == nil {
		return nil, errors.New("blockstore is nil")
	}
	handler := &BlockHandler{node: node, bstore: bstore}
	node.SetStreamHandler(marketProtocolID, func(s network.Stream) {
		defer s.Close()

		var bytes []byte
		var request BlockRequest
		var key cid.Cid

		reader := bufio.NewReader(s)
		jsonData, err := reader.ReadBytes('\n')
		if err != nil {
			response := BlockResponse{Error: fmt.Sprintf("failed to read block request: %s", err)}
			bytes, err = json.Marshal(response)
			if err != nil {
				logrus.Errorf("failed to marshal error response: %s", err)
				return
			}
			goto write
		}

		if err := json.Unmarshal(jsonData, &request); err != nil {
			response := BlockResponse{Error: fmt.Sprintf("failed to unmarshal block request: %s", err)}
			bytes, err = json.Marshal(response)
			if err != nil {
				logrus.Errorf("failed to marshal error response: %s", err)
				return
			}
			goto write
		}

		if key, err = cid.Decode(request.Key); err != nil {
			response := BlockResponse{Error: fmt.Sprintf("invalid cid: %s", err)}
			bytes, err = json.Marshal(response)
			if err != nil {
				logrus.Errorf("failed to marshal error response: %s", err)
				return
			}
			goto write
		}

		switch request.Type {
		case "get":
			var response BlockResponse
			data, err := handler.handleGet(key)
			if err != nil {
				response = BlockResponse{
					Key:   key.String(),
					Error: fmt.Sprintf("failed to get block: %s", err),
				}
			} else {
				response = BlockResponse{Key: key.String()}
			}
			bytes, err = json.Marshal(response)
			if err != nil {
				logrus.Errorf("failed to marshal response: %s", err)
				return
			}
			bytes = append(bytes, '\n')
			bytes = append(bytes, data...)
		case "stat":
			var response BlockResponse
			size, err := handler.handleStat(key)
			if err != nil {
				response = BlockResponse{
					Key:   key.String(),
					Error: fmt.Sprintf("failed to get block size: %s", err),
				}
			} else {
				response = BlockResponse{Key: key.String(), Size: size}
			}
			bytes, err = json.Marshal(response)
			if err != nil {
				logrus.Errorf("failed to marshal response: %s", err)
				return
			}
			bytes = append(bytes, '\n')
		}

	write:
		if _, err := s.Write(bytes); err != nil {
			logrus.Errorf("failed to write response: %s", err)
		}
	})
	return handler, nil
}

func (h *BlockHandler) handleGet(key cid.Cid) ([]byte, error) {
	blk, err := h.bstore.Get(context.Background(), key)
	if err != nil {
		return nil, err
	}
	return blk.RawData(), nil
}

func (h *BlockHandler) handleStat(key cid.Cid) (int, error) {
	size, err := h.bstore.GetSize(context.Background(), key)
	if err != nil {
		return 0, err
	}
	return size, nil
}

func (h *BlockHandler) Get(w http.ResponseWriter, r *http.Request) error {
	query := r.URL.Query()

	var key cid.Cid
	if arg, ok := query["arg"]; ok {
		c, err := cid.Decode(arg[0])
		if err != nil {
			return fmt.Errorf("invalid cid: %w", err)
		}
		key = c
	} else {
		return errors.New("argument \"key\" is required")
	}

	peerAddr, ok := query["peer"]
	if !ok {
		return errors.New("argument \"peer\" is required")
	}

	peerInfo, err := peer.AddrInfoFromString(peerAddr[0])
	if err != nil {
		return fmt.Errorf("failed to parse peer address: %w", err)
	}

	ctx := network.WithAllowLimitedConn(r.Context(), marketProtocolID)
	stream, err := h.node.NewStream(ctx, peerInfo.ID, marketProtocolID)
	if err != nil {
		return fmt.Errorf("failed to open stream: %w", err)
	}
	defer stream.Close()

	request := BlockRequest{Type: "get", Key: key.String()}
	jsonData, err := json.Marshal(request)
	if err != nil {
		return fmt.Errorf("failed to marshal block request: %w", err)
	}
	_, err = stream.Write(append(jsonData, '\n'))
	logrus.Debugf("Sent block get request: %s", string(jsonData))
	if err != nil {
		return fmt.Errorf("failed to write block request: %w", err)
	}

	reader := bufio.NewReader(stream)
	jsonData, err = reader.ReadBytes('\n')
	if err != nil {
		return fmt.Errorf("failed to read response: %w", err)
	}

	var response BlockResponse
	if err := json.Unmarshal(jsonData, &response); err != nil {
		return fmt.Errorf("failed to unmarshal response: %w", err)
	}
	if response.Error != "" {
		return errors.New(response.Error)
	}

	var buf [1024]byte
	for {
		n, err := reader.Read(buf[:])
		if err != nil {
			if err == io.EOF {
				break
			}
			return fmt.Errorf("failed to read block: %w", err)
		}
		if _, err := w.Write(buf[:n]); err != nil {
			return fmt.Errorf("failed to write block: %w", err)
		}
	}
	logrus.Debugf("Received block: %s", key)

	return nil
}

func (h *BlockHandler) Put(w http.ResponseWriter, r *http.Request) error {
	if err := r.ParseMultipartForm(10 << 20); err != nil {
		return fmt.Errorf("failed to parse multipart form: %w", err)
	}

	file, _, err := r.FormFile("data")
	if err != nil {
		return fmt.Errorf("failed to get file: %w", err)
	}
	defer file.Close()

	data, err := io.ReadAll(file)
	if err != nil {
		return fmt.Errorf("failed to read file: %w", err)
	}

	blk := blocks.NewBlock(data)
	if err := h.bstore.Put(r.Context(), blk); err != nil {
		return fmt.Errorf("failed to put block: %w", err)
	}

	response := BlockResponse{Key: blk.Cid().String(), Size: len(data)}
	if err := json.NewEncoder(w).Encode(response); err != nil {
		return fmt.Errorf("failed to encode response: %w", err)
	}
	return nil
}

func (h *BlockHandler) Remove(w http.ResponseWriter, r *http.Request) error {
	query := r.URL.Query()

	var key cid.Cid
	if arg, ok := query["arg"]; ok {
		c, err := cid.Decode(arg[0])
		if err != nil {
			return fmt.Errorf("invalid cid: %w", err)
		}
		key = c
	} else {
		return errors.New("argument \"key\" is required")
	}

	if err := h.bstore.DeleteBlock(r.Context(), key); err != nil {
		return fmt.Errorf("failed to delete block: %w", err)
	}

	response := BlockResponse{Key: key.String()}
	if err := json.NewEncoder(w).Encode(response); err != nil {
		return fmt.Errorf("failed to encode response: %w", err)
	}
	return nil
}

func (h *BlockHandler) Stat(w http.ResponseWriter, r *http.Request) error {
	query := r.URL.Query()

	var key cid.Cid
	if arg, ok := query["arg"]; ok {
		c, err := cid.Decode(arg[0])
		if err != nil {
			return fmt.Errorf("invalid cid: %w", err)
		}
		key = c
	} else {
		return errors.New("argument \"key\" is required")
	}

	peerAddr, ok := query["peer"]
	if !ok {
		return errors.New("argument \"peer\" is required")
	}

	peerInfo, err := peer.AddrInfoFromString(peerAddr[0])
	if err != nil {
		return fmt.Errorf("failed to parse peer address: %w", err)
	}

	ctx := network.WithAllowLimitedConn(r.Context(), marketProtocolID)
	stream, err := h.node.NewStream(ctx, peerInfo.ID, marketProtocolID)
	if err != nil {
		return fmt.Errorf("failed to open stream: %w", err)
	}
	defer stream.Close()

	request := BlockRequest{Type: "stat", Key: key.String()}
	jsonData, err := json.Marshal(request)
	if err != nil {
		return fmt.Errorf("failed to marshal block request: %w", err)
	}
	_, err = stream.Write(append(jsonData, '\n'))
	logrus.Debugf("Sent block stat request: %s", string(jsonData))
	if err != nil {
		return fmt.Errorf("failed to write block request: %w", err)
	}

	reader := bufio.NewReader(stream)
	jsonData, err = reader.ReadBytes('\n')
	if err != nil {
		return fmt.Errorf("failed to read response: %w", err)
	}

	var response BlockResponse
	if err := json.Unmarshal(jsonData, &response); err != nil {
		return fmt.Errorf("failed to unmarshal response: %w", err)
	}
	if response.Error != "" {
		return errors.New(response.Error)
	}

	if err := json.NewEncoder(w).Encode(response); err != nil {
		return fmt.Errorf("failed to encode response: %w", err)
	}
	return nil
}
