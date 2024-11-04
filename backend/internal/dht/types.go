package dht

import (
	"github.com/ipfs/boxo/blockstore"
	format "github.com/ipfs/go-ipld-format"
	dht "github.com/libp2p/go-libp2p-kad-dht"
	"github.com/libp2p/go-libp2p/core/peer"
	"github.com/tahsina13/walrus-coin/backend/internal/node"
)

type DhtService struct {
	nodeService *node.NodeService
	client      *dht.IpfsDHT
	bstore      blockstore.Blockstore
	dagService  format.NodeGetter
}

type InitDhtArgs struct{}
type InitDhtReply struct{}

type CloseDhtArgs struct{}
type CloseDhtReply struct{}

type GetValueArgs struct {
	Key string `json:"key"`
}
type GetValueReply struct {
	Value string `json:"value"`
}

type GetProvidersArgs struct {
	Cid   string `json:"cid"`
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
	Cid string `json:"cid"`
}
type PutProviderReply struct{}

type UploadArgs struct {
	Name string `json:"name"`
}
type UploadReply struct {
	Cid string `json:"cid"`
}

type DownloadArgs struct {
	PeerAddr string `json:"peerAddr"`
	Cid      string `json:"cid"`
	Name     string `json:"name"`
}
type DownloadReply struct{}
