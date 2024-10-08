package wallet

import (
	"fmt"
	"os/exec"
	"path/filepath"

	"github.com/tahsina13/walrus-coin/backend/internal/util"
)

const btcwalletPath = "./btcwallet/btcwallet"

func InitBtcwalletDaemon(params ...string) (*exec.Cmd, error) {
	modPath, err := util.GetModuleRoot()
	if err != nil {
		return nil, fmt.Errorf("InitBtcwalletDaemon: %v", err)
	}

	btcwalletFullPath := filepath.Join(modPath, btcwalletPath)
	cmd, err := util.CreateProcess(btcwalletFullPath, params...)
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

	go util.PrintOutput(stdout)
	go util.PrintOutput(stderr)

	return cmd, nil
}
