package handlers

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strconv"

	"github.com/ipfs/go-cid"
	dht "github.com/libp2p/go-libp2p-kad-dht"
	"github.com/libp2p/go-libp2p/core/peer"
	"github.com/tahsina13/walrus-coin/backend/internal/util"
)

type RoutingHandler struct {
	dht *dht.IpfsDHT
}

type routingResponse struct {
	Responses []peer.AddrInfo `json:"Responses"`
}

type routingError struct {
	Message string `json:"Message"`
}

func NewRoutingHandler(dht *dht.IpfsDHT) (*RoutingHandler, error) {
	if dht == nil {
		return nil, errors.New("dht is nil")
	}
	return &RoutingHandler{dht: dht}, nil
}

func (h *RoutingHandler) FindPeer(w http.ResponseWriter, r *http.Request) error {
	query := r.URL.Query()
	peerID, ok := query["arg"]
	if !ok {
		return util.BadRequestWithBody(routingError{Message: "no peer ID provided"})
	}

	peerInfo, err := h.dht.FindPeer(r.Context(), peer.ID(peerID[0]))
	if err != nil {
		return util.BadRequestWithBody(routingError{Message: fmt.Sprintf("failed to find peer: %v", err)})
	}

	response := routingResponse{Responses: []peer.AddrInfo{peerInfo}}
	if err := json.NewEncoder(w).Encode(response); err != nil {
		return util.BadRequest(err)
	}
	return nil
}

func (h *RoutingHandler) FindProvos(w http.ResponseWriter, r *http.Request) error {
	query := r.URL.Query()

	var key cid.Cid
	if arg, ok := query["arg"]; ok {
		c, err := cid.Decode(arg[0])
		if err != nil {
			return util.BadRequestWithBody(routingError{Message: fmt.Sprintf("invalid cid: %v", err)})
		}
		key = c
	} else {
		return util.BadRequestWithBody(routingError{Message: "argument \"key\" is required"})
	}

	var numProviders int
	if numProvidersStr, ok := query["num-providers"]; ok {
		val, err := strconv.Atoi(numProvidersStr[0])
		if err != nil {
			return util.BadRequestWithBody(routingError{Message: fmt.Sprintf("invalid num-providers: %v", err)})
		}
		numProviders = val
	} else {
		numProviders = 20
	}

	var addrs []peer.AddrInfo
	for p := range h.dht.FindProvidersAsync(r.Context(), key, numProviders) {
		if p.ID == peer.ID("") {
			break
		}
		addrs = append(addrs, p)
	}

	response := routingResponse{Responses: addrs}
	if err := json.NewEncoder(w).Encode(response); err != nil {
		return util.BadRequest(err)
	}
	return nil
}

func (h *RoutingHandler) Provide(w http.ResponseWriter, r *http.Request) error {
	query := r.URL.Query()
	var key cid.Cid
	if arg, ok := query["arg"]; ok {
		c, err := cid.Decode(arg[0])
		if err != nil {
			return util.BadRequestWithBody(routingError{Message: fmt.Sprintf("invalid cid: %v", err)})
		}
		key = c
	} else {
		return util.BadRequestWithBody(routingError{Message: "argument \"key\" is required"})
	}

	if err := h.dht.Provide(r.Context(), key, true); err != nil {
		return util.BadRequestWithBody(routingError{Message: fmt.Sprintf("failed to provide key: %v", err)})
	}

	response := routingResponse{}
	if err := json.NewEncoder(w).Encode(response); err != nil {
		return util.BadRequest(err)
	}
	return nil
}
