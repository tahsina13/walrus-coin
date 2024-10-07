package coin

import "github.com/btcsuite/btcd/btcjson"

type CoinService struct{}

type GetBlockCountArgs struct{}
type GetBlockCountReply struct {
	Count int64 `json:"count"`
}

type GetPeerInfoArgs struct{}
type GetPeerInfoReply struct {
	Peers []btcjson.GetPeerInfoResult `json:"peers"`
}
