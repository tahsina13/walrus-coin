package node

import (
	"bufio"
	"bytes"
	"crypto/sha256"
	"encoding/json"
	"errors"
	"fmt"
	"io"
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
	"github.com/sirupsen/logrus"
	"golang.org/x/net/context"
)

const peerExchangeProtocolID = "/orcanet/p2p"

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

func connectToPeer(h host.Host, ctx context.Context, peerAddr string) error {
	addrInfo, err := peer.AddrInfoFromString(peerAddr)
	if err != nil {
		return fmt.Errorf("failed to parse peer address: %w", err)
	}

	h.Peerstore().AddAddrs(addrInfo.ID, addrInfo.Addrs, peerstore.PermanentAddrTTL)
	if err := h.Connect(ctx, *addrInfo); err != nil {
		return fmt.Errorf("failed to connect to peer: %w", err)
	}

	logrus.Infof("Connected to peer: %s", addrInfo.ID)
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

	logrus.Infof("Reservation successful")
	return nil
}

func connectToPeerUsingRelay(h host.Host, ctx context.Context, relayAddr multiaddr.Multiaddr, targetPeerID string) error {
	targetPeerID = strings.TrimSpace(targetPeerID)
	peerMultiaddr := relayAddr.Encapsulate(multiaddr.StringCast("/p2p-circuit/p2p/" + targetPeerID))

	relayedAddrInfo, err := peer.AddrInfoFromP2pAddr(peerMultiaddr)
	if err != nil {
		return fmt.Errorf("failed to get relayed address info: %w", err)
	}
	// Connect to the peer through the relay
	if err := h.Connect(ctx, *relayedAddrInfo); err != nil {
		return fmt.Errorf("failed to connect to peer through relay: %w", err)
	}

	logrus.Infof("Connected to peer via relay: %s", targetPeerID)
	return nil
}

func handlePeerExchange(h host.Host, ctx context.Context, relayAddr multiaddr.Multiaddr, s network.Stream) error {
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
						connectToPeerUsingRelay(h, ctx, relayAddr, peerID)
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
		logrus.Errorf("CreateHost: %v", err)
		return err
	}

	seed := []byte(args.NodeID)
	privKey, err := generatePrivateKeyFromSeed(seed)
	if err != nil {
		err = fmt.Errorf("failed to generate private key: %w", err)
		logrus.Errorf("CreateHost: %v", err)
		return err
	}

	relayAddr, err := multiaddr.NewMultiaddr(args.RelayAddr)
	if err != nil {
		err = fmt.Errorf("failed to parse relay address: %w", err)
		logrus.Errorf("CreateHost: %v", err)
		return err
	}

	relayInfo, err := peer.AddrInfoFromP2pAddr(relayAddr)
	if err != nil {
		err = fmt.Errorf("failed to get relay address info: %w", err)
		logrus.Errorf("CreateHost: %v", err)
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
		logrus.Errorf("CreateHost: %v", err)
		return err
	}

	context, cancel := context.WithCancel(context.Background())

	host.SetStreamHandler(peerExchangeProtocolID, func(s network.Stream) {
		defer s.Close()
		if err := handlePeerExchange(host, context, relayAddr, s); err != nil {
			logrus.Errorln(err) // TODO: better logrusging?
		}
	})

	if err := connectToPeer(host, context, args.RelayAddr); err != nil {
		n.closeHost()
		err = fmt.Errorf("failed to connect to relay: %w", err)
		logrus.Errorf("CreateHost: %v", err)
		return err
	}
	if err := makeReservation(host, context, args.RelayAddr); err != nil {
		n.closeHost()
		err = fmt.Errorf("failed to make reservation: %w", err)
		logrus.Errorf("CreateHost: %v", err)
		return err
	}
	for _, addr := range args.BootstrapAddrs {
		if err := connectToPeer(host, context, addr); err != nil {
			logrus.Errorf("CreateHost: failed to connect to bootstrap node: %v", err)
		}
	}

	n.host = host
	n.context, n.cancel = context, cancel

	reply.ID = host.ID()
	reply.Addrs = host.Addrs()
	return nil
}

func (n *NodeService) closeHost() error {
	if n.host == nil {
		return errors.New("host not initialized")
	}

	n.Cancel()
	n.host.RemoveStreamHandler(peerExchangeProtocolID)
	if err := n.host.Close(); err != nil {
		return fmt.Errorf("failed to close host: %w", err)
	}

	n.host = nil
	n.context, n.cancel = nil, nil
	return nil
}

func (n *NodeService) CloseHost(r *http.Request, args *CloseHostArgs, reply *CloseHostReply) error {
	if err := n.closeHost(); err != nil {
		logrus.Errorf("CloseHost: %v", err)
		return err
	}
	return nil
}
