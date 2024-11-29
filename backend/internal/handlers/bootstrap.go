package handlers

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"

	"github.com/libp2p/go-libp2p/core/host"
	"github.com/libp2p/go-libp2p/core/peer"
	"github.com/libp2p/go-libp2p/core/peerstore"
	"github.com/sirupsen/logrus"
	"github.com/tahsina13/walrus-coin/backend/internal/util"
)

type BootstrapHandler struct {
	node host.Host
}

type bootstrapResponse struct {
	Peers []peer.AddrInfo `json:"Peers"`
}

type bootstrapError struct {
	Message string `json:"Message"`
}

func NewBootstrapHandler(node host.Host) (*BootstrapHandler, error) {
	if node == nil {
		return nil, errors.New("host is nil")
	}
	return &BootstrapHandler{
		node: node,
	}, nil
}

func (h *BootstrapHandler) Add(w http.ResponseWriter, r *http.Request) error {
	query := r.URL.Query()
	peerAddr, ok := query["arg"]
	if !ok {
		return util.BadRequestWithBody(bootstrapError{Message: "no bootstrap peers to add"})
	}

	addrInfo, err := peer.AddrInfoFromString(peerAddr[0])
	if err != nil {
		return util.BadRequestWithBody(bootstrapError{Message: fmt.Sprintf("failed to parse peer address: %v", err)})
	}
	logrus.Debug("Adding peer: ", addrInfo)

	h.node.Peerstore().AddAddrs(addrInfo.ID, addrInfo.Addrs, peerstore.PermanentAddrTTL)
	if err := h.node.Connect(r.Context(), *addrInfo); err != nil {
		return util.BadRequestWithBody(bootstrapError{Message: fmt.Sprintf("failed to connect to peer: %v", err)})
	}

	response := bootstrapResponse{Peers: []peer.AddrInfo{*addrInfo}}
	if err := json.NewEncoder(w).Encode(response); err != nil {
		return util.BadRequest(err)
	}
	return nil
}

func (h *BootstrapHandler) List(w http.ResponseWriter, r *http.Request) error {
	var peerAddrs []peer.AddrInfo
	for _, id := range h.node.Network().Peers() {
		peerAddrs = append(peerAddrs, h.node.Peerstore().PeerInfo(id))
	}
	response := bootstrapResponse{Peers: peerAddrs}
	if err := json.NewEncoder(w).Encode(response); err != nil {
		return util.BadRequest(err)
	}
	return nil
}

func (h *BootstrapHandler) Remove(w http.ResponseWriter, r *http.Request) error {
	query := r.URL.Query()
	peerAddr, ok := query["arg"]
	if !ok {
		return util.BadRequestWithBody(bootstrapError{Message: "no bootstrap peers to remove"})
	}

	addrInfo, err := peer.AddrInfoFromString(peerAddr[0])
	if err != nil {
		return util.BadRequestWithBody(bootstrapError{Message: fmt.Sprintf("failed to parse peer address: %v", err)})
	}
	logrus.Debug("Removing peer: ", addrInfo)

	h.node.Peerstore().ClearAddrs(addrInfo.ID)
	h.node.Network().ClosePeer(addrInfo.ID)

	response := bootstrapResponse{Peers: []peer.AddrInfo{*addrInfo}}
	if err := json.NewEncoder(w).Encode(response); err != nil {
		return util.BadRequest(err)
	}
	return nil
}
