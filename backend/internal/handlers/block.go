package handlers

import (
	"bufio"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strconv"

	"github.com/ipfs/boxo/blockstore"
	blocks "github.com/ipfs/go-block-format"
	"github.com/ipfs/go-cid"
	ds "github.com/ipfs/go-datastore"
	leveldb "github.com/ipfs/go-ds-leveldb"
	"github.com/libp2p/go-libp2p/core/host"
	"github.com/libp2p/go-libp2p/core/network"
	"github.com/libp2p/go-libp2p/core/peer"
	"github.com/sirupsen/logrus"
	"github.com/tahsina13/walrus-coin/backend/internal/util"
)

const (
	getBlockProtocolID  = "/orcanet/block/get"
	statBlockProtocolID = "/orcanet/block/stat"
)

type BlockHandler struct {
	node   host.Host
	dstore *leveldb.Datastore
	bstore blockstore.Blockstore
}

type blockRequest struct {
	Key string `json:"Key"`
}

type blockMetadata struct {
	Name  string  `json:"Name"`
	Price float64 `json:"Price"`
}

type blockResponse struct {
	Key  string `json:"Key"`
	Size int    `json:"Size,omitempty"`
	blockMetadata
}

type blockError struct {
	Message string `json:"Message"`
}

func NewBlockHandler(node host.Host, dstore *leveldb.Datastore) (*BlockHandler, error) {
	if node == nil {
		return nil, errors.New("node is nil")
	}
	if dstore == nil {
		return nil, errors.New("datastore is nil")
	}
	bstore := blockstore.NewBlockstore(dstore)
	handler := &BlockHandler{node: node, dstore: dstore, bstore: bstore}
	node.SetStreamHandler(getBlockProtocolID, handler.handleGet)
	node.SetStreamHandler(statBlockProtocolID, handler.handleStat)
	return handler, nil
}

func (h *BlockHandler) handleGet(s network.Stream) {
	defer s.Close()

	reader := bufio.NewReader(s)
	jsonData, err := reader.ReadBytes('\n')
	if err != nil {
		response := blockError{Message: fmt.Sprintf("failed to read block request: %s", err)}
		if err := json.NewEncoder(s).Encode(response); err != nil {
			logrus.Errorf("failed to write error response: %s", err)
			return
		}
	}

	var request blockRequest
	if err := json.Unmarshal(jsonData, &request); err != nil {
		response := blockError{Message: fmt.Sprintf("failed to unmarshal block request: %s", err)}
		if err := json.NewEncoder(s).Encode(response); err != nil {
			logrus.Errorf("failed to write error response: %s", err)
			return
		}
	}

	key, err := cid.Decode(request.Key)
	if err != nil {
		response := blockError{Message: fmt.Sprintf("invalid cid: %s", err)}
		if err := json.NewEncoder(s).Encode(response); err != nil {
			logrus.Errorf("failed to write error response: %s", err)
			return
		}
	}

	blk, err := h.bstore.Get(context.Background(), key)
	if err != nil {
		response := blockError{Message: fmt.Sprintf("failed to get block: %s", err)}
		if err := json.NewEncoder(s).Encode(response); err != nil {
			logrus.Errorf("failed to write error response: %s", err)
			return
		}
	}

	response := blockResponse{Key: key.String()}
	bytes, _ := json.Marshal(response)
	bytes = append(bytes, '\n')
	bytes = append(bytes, blk.RawData()...)

	for len(bytes) > 0 {
		n, err := s.Write(bytes)
		if err != nil {
			logrus.Errorf("failed to write block: %s", err)
			return
		}
		bytes = bytes[n:]
	}
}

func (h *BlockHandler) getBlockResponse(key cid.Cid) (*blockResponse, error) {
	var metadata blockMetadata
	jsonData, err := h.dstore.Get(context.Background(), ds.NewKey(key.String()))
	if err != nil {
		return nil, fmt.Errorf("failed to get block metadata: %w", err)
	}
	if err := json.Unmarshal(jsonData, &metadata); err != nil {
		return nil, fmt.Errorf("failed to unmarshal block metadata: %w", err)
	}

	size, err := h.bstore.GetSize(context.Background(), key)
	if err != nil {
		return nil, fmt.Errorf("failed to get block size: %w", err)
	}

	return &blockResponse{Key: key.String(), Size: size, blockMetadata: metadata}, nil
}

func (h *BlockHandler) handleStat(s network.Stream) {
	defer s.Close()

	reader := bufio.NewReader(s)
	jsonData, err := reader.ReadBytes('\n')
	if err != nil {
		response := blockError{Message: fmt.Sprintf("failed to read block request: %s", err)}
		if err := json.NewEncoder(s).Encode(response); err != nil {
			logrus.Errorf("failed to write error response: %s", err)
			return
		}
	}

	var request blockRequest
	if err := json.Unmarshal(jsonData, &request); err != nil {
		response := blockError{Message: fmt.Sprintf("failed to unmarshal block request: %s", err)}
		if err := json.NewEncoder(s).Encode(response); err != nil {
			logrus.Errorf("failed to write error response: %s", err)
			return
		}
	}

	key, err := cid.Decode(request.Key)
	if err != nil {
		response := blockError{Message: fmt.Sprintf("invalid cid: %s", err)}
		if err := json.NewEncoder(s).Encode(response); err != nil {
			logrus.Errorf("failed to write error response: %s", err)
			return
		}
	}

	response, err := h.getBlockResponse(key)
	if err != nil {
		responseErr := blockError{Message: err.Error()}
		if err := json.NewEncoder(s).Encode(responseErr); err != nil {
			logrus.Errorf("failed to write error response: %s", err)
			return
		}
	}
	if err := json.NewEncoder(s).Encode(response); err != nil {
		logrus.Errorf("failed to write response: %s", err)
		return
	}
}

func (h *BlockHandler) Get(w http.ResponseWriter, r *http.Request) error {
	query := r.URL.Query()

	var key cid.Cid
	if arg, ok := query["arg"]; ok {
		c, err := cid.Decode(arg[0])
		if err != nil {
			return util.BadRequestWithBody(blockError{Message: fmt.Sprintf("invalid cid: %v", err)})
		}
		key = c
	} else {
		return util.BadRequestWithBody(blockError{Message: "argument 'key' is required"})
	}

	peerAddr, ok := query["peer"]
	if !ok {
		// Query local blockstore if peer not specified
		blk, err := h.bstore.Get(r.Context(), key)
		if err != nil {
			return util.BadRequestWithBody(blockError{Message: fmt.Sprintf("failed to get block: %v", err)})
		}
		if _, err := w.Write(blk.RawData()); err != nil {
			return util.BadRequestWithBody(blockError{Message: fmt.Sprintf("failed to write block: %v", err)})
		}
		return nil
	}

	peerInfo, err := peer.AddrInfoFromString(peerAddr[0])
	if err != nil {
		return util.BadRequestWithBody(blockError{Message: fmt.Sprintf("failed to parse peer address: %v", err)})
	}

	ctx := network.WithAllowLimitedConn(r.Context(), getBlockProtocolID)
	stream, err := h.node.NewStream(ctx, peerInfo.ID, getBlockProtocolID)
	if err != nil {
		return util.BadRequestWithBody(blockError{Message: fmt.Sprintf("failed to open stream: %v", err)})
	}
	defer stream.Close()

	request := blockRequest{Key: key.String()}
	jsonData, err := json.Marshal(request)
	if err != nil {
		return util.BadRequestWithBody(blockError{Message: fmt.Sprintf("failed to marshal block request: %v", err)})
	}
	_, err = stream.Write(append(jsonData, '\n'))
	logrus.Debugf("Sent block get request: %s", string(jsonData))
	if err != nil {
		return util.BadRequestWithBody(blockError{Message: fmt.Sprintf("failed to write block request: %v", err)})
	}

	reader := bufio.NewReader(stream)
	jsonData, err = reader.ReadBytes('\n')
	if err != nil {
		return util.BadRequestWithBody(blockError{Message: fmt.Sprintf("failed to read response: %v", err)})
	}

	var data map[string]interface{}
	if err := json.Unmarshal(jsonData, &data); err != nil {
		return util.BadRequestWithBody(blockError{Message: fmt.Sprintf("failed to unmarshal response: %v", err)})
	}

	if mesg, ok := data["Message"]; ok {
		return util.BadRequestWithBody(blockError{Message: mesg.(string)})
	}

	var response blockResponse
	if err := json.Unmarshal(jsonData, &response); err != nil {
		return util.BadRequestWithBody(blockError{Message: fmt.Sprintf("failed to unmarshal response: %v", err)})
	}

	var buf [1024]byte
	for {
		n, err := reader.Read(buf[:])
		if err != nil {
			if err == io.EOF {
				break
			}
			return util.BadRequestWithBody(blockError{Message: fmt.Sprintf("failed to read block: %v", err)})
		}
		if _, err := w.Write(buf[:n]); err != nil {
			return util.BadRequestWithBody(blockError{Message: fmt.Sprintf("failed to write block: %v", err)})
		}
	}
	logrus.Debugf("Received block: %s", key)

	return nil
}

func (h *BlockHandler) Put(w http.ResponseWriter, r *http.Request) error {
	query := r.URL.Query()

	if err := r.ParseMultipartForm(10 << 20); err != nil {
		return util.BadRequestWithBody(blockError{Message: fmt.Sprintf("failed to parse multipart form: %v", err)})
	}

	files := r.MultipartForm.File["data"]
	for i, fileHeader := range files {
		file, err := fileHeader.Open()
		if err != nil {
			return util.BadRequestWithBody(blockError{Message: fmt.Sprintf("failed to open file: %v", err)})
		}
		defer file.Close()

		var price float64
		if arg, ok := query["price"]; ok && i < len(arg) {
			val, err := strconv.ParseFloat(arg[i], 64)
			if err != nil {
				return util.BadRequestWithBody(blockError{Message: fmt.Sprintf("invalid price: %v", err)})
			}
			price = val
		} else {
			price = 0
		}

		data, err := io.ReadAll(file)
		if err != nil {
			return util.BadRequestWithBody(blockError{Message: fmt.Sprintf("failed to read file: %v", err)})
		}

		blk := blocks.NewBlock(data)
		metadata := blockMetadata{Name: fileHeader.Filename, Price: price}

		cidKey := ds.NewKey(blk.Cid().String())
		jsonData, _ := json.Marshal(metadata)

		if err := h.dstore.Put(r.Context(), cidKey, jsonData); err != nil {
			return util.BadRequestWithBody(blockError{Message: fmt.Sprintf("failed to put block metadata: %v", err)})
		}
		if err := h.bstore.Put(r.Context(), blk); err != nil {
			return util.BadRequestWithBody(blockError{Message: fmt.Sprintf("failed to put block: %v", err)})
		}

		response := blockResponse{Key: blk.Cid().String(), Size: len(data), blockMetadata: metadata}
		if err := json.NewEncoder(w).Encode(response); err != nil {
			return util.BadRequest(err)
		}
	}
	return nil
}

func (h *BlockHandler) Remove(w http.ResponseWriter, r *http.Request) error {
	query := r.URL.Query()

	var key cid.Cid
	if arg, ok := query["arg"]; ok {
		c, err := cid.Decode(arg[0])
		if err != nil {
			return util.BadRequestWithBody(blockError{Message: fmt.Sprintf("invalid cid: %v", err)})
		}
		key = c
	} else {
		return util.BadRequestWithBody(blockError{Message: "argument 'key' is required"})
	}

	if err := h.dstore.Delete(r.Context(), ds.NewKey(key.String())); err != nil {
		return util.BadRequestWithBody(blockError{Message: fmt.Sprintf("failed to delete block metadata: %v", err)})
	}
	if err := h.bstore.DeleteBlock(r.Context(), key); err != nil {
		return util.BadRequestWithBody(blockError{Message: fmt.Sprintf("failed to delete block: %v", err)})
	}

	response := blockResponse{Key: key.String()}
	if err := json.NewEncoder(w).Encode(response); err != nil {
		return util.BadRequest(err)
	}
	return nil
}

func (h *BlockHandler) Stat(w http.ResponseWriter, r *http.Request) error {
	query := r.URL.Query()

	var key cid.Cid
	if arg, ok := query["arg"]; ok {
		c, err := cid.Decode(arg[0])
		if err != nil {
			return util.BadRequestWithBody(blockError{Message: fmt.Sprintf("invalid cid: %v", err)})
		}
		key = c
	} else {
		return util.BadRequestWithBody(blockError{Message: "argument 'key' is required"})
	}

	peerAddr, ok := query["peer"]
	if !ok {
		// Query local blockstore if peer not specified
		response, err := h.getBlockResponse(key)
		if err != nil {
			return util.BadRequestWithBody(blockError{Message: err.Error()})
		}
		if err := json.NewEncoder(w).Encode(response); err != nil {
			return util.BadRequest(err)
		}
		return nil
	}

	peerInfo, err := peer.AddrInfoFromString(peerAddr[0])
	if err != nil {
		return util.BadRequestWithBody(blockError{Message: fmt.Sprintf("failed to parse peer address: %v", err)})
	}

	ctx := network.WithAllowLimitedConn(r.Context(), statBlockProtocolID)
	stream, err := h.node.NewStream(ctx, peerInfo.ID, statBlockProtocolID)
	if err != nil {
		return util.BadRequestWithBody(blockError{Message: fmt.Sprintf("failed to open stream: %v", err)})
	}
	defer stream.Close()

	request := blockRequest{Key: key.String()}
	jsonData, err := json.Marshal(request)
	if err != nil {
		return util.BadRequestWithBody(blockError{Message: fmt.Sprintf("failed to marshal block request: %v", err)})
	}
	_, err = stream.Write(append(jsonData, '\n'))
	logrus.Debugf("Sent block stat request: %s", string(jsonData))
	if err != nil {
		return util.BadRequestWithBody(blockError{Message: fmt.Sprintf("failed to write block request: %v", err)})
	}

	reader := bufio.NewReader(stream)
	jsonData, err = reader.ReadBytes('\n')
	if err != nil {
		return util.BadRequestWithBody(blockError{Message: fmt.Sprintf("failed to read response: %v", err)})
	}

	var data map[string]interface{}
	if err := json.Unmarshal(jsonData, &data); err != nil {
		return util.BadRequestWithBody(blockError{Message: fmt.Sprintf("failed to unmarshal response: %v", err)})
	}

	if mesg, ok := data["Message"]; ok {
		return util.BadRequestWithBody(blockError{Message: mesg.(string)})
	}

	var response blockResponse
	if err := json.Unmarshal(jsonData, &response); err != nil {
		return util.BadRequestWithBody(blockError{Message: fmt.Sprintf("failed to unmarshal response: %v", err)})
	}

	if err := json.NewEncoder(w).Encode(response); err != nil {
		return util.BadRequest(err)
	}
	return nil
}
