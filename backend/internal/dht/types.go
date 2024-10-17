package dht

import (
	dht "github.com/libp2p/go-libp2p-kad-dht"
	"github.com/libp2p/go-libp2p/core/peer"
	"github.com/tahsina13/walrus-coin/backend/internal/node"
)

type DhtService struct {
	nodeService *node.NodeService
	client      *dht.IpfsDHT
}

type CreateDhtArgs struct{}
type CreateDhtReply struct{}

type CloseDhtArgs struct{}
type CloseDhtReply struct{}

type GetValueArgs struct {
	Key string `json:"key"`
}
type GetValueReply struct {
	Value string `json:"value"`
}

type GetProvidersArgs struct {
	Key   string `json:"key"`
	Count int    `json:"count"`
}
type GetProvidersReply struct {
	Addrs []peer.AddrInfo `json:"addrs"`
}

type PutValueArgs struct {
	Key   string `json:"key"`
	Value string `json:"value"`
}
type PutValueReply struct{}

type PutProviderArgs struct {
	Key string `json:"key"`
}
type PutProviderReply struct{}
