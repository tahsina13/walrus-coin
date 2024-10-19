package wallet

import (
	"github.com/btcsuite/btcd/btcutil"
	"github.com/btcsuite/btcd/rpcclient"
)

type WalletService struct {
	Client *rpcclient.Client
}

type GetBalanceArgs struct {
	Account string `json:"account"`
}

type GetBalanceReply struct {
	Balance btcutil.Amount `json:"balance"`
}
