package node

import (
	"context"

	"github.com/libp2p/go-libp2p/core/host"
	"github.com/libp2p/go-libp2p/core/peer"
	ma "github.com/multiformats/go-multiaddr"
)

type NodeService struct {
	Host    host.Host
	Context context.Context
	cancel  context.CancelFunc
}

type GetHostInfoArgs struct{}
type GetHostInfoReply struct {
	ID    peer.ID        `json:"id"`
	Addrs []ma.Multiaddr `json:"addrs"`
}

type CreateHostArgs struct {
	NodeID         string   `json:"nodeId"`
	IPAddr         string   `json:"ipAddr"`
	Port           int      `json:"port"`
	RelayAddr      string   `json:"relayAddr"`
	BootstrapAddrs []string `json:"bootstrapAddrs"`
}
type CreateHostReply struct {
	ID    peer.ID        `json:"id"`
	Addrs []ma.Multiaddr `json:"addrs"`
}

type CloseHostArgs struct{}
type CloseHostReply struct{}
