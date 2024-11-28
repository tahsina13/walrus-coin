package main

import (
	"bytes"
	"context"
	"crypto/rand"
	"crypto/sha256"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"reflect"
	"time"

	config "github.com/ThomasObenaus/go-conf"
	"github.com/davecgh/go-spew/spew"
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

type Config struct {
	P2pport       int                   `cfg:"{'name':'p2pport','desc':'TCP/UDP Port for p2p','default':4001,'short':'l'}"`
	Rpcport       int                   `cfg:"{'name':'rpcport','desc':'RPC API Port','default':5001,'short':'p'}"`
	Seed          string                `cfg:"{'name':'seed','desc':'Seed for private key generation','default':'','short':'s'}"`
	Relayaddr     []multiaddr.Multiaddr `cfg:"{'name':'relay-addr','desc':'Relay address','default':[],'short':'r','mapfun':'strSliceToMultiaddrList'}"`
	Bootstrapaddr []multiaddr.Multiaddr `cfg:"{'name':'bootstrap-addr','desc':'Bootstrap address','default':[],'short':'b','mapfun':'strSliceToMultiaddrList'}"`
	Dbpath        string                `cfg:"{'name':'dbpath','desc':'Path to datastore','default':'','short':'d'}"`
	Debug         bool                  `cfg:"{'name':'debug','desc':'Enable debug logging','default':false,'short':'D'}"`
}

const refreshInterval = 10 * time.Minute

var configDir string

func main() {
	// Create config directory
	homeDir, err := os.UserHomeDir()
	if err != nil {
		logrus.Fatal(fmt.Errorf("failed to get user home directory: %w", err))
	}

	configDir = filepath.Join(homeDir, ".walrus-coin")
	if err := os.MkdirAll(configDir, 0755); err != nil {
		logrus.Fatal(fmt.Errorf("failed to create config directory: %w", err))
	}
	logrus.Info("Created config directory")

	// Read config
	cfg := getConfig()

	if cfg.Debug {
		logrus.SetLevel(logrus.DebugLevel)
	}

	// Create global context
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Create libp2p node
	node, err := createNode(cfg.P2pport, cfg.Seed, cfg.Relayaddr)
	if err != nil {
		logrus.Fatal(err)
	}
	defer node.Close()
	logrus.Infof("Node ID: %s", node.ID())
	logrus.Infof("Node multiaddress: %s", node.Addrs())

	// Connect to relay nodes
	for _, addr := range cfg.Relayaddr {
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

	// Connect to bootstrap nodes
	for _, addr := range cfg.Bootstrapaddr {
		if err := connectToPeer(node, ctx, addr); err != nil {
			logrus.Fatal(err)
		}
		logrus.Infof("Connected to bootstrap: %s", addr)
	}

	// Setup leveldb datastore
	if cfg.Dbpath == "" {
		cfg.Dbpath = filepath.Join(configDir, "leveldb")
	}
	dstore, err := leveldb.NewDatastore(cfg.Dbpath, nil)
	if err != nil {
		logrus.Fatal(err)
	}
	defer dstore.Close()
	logrus.Info("Created datastore")

	// Create dht client
	dht, err := createDht(ctx, node, dstore)
	if err != nil {
		logrus.Fatal(err)
	}
	defer dht.Close()
	logrus.Info("Created DHT client")

	// Create blockstore
	bstore := blockstore.NewBlockstore(dstore)

	// Create API router
	apiRouter, err := routers.NewAPIRouter(node, dht, bstore)
	if err != nil {
		logrus.Fatal(err)
	}

	mux := mux.NewRouter()
	mux.PathPrefix("/api/v0").Handler(http.StripPrefix("/api/v0", apiRouter))

	// Add middleware
	corsHandler := util.EnableCors(mux)
	loggerHandler := util.LoggerMiddleware(corsHandler)

	server := &http.Server{
		Addr:    fmt.Sprintf(":%d", cfg.Rpcport),
		Handler: loggerHandler,
	}

	logrus.Infof("Server listening on port :%d", cfg.Rpcport)
	logrus.Fatal(server.ListenAndServe())
}

func strSliceToMultiaddrList(rawUntypedValue interface{}, targetType reflect.Type) (interface{}, error) {
	asStr, ok := rawUntypedValue.(string)
	if ok {
		addr, err := multiaddr.NewMultiaddr(asStr)
		if err != nil {
			return nil, fmt.Errorf("failed to parse multiaddr: %w", err)
		}
		return []multiaddr.Multiaddr{addr}, nil
	}

	rawSlice, ok := rawUntypedValue.([]interface{})
	if !ok {
		return []multiaddr.Multiaddr{}, nil
	}

	var addrs []multiaddr.Multiaddr
	for _, raw := range rawSlice {
		str, ok := raw.(string)
		if !ok {
			return nil, fmt.Errorf("expected a string, got %T", raw)
		}
		addr, err := multiaddr.NewMultiaddr(str)
		if err != nil {
			return nil, fmt.Errorf("failed to parse multiaddr: %w", err)
		}
		addrs = append(addrs, addr)
	}

	return addrs, nil
}

func findConfigFile(configDir string) (string, error) {
	// Define the supported config file extensions
	supportedExtensions := []string{"yml", "yaml", "json", "toml"}

	for _, ext := range supportedExtensions {
		fname := filepath.Join(configDir, fmt.Sprintf("config.%s", ext))
		if _, err := os.Stat(fname); err == nil {
			return fname, nil
		} else if !os.IsNotExist(err) {
			return "", err
		}
	}

	return "", nil
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

	if err := provider.RegisterMappingFunc("strSliceToMultiaddrList", strSliceToMultiaddrList); err != nil {
		panic(err)
	}

	args := os.Args[1:]
	configFile, err := findConfigFile(configDir)
	if err != nil {
		panic(err)
	}
	if configFile != "" {
		logrus.Infof("Using config file: %s", configFile)
		args = append([]string{fmt.Sprintf("--config-file=%s", configFile)}, args...)
	}

	if err := provider.ReadConfig(args); err != nil {
		fmt.Println("##### Failed reading the config")
		fmt.Printf("Error: %s\n", err.Error())
		fmt.Println("Usage:")
		fmt.Print(provider.Usage())
		os.Exit(1)
	}

	fmt.Println("##### Successfully read the config")
	fmt.Println()
	spew.Dump(cfg)

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

func connectToPeer(h host.Host, ctx context.Context, peerAddr multiaddr.Multiaddr) error {
	addrInfo, err := peer.AddrInfoFromP2pAddr(peerAddr)
	if err != nil {
		return fmt.Errorf("failed to parse peer address: %w", err)
	}
	h.Peerstore().AddAddrs(addrInfo.ID, addrInfo.Addrs, peerstore.PermanentAddrTTL)
	if err := h.Connect(ctx, *addrInfo); err != nil {
		return fmt.Errorf("failed to connect to peer: %w", err)
	}
	return nil
}

func makeReservation(ctx context.Context, node host.Host, relayAddr multiaddr.Multiaddr) error {
	relayInfo, err := peer.AddrInfoFromP2pAddr(relayAddr)
	if err != nil {
		return fmt.Errorf("failed to parse relay address: %w", err)
	}
	_, err = client.Reserve(ctx, node, *relayInfo)
	if err != nil {
		return fmt.Errorf("failed to make reservation: %w", err)
	}
	return nil
}

func refreshReservation(ctx context.Context, node host.Host, relayAddr multiaddr.Multiaddr, interval time.Duration) {
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

func createNode(port int, seed string, relayAddr []multiaddr.Multiaddr) (host.Host, error) {
	customAddr, err := multiaddr.NewMultiaddr(fmt.Sprintf("/ip4/0.0.0.0/tcp/%d", port))
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
		info, err := peer.AddrInfoFromP2pAddr(addr)
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
