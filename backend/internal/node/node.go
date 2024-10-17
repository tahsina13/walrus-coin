package node

import (
	"bufio"
	"bytes"
	"crypto/sha256"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"

	"github.com/libp2p/go-libp2p"
	"github.com/libp2p/go-libp2p/core/crypto"
	"github.com/libp2p/go-libp2p/core/host"
	"github.com/libp2p/go-libp2p/core/network"
	"github.com/libp2p/go-libp2p/core/peer"
	"github.com/libp2p/go-libp2p/core/peerstore"
	"github.com/libp2p/go-libp2p/p2p/protocol/circuitv2/client"
	"github.com/multiformats/go-multiaddr"
	"golang.org/x/net/context"
)

func NewNodeService() *NodeService {
	return &NodeService{}
}

func (n *NodeService) GetContext() context.Context {
	return n.context
}

func (n *NodeService) GetHost() host.Host {
	return n.host
}

func (n *NodeService) Cancel() {
	if n.cancel != nil {
		n.cancel()
	}
}

func (n *NodeService) GetHostInfo(r *http.Request, args *GetHostInfoArgs, reply *GetHostInfoReply) error {
	if n.host == nil {
		return errors.New("host not initialized")
	}
	reply.ID = n.host.ID()
	reply.Addrs = n.host.Addrs()
	return nil
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

func (n *NodeService) connectToPeer(peerAddr string) error {
	if n.host == nil {
		return errors.New("host not initialized")
	}

	addrInfo, err := peer.AddrInfoFromString(peerAddr)
	if err != nil {
		return fmt.Errorf("failed to parse peer address: %w", err)
	}

	n.host.Peerstore().AddAddrs(addrInfo.ID, addrInfo.Addrs, peerstore.PermanentAddrTTL)
	if err := n.host.Connect(n.context, *addrInfo); err != nil {
		return fmt.Errorf("failed to connect to peer: %w", err)
	}

	log.Printf("Connected to peer: %s\n", addrInfo.ID)
	return nil
}

func (n *NodeService) makeReservation(relayAddr string) error {
	if n.host == nil {
		return errors.New("host not initialized")
	}

	relayInfo, err := peer.AddrInfoFromString(relayAddr)
	if err != nil {
		return fmt.Errorf("failed to parse relay address: %w", err)
	}

	_, err = client.Reserve(n.context, n.host, *relayInfo)
	if err != nil {
		return fmt.Errorf("failed to make reservation: %w", err)
	}

	log.Printf("Reservation successful\n")
	return nil
}

func (n *NodeService) connectToPeerUsingRelay(relayAddr multiaddr.Multiaddr, targetPeerID string) error {
	targetPeerID = strings.TrimSpace(targetPeerID)
	peerMultiaddr := relayAddr.Encapsulate(multiaddr.StringCast("/p2p-circuit/p2p/" + targetPeerID))

	relayedAddrInfo, err := peer.AddrInfoFromP2pAddr(peerMultiaddr)
	if err != nil {
		return fmt.Errorf("failed to get relayed address info: %w", err)
	}
	// Connect to the peer through the relay
	if err := n.host.Connect(n.context, *relayedAddrInfo); err != nil {
		return fmt.Errorf("failed to connect to peer through relay: %w", err)
	}

	log.Printf("Connected to peer via relay: %s\n", targetPeerID)
	return nil
}

func (n *NodeService) handlePeerExchange(relayAddr multiaddr.Multiaddr, s network.Stream) error {
	relayInfo, err := peer.AddrInfoFromP2pAddr(relayAddr)
	if err != nil {
		return err
	}
	buf := bufio.NewReader(s)
	peerAddr, err := buf.ReadString('\n')
	if err != nil && err != io.EOF {
		return err
	}
	peerAddr = strings.TrimSpace(peerAddr)
	var data map[string]interface{}
	if err := json.Unmarshal([]byte(peerAddr), &data); err != nil {
		return err
	}
	if knownPeers, ok := data["known_peers"].([]interface{}); ok {
		for _, peer := range knownPeers {
			if peerMap, ok := peer.(map[string]interface{}); ok {
				if peerID, ok := peerMap["peer_id"].(string); ok {
					if string(peerID) != string(relayInfo.ID) {
						n.connectToPeerUsingRelay(relayAddr, peerID)
					}
				}
			}
		}
	}
	return nil
}

func (n *NodeService) CreateHost(r *http.Request, args *CreateHostArgs, reply *CreateHostReply) error {
	if n.host != nil {
		return errors.New("host already initialized")
	}

	addr, err := multiaddr.NewMultiaddr(fmt.Sprintf("/ip4/%s/tcp/%d", args.IPAddr, args.Port))
	if err != nil {
		err = fmt.Errorf("failed to parse address: %w", err)
		log.Printf("CreateHost: %v\n", err)
		return err
	}

	seed := []byte(args.NodeID)
	privKey, err := generatePrivateKeyFromSeed(seed)
	if err != nil {
		err = fmt.Errorf("failed to generate private key: %w", err)
		log.Printf("CreateHost: %v\n", err)
		return err
	}

	relayAddr, err := multiaddr.NewMultiaddr(args.RelayAddr)
	if err != nil {
		err = fmt.Errorf("failed to parse relay address: %w", err)
		log.Printf("CreateHost: %v\n", err)
		return err
	}

	relayInfo, err := peer.AddrInfoFromP2pAddr(relayAddr)
	if err != nil {
		err = fmt.Errorf("failed to get relay address info: %w", err)
		log.Printf("CreateHost: %v\n", err)
		return err
	}

	host, err := libp2p.New(
		libp2p.ListenAddrs(addr),
		libp2p.Identity(privKey),
		libp2p.NATPortMap(),
		libp2p.EnableNATService(),
		libp2p.EnableAutoRelayWithStaticRelays([]peer.AddrInfo{*relayInfo}),
		libp2p.EnableRelayService(),
		libp2p.EnableHolePunching(),
	)
	if err != nil {
		err = fmt.Errorf("failed to create host: %w", err)
		log.Printf("CreateHost: %v\n", err)
		return err
	}

	host.SetStreamHandler("/orcanet/p2p", func(s network.Stream) {
		defer s.Close()
		if err := n.handlePeerExchange(relayAddr, s); err != nil {
			log.Println(err) // TODO: better error messaging
		}
	})

	n.host = host
	n.context, n.cancel = context.WithCancel(context.Background())

	if err := n.connectToPeer(args.RelayAddr); err != nil {
		n.closeHost()
		err = fmt.Errorf("failed to connect to relay: %w", err)
		log.Printf("CreateHost: %v\n", err)
		return err
	}
	if err := n.makeReservation(args.RelayAddr); err != nil {
		n.closeHost()
		err = fmt.Errorf("failed to make reservation: %w", err)
		log.Printf("CreateHost: %v\n", err)
		return err
	}
	if err := n.connectToPeer(args.BootstrapAddr); err != nil {
		n.closeHost()
		err = fmt.Errorf("failed to connect to bootstrap node: %w", err)
		log.Printf("CreateHost: %v\n", err)
		return err
	}

	reply.ID = host.ID()
	reply.Addrs = host.Addrs()
	return nil
}

func (n *NodeService) closeHost() error {
	if n.host == nil {
		return errors.New("host not initialized")
	}

	n.Cancel()
	if err := n.host.Close(); err != nil {
		return fmt.Errorf("failed to close host: %w", err)
	}

	n.host = nil
	n.context, n.cancel = nil, nil
	return nil
}

func (n *NodeService) CloseHost(r *http.Request, args *CloseHostArgs, reply *CloseHostReply) error {
	if err := n.closeHost(); err != nil {
		log.Printf("CloseHost: %v\n", err)
		return err
	}
	return nil
}
