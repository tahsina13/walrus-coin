package util

import (
	"bufio"
	"io"
	"log"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
	"strings"
	"syscall"
)

func GetModuleRoot() (string, error) {
	cmd := exec.Command("go", "env", "GOMOD")
	output, err := cmd.Output()
	if err != nil {
		return "", err
	}
	goModPath := strings.TrimSpace(string(output))
	return filepath.Dir(goModPath), nil
}

func CreateProcess(path string, params ...string) (*exec.Cmd, error) {
	_, err := os.Stat(path)
	if os.IsNotExist(err) {
		return nil, err
	}

	cmd := exec.Command(path, params...)

	sigs := make(chan os.Signal, 1)
	signal.Notify(sigs, syscall.SIGINT, syscall.SIGTERM)
	go func() {
		sig := <-sigs
		cmd.Process.Signal(sig)
	}()

	return cmd, nil
}

func PrintOutput(r io.Reader) {
	scanner := bufio.NewScanner(r)
	for scanner.Scan() {
		log.Println(scanner.Text())
	}
	if err := scanner.Err(); err != nil {
		log.Fatal("printOutput: ", err)
	}
	os.Exit(0)
}
