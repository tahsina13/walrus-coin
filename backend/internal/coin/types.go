package coin

import (
	"github.com/btcsuite/btcd/btcjson"
	"github.com/btcsuite/btcd/btcutil"
)

type CoinService struct{}

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

type GetBalanceArgs struct {
	Account string `json:"account"`
}
type SendFromArgs struct {
	Account string          `json:"fromaccount"`
	Address btcutil.Address `json:"toaddress"`
	Amount  btcutil.Amount  `json:"amount"`
}
