package coin

import (
	"bufio"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
	"strings"
	"syscall"

	"github.com/btcsuite/btcd/rpcclient"
)

const (
	btcdPath      = "./btcd/btcd"
	btcwalletPath = "./btcwallet/btcwallet"
)

var _rpcclient *rpcclient.Client = nil

func getModuleRoot() (string, error) {
	cmd := exec.Command("go", "env", "GOMOD")
	output, err := cmd.Output()
	if err != nil {
		return "", err
	}
	goModPath := strings.TrimSpace(string(output))
	return filepath.Dir(goModPath), nil
}

func printOutput(r io.Reader) {
	scanner := bufio.NewScanner(r)
	for scanner.Scan() {
		log.Println(scanner.Text())
	}
	if err := scanner.Err(); err != nil {
		log.Fatal("printOutput: ", err)
	}
	os.Exit(0)
}

func createProcess(relPath string, params ...string) (*exec.Cmd, error) {
	modPath, err := getModuleRoot()
	if err != nil {
		return nil, err
	}

	fullPath := filepath.Join(modPath, relPath)
	_, err = os.Stat(fullPath)
	if os.IsNotExist(err) {
		return nil, err
	}

	cmd := exec.Command(fullPath, params...)

	sigs := make(chan os.Signal, 1)
	signal.Notify(sigs, syscall.SIGINT, syscall.SIGTERM)
	go func() {
		sig := <-sigs
		cmd.Process.Signal(sig)
	}()

	return cmd, nil
}

func InitBtcdDaemon(params ...string) (chan struct{}, error) {
	cmd, err := createProcess(btcdPath, params...)
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
	go printOutput(stdout)
	go printOutput(stderr)

	tee := io.TeeReader(stdout, os.Stdout)
	started := make(chan struct{})
	go func() {
		scanner := bufio.NewScanner(tee)
		for scanner.Scan() {
			if strings.Contains(scanner.Text(), "Server listening on") {
				close(started)
				break
			}
		}
	}()
	return started, nil
}

func InitBtcwalletDaemon(params ...string) (chan struct{}, error) {
	cmd, err := createProcess(btcwalletPath, params...)
	if err != nil {
		return nil, fmt.Errorf("InitBtcwalletDaemon: %v", err)
	}

	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return nil, fmt.Errorf("InitBtcwalletDaemon: %v", err)
	}
	stderr, err := cmd.StderrPipe()
	if err != nil {
		return nil, fmt.Errorf("InitBtcwalletDaemon %v", err)
	}

	if err := cmd.Start(); err != nil {
		return nil, fmt.Errorf("InitBtcwalletDaemon: %v", err)
	}
	go printOutput(stdout)
	go printOutput(stderr)

	tee := io.TeeReader(stdout, os.Stdout)
	started := make(chan struct{})
	go func() {
		scanner := bufio.NewScanner(tee)
		for scanner.Scan() {
			if strings.Contains(scanner.Text(), "Opened wallet") {
				close(started)
				break
			}
		}
	}()
	return started, nil
}

func InitRPCClient(config *rpcclient.ConnConfig, ntfnHandlers *rpcclient.NotificationHandlers) error {
	var err error
	_rpcclient, err = rpcclient.New(config, ntfnHandlers)
	if err != nil {
		return fmt.Errorf("InitRPCClient: %v", err)
	}
	log.Println("InitRPCClient: rpc client connected")
	return nil
}

func ShutdownRPCClient() {
	if _rpcclient != nil {
		_rpcclient.Shutdown()
		log.Println("ShutdownRPCClient: rpc client shutdown")
		_rpcclient = nil
	}
}

func (c *CoinService) GetBlockCount(r *http.Request, args *GetBlockCountArgs, reply *GetBlockCountReply) error {
	if _rpcclient == nil {
		return errors.New("GetBlockCount: no btcd rpc client")
	}
	count, err := _rpcclient.GetBlockCount()
	if err != nil {
		return fmt.Errorf("GetBlockCount: %v", err)
	}
	reply.Count = count
	return nil
}

func (c *CoinService) GetPeerInfo(r *http.Request, args *GetPeerInfoArgs, reply *GetPeerInfoReply) error {
	if _rpcclient == nil {
		return errors.New("GetPeerInfo: no btcd rpc client")
	}
	peers, err := _rpcclient.GetPeerInfo()
	if err != nil {
		return fmt.Errorf("GetPeerInfo: %v", err)
	}
	reply.Peers = peers
	return nil
}

func (c *CoinService) AddNode(r *http.Request, args *AddNodeArgs, reply *AddNodeReply) error {
	if _rpcclient == nil {
		return errors.New("AddNode: no btcd rpc client")
	}
	err := _rpcclient.AddNode(args.Host, rpcclient.ANAdd)
	if err != nil {
		return fmt.Errorf("AddNode: %v", err)
	}
	return nil
}

func (c *CoinService) RemoveNode(r *http.Request, args *RemoveNodeArgs, reply *RemoveNodeReply) error {
	if _rpcclient == nil {
		return errors.New("RemoveNode: no btcd rpc client")
	}
	err := _rpcclient.AddNode(args.Host, rpcclient.ANRemove)
	if err != nil {
		return fmt.Errorf("RemoveNode: %v", err)
	}
	return nil
}
