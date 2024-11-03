package main

import (
	"flag"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"github.com/gorilla/rpc/v2"
	"github.com/gorilla/rpc/v2/json2"
	"github.com/sirupsen/logrus"
	"github.com/tahsina13/walrus-coin/backend/internal/dht"
	"github.com/tahsina13/walrus-coin/backend/internal/node"
)

func main() {
	port := flag.Int64("port", 8080, "Port to listen on")
	flag.Parse()

	// Create RPC services here
	nodeService := node.NewNodeService()
	dhtService, err := dht.NewDhtService(nodeService)
	if err != nil {
		logrus.Fatal(err)
	}

	// Register RPC services here
	s := rpc.NewServer()
	s.RegisterCodec(json2.NewCodec(), "application/json")
	s.RegisterService(nodeService, "node")
	s.RegisterService(dhtService, "dht")

	sigs := make(chan os.Signal, 1)
	signal.Notify(sigs, syscall.SIGINT, syscall.SIGTERM)
	go func() {
		<-sigs
		nodeService.Cancel()
		fmt.Println("Shutting down...")
		os.Exit(0)
	}()

	http.Handle("/rpc", s)
	logrus.Infof("Server listening on :%d\n", *port)
	logrus.Fatal(http.ListenAndServe(fmt.Sprintf(":%d", *port), nil))
}
