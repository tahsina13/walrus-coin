package coin

import (
	"errors"

	"github.com/btcsuite/btcd/rpcclient"
)

var (
	btcdClient *rpcclient.Client = nil
)

func InitBtcdClient(config *rpcclient.ConnConfig, ntfnHandlers *rpcclient.NotificationHandlers) error {
	var err error
	btcdClient, err = rpcclient.New(config, ntfnHandlers)
	return err
}

func GetBlockCount() (count int64, err error) {
	if btcdClient == nil {
		return 0, errors.New("no btcd rpc client")
	}
	count, err = btcdClient.GetBlockCount()
	if err != nil {
		return 0, err
	}
	return count, nil
}
