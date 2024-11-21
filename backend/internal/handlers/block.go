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

const (
	marketStatProtocolID = "/orcanet/market/stat"
	marketGetProtocolID  = "/orcanet/market/get"
)

type BlockHandler struct {
	node   host.Host
	bstore blockstore.Blockstore
}

type BlockRequest struct {
	Key string `json:"Key"`
}

type BlockResponse struct {
	Key  string `json:"Key"`
	Size int    `json:"Size"`
}

func NewBlockHandler(node host.Host, bstore blockstore.Blockstore) (*BlockHandler, error) {
	if node == nil {
		return nil, errors.New("node is nil")
	}
	if bstore == nil {
		return nil, errors.New("blockstore is nil")
	}
	handler := &BlockHandler{node: node, bstore: bstore}
	node.SetStreamHandler(marketStatProtocolID, func(s network.Stream) {
		defer s.Close()
		if err := handler.handleStat(s); err != nil {
			logrus.Debug(err)
		}
	})
	node.SetStreamHandler(marketGetProtocolID, func(s network.Stream) {
		defer s.Close()
		if err := handler.handleGet(s); err != nil {
			logrus.Debug(err)
		}
	})
	return handler, nil
}

func (h *BlockHandler) handleStat(s network.Stream) error {
	reader := bufio.NewReader(s)
	jsonData, err := reader.ReadBytes('\n')
	if err != nil {
		return fmt.Errorf("failed to read block request: %w", err)
	}

	var request BlockRequest
	if err := json.Unmarshal(jsonData, &request); err != nil {
		return fmt.Errorf("failed to unmarshal block request: %w", err)
	}

	key, err := cid.Decode(request.Key)
	if err != nil {
		return fmt.Errorf("invalid cid: %w", err)
	}

	size, err := h.bstore.GetSize(context.Background(), key)
	if err != nil {
		return fmt.Errorf("failed to get block size: %w", err)
	}

	response := BlockResponse{Key: key.String(), Size: size}
	if err := json.NewEncoder(s).Encode(response); err != nil {
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

	ctx := network.WithAllowLimitedConn(r.Context(), marketStatProtocolID)
	stream, err := h.node.NewStream(ctx, peerInfo.ID, marketStatProtocolID)
	if err != nil {
		return fmt.Errorf("failed to open stream: %w", err)
	}
	defer stream.Close()

	request := BlockRequest{Key: key.String()}
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

	if err := json.NewEncoder(w).Encode(response); err != nil {
		return fmt.Errorf("failed to encode response: %w", err)
	}
	return nil
}

func (h *BlockHandler) handleGet(s network.Stream) error {
	reader := bufio.NewReader(s)
	jsonData, err := reader.ReadBytes('\n')
	if err != nil {
		return fmt.Errorf("failed to read block request: %w", err)
	}

	var request BlockRequest
	if err := json.Unmarshal(jsonData, &request); err != nil {
		return fmt.Errorf("failed to unmarshal block request: %w", err)
	}
	logrus.Debugf("Received block get request: %s", string(jsonData))

	key, err := cid.Decode(request.Key)
	if err != nil {
		return fmt.Errorf("invalid cid: %w", err)
	}

	blk, err := h.bstore.Get(context.Background(), key)
	if err != nil {
		return fmt.Errorf("failed to get block: %w", err)
	}

	if _, err := s.Write(blk.RawData()); err != nil {
		return fmt.Errorf("failed to write block: %w", err)
	}
	logrus.Debugf("Sent block: %s", key)
	return nil
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

	ctx := network.WithAllowLimitedConn(r.Context(), marketGetProtocolID)
	stream, err := h.node.NewStream(ctx, peerInfo.ID, marketGetProtocolID)
	if err != nil {
		return fmt.Errorf("failed to open stream: %w", err)
	}
	defer stream.Close()

	request := BlockRequest{Key: key.String()}
	jsonData, err := json.Marshal(request)
	if err != nil {
		return fmt.Errorf("failed to marshal block request: %w", err)
	}
	_, err = stream.Write(append(jsonData, '\n'))
	logrus.Debugf("Sent block get request: %s", string(jsonData))
	if err != nil {
		return fmt.Errorf("failed to write block request: %w", err)
	}

	var buf [1024]byte
	reader := bufio.NewReader(stream)

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
