package main

import (
	"bytes"
	"context"
	"crypto/rand"
	"crypto/sha256"
	"fmt"
	"net/http"
	"os"
	"time"

	config "github.com/ThomasObenaus/go-conf"
	"github.com/gorilla/mux"
	"github.com/ipfs/boxo/blockstore"
	"github.com/ipfs/go-datastore"
	leveldb "github.com/ipfs/go-ds-leveldb"
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

const refreshInterval = 10 * time.Minute

type Config struct {
	Port      int      `cfg:"{'name':'port','desc':'Port to listen on','default':5001,'short':'p'}"`
	Seed      string   `cfg:"{'name':'seed','desc':'Seed for private key generation','default':'','short':'s'}"`
	RelayAddr []string `cfg:"{'name':'relayAddr','desc':'Relay address','default':[]}"`
	DBPath    string   `cfg:"{'name':'dbpath','desc':'Path to datastore','default':''}"`
	Debug     bool     `cfg:"{'name':'debug','desc':'Enable debug logging','default':false,'short':'D'}"`
}

func main() {
	cfg := getConfig()

	if cfg.Debug {
		logrus.SetLevel(logrus.DebugLevel)
	}

	node, err := createNode(cfg.Seed, cfg.RelayAddr)
	if err != nil {
		logrus.Fatal(err)
	}
	defer node.Close()
	logrus.Infof("Node ID: %s", node.ID())
	logrus.Infof("Node multiaddress: %s", node.Addrs())

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	for _, addr := range cfg.RelayAddr {
		if err := connectToPeer(node, ctx, addr); err != nil {
			logrus.Fatal(err)
		}
		logrus.Infof("Connected to relay: %s", addr)

		if err := makeReservation(ctx, node, addr); err != nil {
			logrus.Fatal(err)
		}
		logrus.Infof("Made reservation with relay: %s", addr)

		go refreshReservation(ctx, node, addr, refreshInterval)
	}

	dstore, err := leveldb.NewDatastore(cfg.DBPath, nil)
	if err != nil {
		logrus.Fatal(err)
	}
	defer dstore.Close()
	logrus.Info("Created datastore")

	dht, err := createDht(ctx, node, dstore)
	if err != nil {
		logrus.Fatal(err)
	}
	defer dht.Close()
	logrus.Info("Created DHT client")

	bstore := blockstore.NewBlockstore(dstore)

	apiRouter, err := routers.NewAPIRouter(node, dht, bstore)
	if err != nil {
		logrus.Fatal(err)
	}

	mux := mux.NewRouter()
	mux.PathPrefix("/api/v0").Handler(http.StripPrefix("/api/v0", apiRouter))

	server := &http.Server{
		Addr:    fmt.Sprintf(":%d", cfg.Port),
		Handler: util.LoggerMiddleware(mux),
	}

	logrus.Infof("Server listening on port :%d", cfg.Port)
	logrus.Fatal(server.ListenAndServe())
}

func getConfig() Config {
	cfg := Config{}

	nameOfTheConfig := "walrus-coin"
	prefixForEnvironmentVariables := "WALRUS_COIN"
	provider, err := config.NewConfigProvider(
		&cfg,
		nameOfTheConfig,
		prefixForEnvironmentVariables,
	)
	if err != nil {
		panic(err)
	}

	err = provider.ReadConfig(os.Args[1:])
	if err != nil {
		fmt.Println("##### Failed reading the config")
		fmt.Printf("Error: %s\n", err.Error())
		fmt.Println("Usage:")
		fmt.Print(provider.Usage())
		os.Exit(1)
	}

	return cfg
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

func makeReservation(ctx context.Context, node host.Host, relayAddr string) error {
	relayInfo, err := peer.AddrInfoFromString(relayAddr)
	if err != nil {
		return fmt.Errorf("failed to parse relay address: %w", err)
	}
	_, err = client.Reserve(ctx, node, *relayInfo)
	if err != nil {
		return fmt.Errorf("failed to make reservation: %w", err)
	}
	return nil
}

func refreshReservation(ctx context.Context, node host.Host, relayAddr string, interval time.Duration) {
	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			makeReservation(ctx, node, relayAddr)
		case <-ctx.Done():
			logrus.Info("Context done, stopping reservation refresh.")
			return
		}
	}
}

func createNode(seed string, relayAddr []string) (host.Host, error) {
	customAddr, err := multiaddr.NewMultiaddr("/ip4/0.0.0.0/tcp/0")
	if err != nil {
		return nil, fmt.Errorf("failed to parse multiaddr: %w", err)
	}

	var privKey crypto.PrivKey
	if seed != "" {
		privKey, err = generatePrivateKeyFromSeed([]byte(seed))
		if err != nil {
			return nil, fmt.Errorf("failed to generate private key: %w", err)
		}
	} else {
		privKey, _, err = crypto.GenerateEd25519Key(rand.Reader)
		if err != nil {
			return nil, fmt.Errorf("failed to generate private key: %w", err)
		}
	}

	var relayInfo []peer.AddrInfo
	for _, addr := range relayAddr {
		info, err := peer.AddrInfoFromString(addr)
		if err != nil {
			return nil, fmt.Errorf("failed to parse relay address: %w", err)
		}
		relayInfo = append(relayInfo, *info)
	}

	host, err := libp2p.New(
		libp2p.ListenAddrs(customAddr),
		libp2p.Identity(privKey),
		libp2p.NATPortMap(),
		libp2p.EnableNATService(),
		libp2p.EnableAutoRelayWithStaticRelays(relayInfo),
		libp2p.EnableRelayService(),
		libp2p.EnableHolePunching(),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create host: %w", err)
	}

	return host, nil
}

func createDht(ctx context.Context, node host.Host, dstore datastore.Batching) (*dht.IpfsDHT, error) {
	// Set up the DHT instance
	dht, err := dht.New(ctx, node, dht.Mode(dht.ModeClient), dht.Datastore(dstore))
	if err != nil {
		return nil, fmt.Errorf("failed to create dht client: %w", err)
	}

	// Configure the DHT to use the custom validator
	dht.Validator = record.NamespacedValidator{
		"orcanet": &util.CustomValidator{}, // Add a custom validator for the "orcanet" namespace
	}

	// Bootstrap the DHT (connect to other peers to join the DHT network)
	if err := dht.Bootstrap(ctx); err != nil {
		return nil, fmt.Errorf("failed to bootstrap dht client: %w", err)
	}

	return dht, nil
}
