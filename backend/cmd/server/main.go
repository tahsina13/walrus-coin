package main

import (
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"
	"github.com/btcsuite/btcd/rpcclient"
	"github.com/gorilla/rpc/v2"
	"github.com/gorilla/rpc/v2/json2"

	// "github.com/tahsina13/walrus-coin/backend/internal/coin"
	// "github.com/tahsina13/walrus-coin/backend/internal/wallet"
	"github.com/tahsina13/walrus-coin/backend/internal/dht"
)

const waitTime = 2 * time.Second

var (
	testnet   *bool   = flag.Bool("testnet", false, "Use testnet")
	simnet    *bool   = flag.Bool("simnet", false, "Use simnet")
	notls     *bool   = flag.Bool("notls", true, "Disable TLS for btcd and btcwallet")
	rpcbtcd   *string = flag.String("rpcbtcd", "", "Host for btcd RPC connections")
	rpcwallet *string = flag.String("rpcwallet", "", "Host for btcwallet RPC connections")
	rpcpass   *string = flag.String("rpcpass", "password", "Password for RPC connections")
	rpcuser   *string = flag.String("rpcuser", "user", "Username for RPC connections")
	port      *int64  = flag.Int64("port", 8080, "Port to listen on")
)

func main() {
	parseFlags()

	// btcdCmd, err := coin.InitBtcdDaemon(getBtcdParams()...)
	// if err != nil {
	// 	log.Fatal(err)
	// }
	// time.Sleep(waitTime) // Wait for btcd to start

	// btcwalletCmd, err := wallet.InitBtcwalletDaemon(getBtcwalletParams()...)
	// if err != nil {
	// 	log.Fatal(err)
	// }
	// time.Sleep(waitTime) // Wait for btcwallet to start

	dht.InitDHT()
	time.Sleep(waitTime) // Wait for DHT to start

	// btcdClient, err := rpcclient.New(getBtcdRPCClientConfig(), nil)
	// if err != nil {
	// 	btcdCmd.Process.Kill()
	// 	btcwalletCmd.Process.Kill()
	// 	log.Fatal(err)
	// }

	// btcwalletClient, err := rpcclient.New(getBtcwalletRPCClientConfig(), nil)
	// if err != nil {
	// 	btcdCmd.Process.Kill()
	// 	btcwalletCmd.Process.Kill()
	// 	btcdClient.Shutdown()
	// 	log.Fatal(err)
	// }

	// Register RPC services here
	s := rpc.NewServer()
	s.RegisterCodec(json2.NewCodec(), "application/json")
	// s.RegisterService(&coin.CoinService{Client: btcdClient}, "")
	// s.RegisterService(&wallet.WalletService{Client: btcwalletClient}, "")
	s.RegisterService(&dht.DHTClient{}, "DHTClient")

	http.Handle("/rpc", s)
	log.Printf("Server listening on :%d\n", *port)
	log.Fatal(http.ListenAndServe(fmt.Sprintf(":%d", *port), nil))
}

func parseFlags() {
	flag.Parse()

	if testnet != nil && *testnet && simnet != nil && *simnet {
		log.Fatal("Cannot specify both testnet and simnet")
		os.Exit(1)
	}
	if testnet != nil && *testnet {
		*rpcbtcd = "127.0.0.1:18334"
		*rpcwallet = "127.0.0.1:18332"
	}
	if simnet != nil && *simnet {
		*rpcbtcd = "127.0.0.1:18556"
		*rpcwallet = "127.0.0.1:18554"
	}
	if rpcbtcd != nil && *rpcbtcd == "" {
		*rpcbtcd = "127.0.0.1:8334"
	}
	if rpcwallet != nil && *rpcwallet == "" {
		*rpcwallet = "127.0.0.1:8332"
	}
}

func getBtcdParams() []string {
	params := []string{
		fmt.Sprintf("-u=%s", *rpcuser),
		fmt.Sprintf("-P=%s", *rpcpass),
		fmt.Sprintf("--rpclisten=%s", *rpcbtcd),
	}
	if testnet != nil && *testnet {
		params = append(params, "--testnet")
	}
	if simnet != nil && *simnet {
		params = append(params, "--simnet")
	}
	if notls != nil && *notls {
		params = append(params, "--notls")
	}
	return params
}

func getBtcwalletParams() []string {
	params := []string{
		fmt.Sprintf("-u=%s", *rpcuser),
		fmt.Sprintf("-P=%s", *rpcpass),
		fmt.Sprintf("--rpcconnect=%s", *rpcbtcd),
		fmt.Sprintf("--rpclisten=%s", *rpcwallet),
	}
	if testnet != nil && *testnet {
		params = append(params, "--testnet")
	}
	if simnet != nil && *simnet {
		params = append(params, "--simnet")
	}
	if notls != nil && *notls {
		params = append(params, "--noclienttls")
		params = append(params, "--noservertls")
	}
	return params
}

func getBtcdRPCClientConfig() *rpcclient.ConnConfig {
	return &rpcclient.ConnConfig{
		Host:       *rpcbtcd,
		Endpoint:   "ws",
		User:       *rpcuser,
		Pass:       *rpcpass,
		DisableTLS: *notls,
	}
}

func getBtcwalletRPCClientConfig() *rpcclient.ConnConfig {
	return &rpcclient.ConnConfig{
		Host:       *rpcwallet,
		Endpoint:   "ws",
		User:       *rpcuser,
		Pass:       *rpcpass,
		DisableTLS: *notls,
	}
}
