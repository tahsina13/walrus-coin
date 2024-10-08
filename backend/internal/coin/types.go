package coin

import (
	"github.com/btcsuite/btcd/btcjson"
	"github.com/btcsuite/btcd/btcutil"
	"github.com/btcsuite/btcd/rpcclient"
)

type CoinService struct {
	Client *rpcclient.Client
}

type GetBlockCountArgs struct{}
type GetBlockCountReply struct {
	Count int64 `json:"count"`
}

type GetPeerInfoArgs struct{}
type GetPeerInfoReply struct {
	Peers []btcjson.GetPeerInfoResult `json:"peers"`
}

type AddNodeArgs struct {
	Host string `json:"host"`
}
type AddNodeReply struct{}

type RemoveNodeArgs struct {
	Host string `json:"host"`
}
type RemoveNodeReply struct{}

type GetNewAddressArgs struct{}
type GetNewAddressReply struct {
	Address string `json:"address"`
}

type SendFromArgs struct {
	Account string         `json:"fromaccount"`
	Address string         `json:"toaddress"`
	Amount  btcutil.Amount `json:"amount"`
}
type SendFromReply struct {
	Hash string `json:"hash"`
}
