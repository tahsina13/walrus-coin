package node

import (
	"bytes"
	"crypto/sha256"
	"errors"
	"fmt"
	"net/http"

	"github.com/libp2p/go-libp2p"
	"github.com/libp2p/go-libp2p/core/crypto"
	"github.com/libp2p/go-libp2p/core/host"
	"github.com/libp2p/go-libp2p/core/peer"
	"github.com/libp2p/go-libp2p/core/peerstore"
	"github.com/libp2p/go-libp2p/p2p/protocol/circuitv2/client"
	"github.com/multiformats/go-multiaddr"
	"github.com/sirupsen/logrus"
	"golang.org/x/net/context"
)

func NewNodeService() *NodeService {
	return &NodeService{}
}

func (n *NodeService) Cancel() {
	if n.cancel != nil {
		n.cancel()
	}
}

func (n *NodeService) GetHostInfo(r *http.Request, args *GetHostInfoArgs, reply *GetHostInfoReply) error {
	if n.Host == nil {
		return errors.New("host not initialized")
	}
	reply.ID = n.Host.ID()
	reply.Addrs = n.Host.Addrs()
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

func (n *NodeService) CreateHost(r *http.Request, args *CreateHostArgs, reply *CreateHostReply) error {
	if n.Host != nil {
		return errors.New("host already initialized")
	}

	addr, err := multiaddr.NewMultiaddr(fmt.Sprintf("/ip4/%s/tcp/%d", args.IPAddr, args.Port))
	if err != nil {
		return fmt.Errorf("failed to parse address: %w", err)
	}

	seed := []byte(args.NodeID)
	privKey, err := generatePrivateKeyFromSeed(seed)
	if err != nil {
		return fmt.Errorf("failed to generate private key: %w", err)
	}

	relayAddr, err := multiaddr.NewMultiaddr(args.RelayAddr)
	if err != nil {
		return fmt.Errorf("failed to parse relay address: %w", err)
	}

	relayInfo, err := peer.AddrInfoFromP2pAddr(relayAddr)
	if err != nil {
		return fmt.Errorf("failed to parse relay address: %w", err)
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
		return fmt.Errorf("failed to create host: %w", err)
	}

	n.Host = host
	n.Context, n.cancel = context.WithCancel(context.Background())

	if err := connectToPeer(n.Host, n.Context, args.RelayAddr); err != nil {
		if err := n.closeHost(); err != nil {
			logrus.Errorln(err)
		}
		return fmt.Errorf("failed to connect to relay: %w", err)
	}
	if err := makeReservation(n.Host, n.Context, args.RelayAddr); err != nil {
		if err := n.closeHost(); err != nil {
			logrus.Errorln(err)
		}
		return fmt.Errorf("failed to make reservation: %w", err)
	}
	for _, addr := range args.BootstrapAddrs {
		if err := connectToPeer(n.Host, n.Context, addr); err != nil {
			logrus.Errorln(err)
		}
	}

	reply.ID = host.ID()
	reply.Addrs = host.Addrs()
	return nil
}

func (n *NodeService) closeHost() error {
	n.Cancel()
	if n.Host != nil {
		if err := n.Host.Close(); err != nil {
			return fmt.Errorf("failed to close host: %w", err)
		}
		n.Host = nil
	}
	n.Context, n.cancel = nil, nil
	return nil
}

func (n *NodeService) CloseHost(r *http.Request, args *CloseHostArgs, reply *CloseHostReply) error {
	return n.closeHost()
}
