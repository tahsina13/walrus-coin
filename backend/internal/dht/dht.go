package dht

import (
	"bufio"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"

	"github.com/ipfs/boxo/blockservice"
	"github.com/ipfs/boxo/blockstore"
	"github.com/ipfs/boxo/ipld/merkledag"
	"github.com/ipfs/go-cid"
	"github.com/ipfs/go-datastore"
	ds "github.com/ipfs/go-datastore/sync"
	dht "github.com/libp2p/go-libp2p-kad-dht"
	record "github.com/libp2p/go-libp2p-record"
	"github.com/libp2p/go-libp2p/core/network"
	"github.com/libp2p/go-libp2p/core/peer"
	"github.com/sirupsen/logrus"
	"github.com/tahsina13/walrus-coin/backend/internal/node"
)

const (
	marketStatProtocolID     = "/orcanet/market/stat"
	marketDownloadProtocolID = "/orcanet/market/download"
)

func NewDhtService(nodeService *node.NodeService) (*DhtService, error) {
	if nodeService == nil {
		return nil, errors.New("node service is nil")
	}
	return &DhtService{
		nodeService: nodeService,
	}, nil
}

func (d *DhtService) InitDht(r *http.Request, args *InitDhtArgs, reply *InitDhtReply) error {
	if d.nodeService.Context == nil {
		return errors.New("context not initialized")
	}
	if d.nodeService.Host == nil {
		return errors.New("host not initialized")
	}
	if d.client != nil {
		return errors.New("dht client already initialized")
	}

	// TODO: use database like leveldb or badger
	dstore := ds.MutexWrap(datastore.NewMapDatastore())
	d.bstore = blockstore.NewBlockstore(dstore)
	d.dagService = merkledag.NewDAGService(blockservice.New(d.bstore, nil))

	// Set up the DHT instance
	kadDHT, err := dht.New(d.nodeService.Context, d.nodeService.Host, dht.Mode(dht.ModeClient), dht.Datastore(dstore))
	if err != nil {
		if err := d.closeDht(); err != nil {
			logrus.Errorf("InitDht: %v", err)
		}
		err = fmt.Errorf("failed to create dht client: %w", err)
		logrus.Errorf("InitDht: %v", err)
		return err
	}

	// Configure the DHT to use the custom validator
	kadDHT.Validator = record.NamespacedValidator{
		"orcanet": &CustomValidator{}, // Add a custom validator for the "orcanet" namespace
	}
	d.client = kadDHT

	// Bootstrap the DHT (connect to other peers to join the DHT network)
	if err := kadDHT.Bootstrap(d.nodeService.Context); err != nil {
		if err := d.closeDht(); err != nil {
			logrus.Errorf("InitDht: %v", err)
		}
		err = fmt.Errorf("failed to bootstrap dht client: %w", err)
		logrus.Errorf("InitDht: %v", err)
		return err
	}

	d.nodeService.Host.SetStreamHandler(marketStatProtocolID, func(s network.Stream) {
		defer s.Close()
		buf := bufio.NewReader(s)
		data, err := buf.ReadString('\n')
		if err != nil {
			logrus.Errorln(err)
			return
		}
		data = strings.TrimSpace(data)
		logrus.Debugf("Received: %s", data)

		// TODO: send error json
		var args StatProtocolArgs
		if err := json.Unmarshal([]byte(data), &args); err != nil {
			logrus.Errorln(err)
			return
		}
		replyBytes, err := d.handleStat(&args)
		if err != nil {
			logrus.Errorln(err)
			return
		}
		if _, err := s.Write(append(replyBytes, '\n')); err != nil {
			logrus.Errorln(err)
			return
		}
		logrus.Debugf("Sent: %s", string(replyBytes))
	})

	d.nodeService.Host.SetStreamHandler(marketDownloadProtocolID, func(s network.Stream) {
		defer s.Close()
		buf := bufio.NewReader(s)
		data, err := buf.ReadString('\n')
		if err != nil {
			logrus.Errorln(err)
			return
		}
		data = strings.TrimSpace(data)
		logrus.Debugf("Received: %s", data)

		// TODO: send error json
		var args DownloadProtocolArgs
		if err := json.Unmarshal([]byte(data), &args); err != nil {
			logrus.Errorln(err)
			return
		}
		replyBytes, err := d.handleDownload(&args)
		if err != nil {
			logrus.Errorln(err)
			return
		}
		if _, err := s.Write(replyBytes); err != nil {
			logrus.Errorln(err)
			return
		}
		if len(replyBytes) > 256 {
			logrus.Debugf("Sent: %s...", string(replyBytes)[:256])
		} else {
			logrus.Debugf("Sent: %s", string(replyBytes))
		}
	})

	go func() {
		<-d.nodeService.Context.Done()
		if err := d.closeDht(); err != nil {
			logrus.Errorln(err) // TODO: better logging?
		}
	}()

	return nil
}

func (d *DhtService) closeDht() error {
	if d.client != nil {
		if d.nodeService.Host != nil {
			d.nodeService.Host.RemoveStreamHandler(marketStatProtocolID)
			d.nodeService.Host.RemoveStreamHandler(marketDownloadProtocolID)
		}
		if err := d.client.Close(); err != nil {
			return fmt.Errorf("failed to close dht client: %w", err)
		}
		d.client = nil
	}
	d.bstore = nil
	d.dagService = nil
	return nil
}

func (d *DhtService) CloseDht(r *http.Request, args *CloseDhtArgs, reply *CloseDhtReply) error {
	if err := d.closeDht(); err != nil {
		logrus.Errorf("CloseDht: %v", err)
		return err
	}
	return nil
}

func (d *DhtService) GetValue(r *http.Request, args *GetValueArgs, reply *GetValueReply) error {
	if d.nodeService.Context == nil {
		return errors.New("context not initialized")
	}
	if d.client == nil {
		return errors.New("dht client not initialized")
	}
	dhtKey := "/orcanet/" + args.Key
	value, err := d.client.GetValue(d.nodeService.Context, dhtKey)
	if err != nil {
		return fmt.Errorf("failed to get value: %w", err)
	}
	reply.Value = string(value)
	return nil
}

func (d *DhtService) GetProviders(r *http.Request, args *GetProvidersArgs, reply *GetProvidersReply) error {
	if d.nodeService.Context == nil {
		return errors.New("context not initialized")
	}
	if d.client == nil {
		return errors.New("dht client not initialized")
	}
	c, err := cid.Decode(args.Cid)
	if err != nil {
		return fmt.Errorf("error decoding cid: %w", err)
	}
	providers := d.client.FindProvidersAsync(d.nodeService.Context, c, args.Count)

	var addrs []peer.AddrInfo
	for p := range providers {
		if p.ID == peer.ID("") {
			break
		}
		addrs = append(addrs, p)
	}

	reply.Addrs = addrs
	return nil
}

func (d *DhtService) PutValue(r *http.Request, args *PutValueArgs, reply *PutValueReply) error {
	if d.nodeService.Context == nil {
		return errors.New("context not initialized")
	}
	if d.client == nil {
		return errors.New("dht client not initialized")
	}
	dhtKey := "/orcanet/" + args.Key
	if err := d.client.PutValue(d.nodeService.Context, dhtKey, []byte(args.Value)); err != nil {
		return fmt.Errorf("failed to put value: %w", err)
	}
	return nil
}

func (d *DhtService) PutProvider(r *http.Request, args *PutProviderArgs, reply *PutProviderReply) error {
	if d.nodeService.Context == nil {
		return errors.New("context not initialized")
	}
	if d.client == nil {
		return errors.New("dht client not initialized")
	}
	c, err := cid.Decode(args.Cid)
	if err != nil {
		return fmt.Errorf("error decoding cid: %w", err)
	}

	// Start providing the key
	if err := d.client.Provide(d.nodeService.Context, c, true); err != nil {
		return fmt.Errorf("failed to start providing key: %w", err)
	}
	return nil
}

func (d *DhtService) Upload(r *http.Request, args *UploadArgs, reply *UploadReply) error {
	if d.nodeService.Context == nil {
		return errors.New("context not initialized")
	}
	if d.bstore == nil {
		return errors.New("blockstore not initialized")
	}
	node, err := createDAGNode(d.nodeService.Context, d.bstore, args.Name)
	if err != nil {
		return fmt.Errorf("failed to create dag node: %w", err)
	}
	reply.Cid = node.Cid().String()
	return nil
}

func (d *DhtService) handleStat(args *StatProtocolArgs) ([]byte, error) {
	c, err := cid.Decode(args.Cid)
	if err != nil {
		return nil, fmt.Errorf("failed to decode cid: %w", err)
	}
	dagNode, err := traverseDAGNode(d.nodeService.Context, d.dagService, c, "")
	if err != nil {
		return nil, fmt.Errorf("failed to traverse dag node: %w", err)
	}
	replyBytes, err := json.Marshal(&StatProtocolReply{Root: dagNode})
	if err != nil {
		return nil, fmt.Errorf("failed to marshal reply: %w", err)
	}
	return replyBytes, err
}

func (d *DhtService) Stat(r *http.Request, args *StatArgs, reply *StatReply) error {
	if d.nodeService.Host == nil {
		return errors.New("host not initialized")
	}

	if d.nodeService.Context == nil {
		return errors.New("context not initialized")
	}

	// Parse peer address
	peerAddr, err := peer.AddrInfoFromString(args.PeerAddr)
	if err != nil {
		return fmt.Errorf("failed to parse peer address: %w", err)
	}

	// Connect to peer
	if err := d.nodeService.Host.Connect(d.nodeService.Context, *peerAddr); err != nil {
		return fmt.Errorf("failed to connect to peer: %w", err)
	}
	defer d.nodeService.Host.Network().ClosePeer(peerAddr.ID)

	// Open stream with peer
	ctx := network.WithAllowLimitedConn(d.nodeService.Context, marketStatProtocolID)
	stream, err := d.nodeService.Host.NewStream(ctx, peerAddr.ID, marketStatProtocolID)
	if err != nil {
		return fmt.Errorf("failed to create stream: %w", err)
	}
	defer stream.Close()

	// Send file stat request
	protocolArgsBytes, err := json.Marshal(StatProtocolArgs{Cid: args.Cid})
	if err != nil {
		return fmt.Errorf("failed to marshal protocol args: %w", err)
	}
	if _, err := stream.Write(append(protocolArgsBytes, '\n')); err != nil {
		return fmt.Errorf("failed to write protocol args to stream: %w", err)
	}
	logrus.Debugf("Sent: %s", string(protocolArgsBytes))

	// Read file stat response
	buf := bufio.NewReader(stream)
	protocolReplyData, err := buf.ReadString('\n')
	if err != nil {
		return fmt.Errorf("failed to read protocol reply data: %w", err)
	}
	protocolReplyData = strings.TrimSpace(protocolReplyData)
	logrus.Debugf("Received: %s", protocolReplyData)

	// Parse file stat response
	var protocolReply StatProtocolReply
	if err := json.Unmarshal([]byte(protocolReplyData), &protocolReply); err != nil {
		return fmt.Errorf("failed to unmarshal protocol reply data: %w", err)
	}

	reply.Root = protocolReply.Root
	return nil
}

func (d *DhtService) handleDownload(args *DownloadProtocolArgs) ([]byte, error) {
	if d.nodeService.Context == nil {
		return nil, errors.New("context not initialized")
	}
	if d.dagService == nil {
		return nil, errors.New("dag service not initialized")
	}
	c, err := cid.Decode(args.Cid)
	if err != nil {
		return nil, fmt.Errorf("failed to decode cid: %w", err)
	}
	node, err := d.dagService.Get(d.nodeService.Context, c)
	if err != nil {
		return nil, fmt.Errorf("failed to get node: %w", err)
	}
	return node.RawData(), nil
}

func (d *DhtService) Download(r *http.Request, args *DownloadArgs, reply *DownloadReply) error {
	if d.nodeService.Host == nil {
		return errors.New("host not initialized")
	}

	if d.nodeService.Context == nil {
		return errors.New("context not initialized")
	}

	// Parse peer address
	peerAddr, err := peer.AddrInfoFromString(args.PeerAddr)
	if err != nil {
		return fmt.Errorf("failed to parse peer address: %w", err)
	}

	// Connect to peer
	if err := d.nodeService.Host.Connect(d.nodeService.Context, *peerAddr); err != nil {
		return fmt.Errorf("failed to connect to peer: %w", err)
	}
	defer d.nodeService.Host.Network().ClosePeer(peerAddr.ID)

	// Open stream with peer
	ctx := network.WithAllowLimitedConn(d.nodeService.Context, marketDownloadProtocolID)
	stream, err := d.nodeService.Host.NewStream(ctx, peerAddr.ID, marketDownloadProtocolID)
	if err != nil {
		return fmt.Errorf("failed to create stream: %w", err)
	}
	defer stream.Close()

	// Send file download request
	argsBytes, err := json.Marshal(DownloadProtocolArgs{Cid: args.Cid})
	if err != nil {
		return fmt.Errorf("failed to marshal args: %w", err)
	}
	if _, err := stream.Write(append(argsBytes, '\n')); err != nil {
		return fmt.Errorf("failed to write args to stream: %w", err)
	}
	logrus.Debugf("Sent: %s", string(argsBytes))

	// Create file if not exists
	file, err := os.Create(args.Name)
	if err != nil {
		return fmt.Errorf("failed to create file: %w", err)
	}
	defer file.Close()

	// Copy databytes from stream to file
	if _, err := io.Copy(file, stream); err != nil {
		return fmt.Errorf("failed to copy stream to file: %w", err)
	}

	return nil
}
