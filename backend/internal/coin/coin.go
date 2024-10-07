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
	btcdPath = "./btcd/btcd"
)

var (
	btcdClient *rpcclient.Client = nil
)

func InitBtcdDaemon(params ...string) (chan struct{}, error) {
	modPath, err := getModuleRoot()
	if err != nil {
		return nil, fmt.Errorf("InitBtcdDaemon: %v", err)
	}

	btcdFullPath := filepath.Join(modPath, btcdPath)
	_, err = os.Stat(btcdFullPath)
	if os.IsNotExist(err) {
		return nil, fmt.Errorf("InitBtcdDaemon: %v", err)
	}

	cmdProcess := exec.Command(btcdFullPath, params...)

	stdout, err := cmdProcess.StdoutPipe()
	if err != nil {
		return nil, fmt.Errorf("InitBtcdDaemon: %v", err)
	}
	stderr, err := cmdProcess.StderrPipe()
	if err != nil {
		return nil, fmt.Errorf("InitBtcdDaemon: %v", err)
	}

	if err := cmdProcess.Start(); err != nil {
		return nil, fmt.Errorf("InitBtcdDaemon: %v", err)
	}
	log.Println("InitBtcdDaemon: btcd started")
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
	go printOutput(stdout)
	go printOutput(stderr)

	sigs := make(chan os.Signal, 1)
	signal.Notify(sigs, syscall.SIGINT, syscall.SIGTERM)
	go func() {
		sig := <-sigs
		log.Println("InitBtcdDaemon: btcd shutdown")
		cmdProcess.Process.Signal(sig)
		stdout.Close()
		stderr.Close()
	}()

	return started, nil
}

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
}

func InitBtcdClient(config *rpcclient.ConnConfig, ntfnHandlers *rpcclient.NotificationHandlers) error {
	var err error
	btcdClient, err = rpcclient.New(config, ntfnHandlers)
	if err != nil {
		return fmt.Errorf("InitBtcdClient: %v", err)
	}
	log.Println("InitBtcdClient: btcd client connected")
	return nil
}

func ShutdownBtcdClient() {
	if btcdClient != nil {
		btcdClient.Shutdown()
		log.Println("ShutdownBtcdClient: btcd client shutdown")
	}
}

func (c *CoinService) GetBlockCount(r *http.Request, args *GetBlockCountArgs, reply *GetBlockCountReply) error {
	if btcdClient == nil {
		return errors.New("GetBlockCount: no btcd rpc client")
	}
	count, err := btcdClient.GetBlockCount()
	if err != nil {
		return fmt.Errorf("GetBlockCount: %v", err)
	}
	reply.Count = count
	return nil
}
