package main

import (
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/btcsuite/btcd/rpcclient"
	"github.com/gorilla/rpc/v2"
	"github.com/gorilla/rpc/v2/json2"
	"github.com/tahsina13/walrus-coin/backend/internal/coin"
)

const waitTime = 5 * time.Second

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

	if err := coin.InitBtcdDaemon(getBtcdParams()...); err != nil {
		log.Fatal(err)
	}
	time.Sleep(waitTime) // Wait for btcd to start

	if err := coin.InitBtcwalletDaemon(getBtcwalletParams()...); err != nil {
		log.Fatal(err)
	}
	time.Sleep(waitTime)

	sigs := make(chan os.Signal, 1)
	signal.Notify(sigs, syscall.SIGINT, syscall.SIGTERM)
	go func() {
		<-sigs
		coin.ShutdownRPCClient()
	}()

	connCfg := getRPCClientConfig()
	if err := coin.InitRPCClient(connCfg, nil); err != nil {
		log.Fatal(err)
	}

	// Register RPC services here
	s := rpc.NewServer()
	s.RegisterCodec(json2.NewCodec(), "application/json")
	s.RegisterService(&coin.CoinService{}, "")

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

func getRPCClientConfig() *rpcclient.ConnConfig {
	return &rpcclient.ConnConfig{
		Host:       *rpcwallet,
		Endpoint:   "ws",
		User:       *rpcuser,
		Pass:       *rpcpass,
		DisableTLS: *notls,
	}
}
