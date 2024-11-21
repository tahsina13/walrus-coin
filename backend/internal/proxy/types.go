package proxy

import (
	"github.com/libp2p/go-libp2p/core/peer"
)

type SetProxyRequest struct {
	DestPeerID peer.ID          `json:"id"`
}

type SetProxyResponse struct {
	Status string
}

type StartServerProxyRequest struct{}
type StartServerProxyResponse struct{}
type StopServerProxyRequest struct{}
type StopServerProxyResponse struct{}
