package main

import (
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"github.com/btcsuite/btcd/rpcclient"
	"github.com/gorilla/rpc/v2"
	"github.com/gorilla/rpc/v2/json2"
	"github.com/tahsina13/walrus-coin/backend/internal/coin"
)

func main() {
	testnet := flag.Bool("testnet", false, "Use testnet")
	simnet := flag.Bool("simnet", false, "Use simnet")
	notls := flag.Bool("notls", true, "Disable TLS")
	port := flag.Int64("port", 8080, "Port to listen on")
	rpcconnect := flag.String("rpcconnect", "", "Host for RPC connections")
	rpcpass := flag.String("rpcpass", "password", "Password for RPC connections")
	rpcuser := flag.String("rpcuser", "user", "Username for RPC connections")

	flag.Parse()

	if testnet != nil && *testnet && simnet != nil && *simnet {
		log.Fatal("Cannot specify both testnet and simnet")
		os.Exit(1)
	}
	if rpcconnect != nil && *rpcconnect == "" {
		if testnet != nil && *testnet {
			*rpcconnect = "localhost:18334"
		} else if simnet != nil && *simnet {
			*rpcconnect = "localhost:18556"
		} else {
			*rpcconnect = "localhost:8334"
		}
	}

	btcdParams := []string{fmt.Sprintf("--rpcuser=%s", *rpcuser), fmt.Sprintf("--rpcpass=%s", *rpcpass)}
	if testnet != nil && *testnet {
		btcdParams = append(btcdParams, "--testnet")
	}
	if simnet != nil && *simnet {
		btcdParams = append(btcdParams, "--simnet")
	}
	if notls != nil && *notls {
		btcdParams = append(btcdParams, "--notls")
	}
	started, err := coin.InitBtcdDaemon(btcdParams...)
	if err != nil {
		log.Fatal(err)
	}

	connCfg := &rpcclient.ConnConfig{
		Host:       *rpcconnect,
		Endpoint:   "ws",
		User:       *rpcuser,
		Pass:       *rpcpass,
		DisableTLS: *notls,
	}
	<-started // Wait for btcd daemon to start
	if err := coin.InitBtcdClient(connCfg, nil); err != nil {
		log.Fatal(err)
	}

	sigs := make(chan os.Signal, 1)
	signal.Notify(sigs, syscall.SIGINT, syscall.SIGTERM)
	go func() {
		<-sigs
		coin.ShutdownBtcdClient()
	}()

	// Register RPC services here
	s := rpc.NewServer()
	s.RegisterCodec(json2.NewCodec(), "application/json")
	s.RegisterService(&coin.CoinService{}, "")

	http.Handle("/rpc", s)
	log.Printf("Server listening on :%d\n", *port)
	log.Fatal(http.ListenAndServe(fmt.Sprintf(":%d", *port), nil))
}
