package main

import (
	"bufio"
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net"
	"net/rpc"
	"runtime"
	"os"
	"path/filepath"
	"strings"
	"github.com/tahsina13/walrus-coin/backend/internal/rpcdefs"

	"github.com/ipfs/go-cid"
	"github.com/joho/godotenv"
	"github.com/libp2p/go-libp2p"
	dht "github.com/libp2p/go-libp2p-kad-dht"
	record "github.com/libp2p/go-libp2p-record"
	"github.com/libp2p/go-libp2p/core/crypto"
	"github.com/libp2p/go-libp2p/core/host"
	"github.com/libp2p/go-libp2p/core/network"
	"github.com/libp2p/go-libp2p/core/peer"
	"github.com/libp2p/go-libp2p/core/peerstore"
	"github.com/libp2p/go-libp2p/p2p/protocol/circuitv2/client"
	"github.com/multiformats/go-multiaddr"
	"github.com/multiformats/go-multihash"
)

var (
	node_id             string
	relay_node_addr     = "/ip4/130.245.173.221/tcp/4001/p2p/12D3KooWDpJ7As7BWAwRMfu1VU2WCqNjvq387JEYKDBj4kx6nXTN"
	bootstrap_node_addr = "/ip4/130.245.173.222/tcp/61000/p2p/12D3KooWQd1K1k8XA9xVEzSAu7HUCodC7LJB6uW5Kw4VwkRdstPE"
	globalCtx           context.Context
)

type DHTServer struct {
	dht *dht.IpfsDHT
	ctx context.Context
}

func (d *DHTServer) DHTGet(args *rpcdefs.DHTGet, reply *rpcdefs.Result) error {
	result, err := DHTGetHelper(d.ctx, d.dht, args.Key)
	if(err != nil){
		if strings.Contains(err.Error(), "routing: not found") {
			log.Printf("Key %s not found in DHT", args.Key)
			reply.Success = false
			reply.Value = ""  // No value to return, so set it to an empty string
			return nil  // No need to return the original error, just return successfully
		}
		return err
	}
	reply.Success = result != ""
	reply.Value = result
	return nil
}

func (d *DHTServer) DHTPut(args *rpcdefs.DHTPut, reply *rpcdefs.Result) error {
	result, err := DHTPutHelper(d.ctx, d.dht, args.Key, args.Value)
	if(err != nil){
		return err
	}
	reply.Success = result != ""
	reply.Value = result
	return nil
}

func DHTGetHelper(ctx context.Context, dht *dht.IpfsDHT, key string) (string, error) {
	dhtKey := "/orcanet/" + key
	res, err := dht.GetValue(ctx, dhtKey)
	if err != nil {
		fmt.Printf("Failed to get record: %v\n", err)
		return "", err
	}
	return string(res), err
}
func DHTPutHelper(ctx context.Context, dht *dht.IpfsDHT, key string, value string) (string, error) {
	dhtKey := "/orcanet/" + key
	err := dht.PutValue(ctx, dhtKey, []byte(value))
	if err != nil {
		fmt.Printf("Failed to put record: %v\n", err)
		return "", err
	}
	return value, err
}

func main() {
	// Get the directory of the current file
	_, filename, _, _ := runtime.Caller(0)
	dir := filepath.Dir(filename)

	// Build the path to the .env file relative to the current file
	envFile := filepath.Join(dir, "../..", ".env")

	err:= godotenv.Load(envFile)
	log.Println(envFile)
	if err!=nil {
		log.Fatal("Error loading .env file (put it in cwd)")
	}

	node_id = os.Getenv("SBUID")
	if node_id == "" {
		log.Println("Set a SBUID in a .env file in cwd")
		return
	}

	host := createLibp2pHost()
	dht := setupDHT(context.Background(), host)
	ctx, cancel := context.WithCancel(context.Background())
	globalCtx = ctx
	defer cancel()
	defer host.Close()

	connectToPeer(host, relay_node_addr)
	makeReservation(host)
	connectToPeer(host, bootstrap_node_addr)
	go handlePeerExchange(host) //this is with bootstrap
	
	// go handleInput(ctx, dht)

	// defer host.Close()

	// select {}

	dhtServer := DHTServer{
		ctx: ctx,
		dht: dht,
	}

	if err := rpc.Register(&dhtServer); err != nil {
        log.Fatal("Error registering DHT server:", err)
    }

	listener, err := net.Listen("tcp", ":8888")
	if err != nil {
		log.Fatal("Error starting RPC server:", err)
	}
	defer listener.Close()
	log.Println("RPC server running on port 8888")
	for {
		conn, err := listener.Accept()
		if err != nil {
			log.Println("Connection error:", err)
			continue
		}
		go rpc.ServeConn(conn)
	}
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

// Create a libp2p host and enable relaying with relay node
func createLibp2pHost() host.Host {
	customAddr, err := multiaddr.NewMultiaddr("/ip4/0.0.0.0/tcp/0")
	if err != nil {
		log.Fatal(err)
	}
	relayInfo, err := peer.AddrInfoFromString(relay_node_addr) // converts multiaddr string to peer.addrInfo
	if err != nil {
		log.Fatal(err)
	}
	seed := []byte(node_id)
	privKey, err := generatePrivateKeyFromSeed(seed)
	if err != nil {
		log.Fatal(err)
	}
	node, err := libp2p.New(
		libp2p.ListenAddrs(customAddr),
		libp2p.Identity(privKey),
		libp2p.EnableAutoRelayWithStaticRelays([]peer.AddrInfo{*relayInfo}),
		libp2p.EnableRelayService(),
	)
	if err != nil {
		log.Fatal(err)
	}
	return node
}

type CustomValidator struct{}

func (v *CustomValidator) Validate(key string, value []byte) error {
	return nil
}

func (v *CustomValidator) Select(key string, values [][]byte) (int, error) {
	return 0, nil
}

func setupDHT(ctx context.Context, h host.Host) *dht.IpfsDHT {
	// Set up the DHT instance
	kadDHT, err := dht.New(ctx, h, dht.Mode(dht.ModeClient))
	if err != nil {
		log.Fatal(err)
	}

	// Configure the DHT to use the custom validator
	kadDHT.Validator = record.NamespacedValidator{
		"orcanet": &CustomValidator{}, // Add a custom validator for the "orcanet" namespace
	}

	// Bootstrap the DHT (connect to other peers to join the DHT network)
	err = kadDHT.Bootstrap(ctx)
	if err != nil {
		log.Fatal(err)
	}

	return kadDHT
}

// Here peerAddr is the String format of Multiaddr of a peer
func connectToPeer(node host.Host, peerAddr string) {

	addr, err := multiaddr.NewMultiaddr(peerAddr) // convert string to Multiaddr
	if err != nil {
		log.Printf("Failed to parse peer address: %s", err)
		return
	}

	info, err := peer.AddrInfoFromP2pAddr(addr) // returns a peer.AddrInfo, containing the multiaddress and ID of the node.
	if err != nil {
		log.Printf("Failed to get AddrInfo from Multiaddr: %s", err)
		return
	}

	err = node.Connect(context.Background(), *info)
	if err != nil {
		log.Printf("Failed to connect to peer: %s", err)
		return
	}
	// after successful connection to the peer, add it to the peerstore
	// Peerstore is a local storage of the host(peer) where it stores the other peers
	node.Peerstore().AddAddrs(info.ID, info.Addrs, peerstore.PermanentAddrTTL)

	fmt.Println("Connected to:", info.ID)
}

func makeReservation(node host.Host) {
	ctx := context.Background()
	relayInfo, err := peer.AddrInfoFromString(relay_node_addr)
	if err != nil {
		log.Fatalf("Failed to create addrInfo from string representation of relay multiaddr: %v", err)
	}
	_, err = client.Reserve(ctx, node, *relayInfo)
	if err != nil {
		log.Fatalf("Failed to make reservation on relay: %v", err)
	}

	fmt.Printf("Reservation successfull \n")
}

func connectToPeerUsingRelay(node host.Host, targetPeerID string) {
	ctx := globalCtx
	targetPeerID = strings.TrimSpace(targetPeerID)
	relayAddr, err := multiaddr.NewMultiaddr(relay_node_addr)
	if err != nil {
		log.Printf("Failed to create relay multiaddr: %v", err)
	}
	peerMultiaddr := relayAddr.Encapsulate(multiaddr.StringCast("/p2p-circuit/p2p/" + targetPeerID))

	// log.Println("peer multi addr: ", peerMultiaddr)

	relayedAddrInfo, err := peer.AddrInfoFromP2pAddr(peerMultiaddr)
	if err != nil {
		log.Println("Failed to get relayed AddrInfo: %w", err)
		return
	}
	// Connect to the peer through the relay

	// log.Println("Trying to connect to ", relayedAddrInfo)
	// os.Stdout.Sync()

	err = node.Connect(ctx, *relayedAddrInfo)
	if err != nil {
		log.Println("Failed to connect to peer through relay: ", err)
		return
	}

	fmt.Printf("Connected to peer via relay: %s\n", targetPeerID)
}

func handlePeerExchange(node host.Host) {
	relayInfo, _ := peer.AddrInfoFromString(relay_node_addr)
	node.SetStreamHandler("/orcanet/p2p", func(s network.Stream) {
		defer s.Close()
		// log.Println("orcanet stream received")
		// os.Stdout.Sync()
		buf := bufio.NewReader(s)
		peerAddr, err := buf.ReadString('\n')
		if err != nil {
			if err != io.EOF {
				fmt.Printf("error reading from stream: %v", err)
			}
		}
		peerAddr = strings.TrimSpace(peerAddr)
		var data map[string]interface{}
		err = json.Unmarshal([]byte(peerAddr), &data)
		if err != nil {
			fmt.Printf("error unmarshaling JSON: %v", err)
		}
		if knownPeers, ok := data["known_peers"].([]interface{}); ok {
			for _, peer := range knownPeers {
				fmt.Println("Peer:")
				if peerMap, ok := peer.(map[string]interface{}); ok {
					if peerID, ok := peerMap["peer_id"].(string); ok {
						if string(peerID) != string(relayInfo.ID) {
							connectToPeerUsingRelay(node, peerID)
						}
					}
				}
			}
		}
		os.Stdout.Sync()
	})
}

func handleInput(ctx context.Context, dht *dht.IpfsDHT) {
	reader := bufio.NewReader(os.Stdin)
	fmt.Print("User Input \n ")
	for {
		fmt.Print("> ")
		input, _ := reader.ReadString('\n') // Read input from keyboard
		input = strings.TrimSpace(input)    // Trim any trailing newline or spaces
		args := strings.Split(input, " ")
		if len(args) < 1 {
			fmt.Println("No command provided")
			continue
		}
		command := args[0]
		command = strings.ToUpper(command)
		switch command {
		case "GET":
			if len(args) < 2 {
				fmt.Println("Expected key")
				continue
			}
			key := args[1]
			dhtKey := "/orcanet/" + key
			res, err := dht.GetValue(ctx, dhtKey)
			if err != nil {
				fmt.Printf("Failed to get record: %v\n", err)
				continue
			}
			fmt.Printf("Record: %s\n", res)

		case "GET_PROVIDERS":
			if len(args) < 2 {
				fmt.Println("Expected key")
				continue
			}
			key := args[1]
			data := []byte(key)
			hash := sha256.Sum256(data)
			mh, err := multihash.EncodeName(hash[:], "sha2-256")
			if err != nil {
				fmt.Printf("Error encoding multihash: %v\n", err)
				continue
			}
			c := cid.NewCidV1(cid.Raw, mh)
			providers := dht.FindProvidersAsync(ctx, c, 20)

			fmt.Println("Searching for providers...")
			for p := range providers {
				if p.ID == peer.ID("") {
					break
				}
				fmt.Printf("Found provider: %s\n", p.ID.String())
				for _, addr := range p.Addrs {
					fmt.Printf(" - Address: %s\n", addr.String())
				}
			}

		case "PUT":
			if len(args) < 3 {
				fmt.Println("Expected key and value")
				continue
			}
			key := args[1]
			value := args[2]
			dhtKey := "/orcanet/" + key
			log.Println(dhtKey)
			err := dht.PutValue(ctx, dhtKey, []byte(value))
			if err != nil {
				fmt.Printf("Failed to put record: %v\n", err)
				continue
			}
			// provideKey(ctx, dht, key)
			fmt.Println("Record stored successfully")

		case "PUT_PROVIDER":
			if len(args) < 2 {
				fmt.Println("Expected key")
				continue
			}
			key := args[1]
			provideKey(ctx, dht, key)
		default:
			fmt.Println("Expected GET, GET_PROVIDERS, PUT or PUT_PROVIDER")
		}
	}
}

func provideKey(ctx context.Context, dht *dht.IpfsDHT, key string) error {
	data := []byte(key)
	hash := sha256.Sum256(data)
	mh, err := multihash.EncodeName(hash[:], "sha2-256")
	if err != nil {
		return fmt.Errorf("error encoding multihash: %v", err)
	}
	c := cid.NewCidV1(cid.Raw, mh)

	// Start providing the key
	err = dht.Provide(ctx, c, true)
	if err != nil {
		return fmt.Errorf("failed to start providing key: %v", err)
	}
	return nil
}
