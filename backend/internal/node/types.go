package node

import (
	"context"

	"github.com/libp2p/go-libp2p/core/host"
	"github.com/libp2p/go-libp2p/core/peer"
	ma "github.com/multiformats/go-multiaddr"
)

type NodeService struct {
	context context.Context
	cancel  context.CancelFunc
	host    host.Host
}

type GetHostInfoArgs struct{}
type GetHostInfoReply struct {
	ID    peer.ID        `json:"id"`
	Addrs []ma.Multiaddr `json:"addrs"`
}

type CreateHostArgs struct {
	NodeID        string `json:"node_id"`
	IPAddr        string `json:"ip_addr"`
	Port          int    `json:"port"`
	RelayAddr     string `json:"relay_addr"`
	BootstrapAddr string `json:"bootstrap_addr"`
}
type CreateHostReply struct {
	ID    peer.ID        `json:"id"`
	Addrs []ma.Multiaddr `json:"addrs"`
}

type CloseHostArgs struct{}
type CloseHostReply struct{}
