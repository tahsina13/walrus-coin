package wallet

import "github.com/btcsuite/btcd/rpcclient"

type WalletService struct {
	Client *rpcclient.Client
}
