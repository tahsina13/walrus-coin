package coin

import (
	"fmt"
	"net/http"
	"os/exec"
	"path/filepath"

	"github.com/btcsuite/btcd/rpcclient"
	"github.com/tahsina13/walrus-coin/backend/internal/util"
)

const btcdPath = "./btcd/btcd"

func InitBtcdDaemon(params ...string) (*exec.Cmd, error) {
	modPath, err := util.GetModuleRoot()
	if err != nil {
		return nil, fmt.Errorf("InitBtcdDaemon: %v", err)
	}

	btcdFullPath := filepath.Join(modPath, btcdPath)
	cmd, err := util.CreateProcess(btcdFullPath, params...)
	if err != nil {
		return nil, fmt.Errorf("InitBtcdDaemon: %v", err)
	}

	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return nil, fmt.Errorf("InitBtcdDaemon: %v", err)
	}
	stderr, err := cmd.StderrPipe()
	if err != nil {
		return nil, fmt.Errorf("InitBtcdDaemon: %v", err)
	}

	if err := cmd.Start(); err != nil {
		return nil, fmt.Errorf("InitBtcdDaemon: %v", err)
	}

	go util.PrintOutput(stdout)
	go util.PrintOutput(stderr)

	return cmd, nil
}

func (c *CoinService) GetBlockCount(r *http.Request, args *GetBlockCountArgs, reply *GetBlockCountReply) error {
	count, err := c.Client.GetBlockCount()
	if err != nil {
		return fmt.Errorf("GetBlockCount: %v", err)
	}
	reply.Count = count
	return nil
}

func (c *CoinService) GetPeerInfo(r *http.Request, args *GetPeerInfoArgs, reply *GetPeerInfoReply) error {
	peers, err := c.Client.GetPeerInfo()
	if err != nil {
		return fmt.Errorf("GetPeerInfo: %v", err)
	}
	reply.Peers = peers
	return nil
}

func (c *CoinService) AddNode(r *http.Request, args *AddNodeArgs, reply *AddNodeReply) error {
	if err := c.Client.AddNode(args.Host, rpcclient.ANAdd); err != nil {
		return fmt.Errorf("AddNode: %v", err)
	}
	return nil
}

func (c *CoinService) RemoveNode(r *http.Request, args *RemoveNodeArgs, reply *RemoveNodeReply) error {
	if err := c.Client.AddNode(args.Host, rpcclient.ANRemove); err != nil {
		return fmt.Errorf("RemoveNode: %v", err)
	}
	return nil
}
