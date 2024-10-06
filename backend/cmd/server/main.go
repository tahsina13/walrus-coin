package main

import (
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/btcsuite/btcd/rpcclient"
	"github.com/tahsina13/walrus-coin/backend/internal/coin"
	"github.com/tahsina13/walrus-coin/backend/internal/handlers"
)

func main() {
	testnet := flag.Bool("testnet", false, "Use testnet")
	simnet := flag.Bool("simnet", false, "Use simnet")
	rpcconnect := flag.String("rpcconnect", "", "Host for RPC connections")
	rpcuser := flag.String("rpcuser", "", "Username for RPC connections")
	rpcpass := flag.String("rpcpass", "", "Password for RPC connections")
	port := flag.Int64("port", 8080, "Port to listen on")

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
	if rpcuser == nil || *rpcuser == "" {
		log.Fatal("No RPC username specified")
		os.Exit(1)
	}
	if rpcpass == nil || *rpcpass == "" {
		log.Fatal("No RPC password specified")
		os.Exit(1)
	}

	connCfg := &rpcclient.ConnConfig{
		Host:       *rpcconnect,
		Endpoint:   "ws",
		User:       *rpcuser,
		Pass:       *rpcpass,
		DisableTLS: true,
	}
	if err := coin.InitBtcdClient(connCfg, nil); err != nil {
		log.Fatal("Failed to init btcd client:", err)
		os.Exit(1)
	}

	http.Handle("/api/coin/", http.StripPrefix("/api/coin", handlers.GetCoinHandler()))
	log.Printf("Starting server on port %d...\n", *port)
	log.Fatal("Server error:", http.ListenAndServe(fmt.Sprintf(":%d", *port), nil))
}
