package main

import (
	"bytes"
	"context"
	"crypto/sha256"
	"flag"
	"fmt"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/ipfs/boxo/blockstore"
	"github.com/ipfs/go-datastore"
	ds "github.com/ipfs/go-datastore/sync"
	"github.com/libp2p/go-libp2p"
	dht "github.com/libp2p/go-libp2p-kad-dht"
	record "github.com/libp2p/go-libp2p-record"
	"github.com/libp2p/go-libp2p/core/crypto"
	"github.com/libp2p/go-libp2p/core/host"
	"github.com/libp2p/go-libp2p/core/peer"
	"github.com/libp2p/go-libp2p/core/peerstore"
	"github.com/libp2p/go-libp2p/p2p/protocol/circuitv2/client"
	"github.com/multiformats/go-multiaddr"
	"github.com/sirupsen/logrus"
	"github.com/tahsina13/walrus-coin/backend/internal/routers"
	"github.com/tahsina13/walrus-coin/backend/internal/util"
)

func main() {
	port := flag.Int64("port", 5001, "Port to listen on")
	seed := flag.String("seed", "", "Seed for private key generation")
	relayAddr := flag.String("relayAddr", "", "Relay address")
	debug := flag.Bool("debug", false, "Enable debug logging")
	flag.Parse()

	if debug != nil && *debug {
		logrus.SetLevel(logrus.DebugLevel)
	}

	node, err := createNode(*seed, *relayAddr)
	if err != nil {
		logrus.Fatal(err)
	}
	defer node.Close()
	logrus.Infof("Node ID: %s", node.ID())
	logrus.Infof("Node multiaddress: %s", node.Addrs())

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	if err := connectToPeer(node, ctx, *relayAddr); err != nil {
		logrus.Fatal(err)
	}
	logrus.Infof("Connected to relay: %s", *relayAddr)

	if err := makeReservation(node, ctx, *relayAddr); err != nil {
		logrus.Fatal(err)
	}
	logrus.Infof("Made reservation with relay: %s", *relayAddr)

	dht, bstore, err := createDht(ctx, node)
	if err != nil {
		logrus.Fatal(err)
	}
	defer dht.Close()
	logrus.Info("Created DHT client")

	apiRouter, err := routers.NewAPIRouter(node, dht, bstore)
	if err != nil {
		logrus.Fatal(err)
	}

	mux := mux.NewRouter()
	mux.PathPrefix("/api/v0").Handler(http.StripPrefix("/api/v0", apiRouter))

	server := &http.Server{
		Addr:    fmt.Sprintf(":%d", *port),
		Handler: util.LoggerMiddleware(mux),
	}

	logrus.Infof("Server listening on port :%d", *port)
	logrus.Fatal(server.ListenAndServe())
}

func generatePrivateKeyFromSeed(seed []byte) (crypto.PrivKey, error) {
	hash := sha256.Sum256(seed)
	privKey, _, err := crypto.GenerateEd25519Key(
		bytes.NewReader(hash[:]),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to generate private key: %w", err)
	}
	return privKey, nil
}

func connectToPeer(h host.Host, ctx context.Context, peerAddr string) error {
	addrInfo, err := peer.AddrInfoFromString(peerAddr)
	if err != nil {
		return fmt.Errorf("failed to parse peer address: %w", err)
	}
	h.Peerstore().AddAddrs(addrInfo.ID, addrInfo.Addrs, peerstore.PermanentAddrTTL)
	if err := h.Connect(ctx, *addrInfo); err != nil {
		return fmt.Errorf("failed to connect to peer: %w", err)
	}
	return nil
}

func makeReservation(h host.Host, ctx context.Context, relayAddr string) error {
	relayInfo, err := peer.AddrInfoFromString(relayAddr)
	if err != nil {
		return fmt.Errorf("failed to parse relay address: %w", err)
	}
	_, err = client.Reserve(ctx, h, *relayInfo)
	if err != nil {
		return fmt.Errorf("failed to make reservation: %w", err)
	}
	return nil
}

func createNode(seed string, relayAddr string) (host.Host, error) {
	customAddr, err := multiaddr.NewMultiaddr("/ip4/0.0.0.0/tcp/0")
	if err != nil {
		return nil, fmt.Errorf("failed to parse multiaddr: %w", err)
	}

	privKey, err := generatePrivateKeyFromSeed([]byte(seed))
	if err != nil {
		return nil, fmt.Errorf("failed to generate private key: %w", err)
	}

	relayInfo, err := peer.AddrInfoFromString(relayAddr)
	if err != nil {
		return nil, fmt.Errorf("failed to parse relay address: %w", err)
	}

	host, err := libp2p.New(
		libp2p.ListenAddrs(customAddr),
		libp2p.Identity(privKey),
		libp2p.NATPortMap(),
		libp2p.EnableNATService(),
		libp2p.EnableAutoRelayWithStaticRelays([]peer.AddrInfo{*relayInfo}),
		libp2p.EnableRelayService(),
		libp2p.EnableHolePunching(),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create host: %w", err)
	}

	return host, nil
}

func createDht(ctx context.Context, node host.Host) (*dht.IpfsDHT, blockstore.Blockstore, error) {
	// TODO: use database like leveldb or badger
	dstore := ds.MutexWrap(datastore.NewMapDatastore())
	bstore := blockstore.NewBlockstore(dstore)

	// Set up the DHT instance
	dht, err := dht.New(ctx, node, dht.Mode(dht.ModeClient), dht.Datastore(dstore))
	if err != nil {
		return nil, nil, fmt.Errorf("failed to create dht client: %w", err)
	}

	// Configure the DHT to use the custom validator
	dht.Validator = record.NamespacedValidator{
		"orcanet": &util.CustomValidator{}, // Add a custom validator for the "orcanet" namespace
	}

	// Bootstrap the DHT (connect to other peers to join the DHT network)
	if err := dht.Bootstrap(ctx); err != nil {
		return nil, nil, fmt.Errorf("failed to bootstrap dht client: %w", err)
	}

	return dht, bstore, nil
}
