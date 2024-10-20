package dht

import (
	"github.com/ipfs/boxo/blockstore"
	dht "github.com/libp2p/go-libp2p-kad-dht"
	"github.com/libp2p/go-libp2p/core/peer"
	"github.com/tahsina13/walrus-coin/backend/internal/node"
)

type DhtService struct {
	nodeService *node.NodeService
	client      *dht.IpfsDHT
	bstore      blockstore.Blockstore
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

type UploadFileArgs struct {
	Path string `json:"path"`
}
type UploadFileReply struct {
	Cid string `json:"cid"`
}

type DownloadFileArgs struct {
	PeerAddr string `json:"peerAddr"`
	Cid      string `json:"cid"`
	Path     string `json:"path"`
}
type DownloadFileReply struct{}
