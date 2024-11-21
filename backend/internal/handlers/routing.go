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
)

type RoutingHandler struct {
	dht *dht.IpfsDHT
}

type RoutingResponse struct {
	Responses []peer.AddrInfo `json:"Responses"`
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
		return errors.New("argument \"peerID\" is required")
	}

	peerInfo, err := h.dht.FindPeer(r.Context(), peer.ID(peerID[0]))
	if err != nil {
		return err
	}

	response := RoutingResponse{Responses: []peer.AddrInfo{peerInfo}}
	if err := json.NewEncoder(w).Encode(response); err != nil {
		return err
	}
	return nil
}

func (h *RoutingHandler) FindProvos(w http.ResponseWriter, r *http.Request) error {
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

	var numProviders int
	if numProvidersStr, ok := query["num-providers"]; ok {
		val, err := strconv.Atoi(numProvidersStr[0])
		if err != nil {
			return err
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

	response := RoutingResponse{Responses: addrs}
	if err := json.NewEncoder(w).Encode(response); err != nil {
		return err
	}
	return nil
}

func (h *RoutingHandler) Provide(w http.ResponseWriter, r *http.Request) error {
	query := r.URL.Query()
	var key cid.Cid
	if arg, ok := query["arg"]; ok {
		c, err := cid.Decode(arg[0])
		if err != nil {
			return fmt.Errorf("invalid cid: %w", err)
		}
		key = c
	} else {
		return fmt.Errorf("argument \"key\" is required")
	}

	if err := h.dht.Provide(r.Context(), key, true); err != nil {
		return fmt.Errorf("failed to provide key: %w", err)
	}

	response := RoutingResponse{}
	if err := json.NewEncoder(w).Encode(response); err != nil {
		return err
	}
	return nil
}
