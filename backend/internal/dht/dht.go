package dht

import (
	"bufio"
	"context"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"

	"github.com/ipfs/boxo/blockstore"
	blocks "github.com/ipfs/go-block-format"
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
	bitswapProtocolID = "/orcanet/bitswap"
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
	bstore := blockstore.NewBlockstore(dstore)

	// Set up the DHT instance
	kadDHT, err := dht.New(d.nodeService.Context, d.nodeService.Host, dht.Mode(dht.ModeClient), dht.Datastore(dstore))
	if err != nil {
		err = fmt.Errorf("failed to create dht client: %w", err)
		logrus.Errorf("InitDht: %v", err)
		return err
	}

	// Configure the DHT to use the custom validator
	kadDHT.Validator = record.NamespacedValidator{
		"orcanet": &CustomValidator{}, // Add a custom validator for the "orcanet" namespace
	}

	// Bootstrap the DHT (connect to other peers to join the DHT network)
	if err := kadDHT.Bootstrap(d.nodeService.Context); err != nil {
		err = fmt.Errorf("failed to bootstrap dht client: %w", err)
		logrus.Errorf("InitDht: %v", err)
		return err
	}

	d.nodeService.Host.SetStreamHandler(bitswapProtocolID, func(s network.Stream) {
		defer s.Close()
		if err := handleDownloadFile(d.nodeService.Context, bstore, s); err != nil {
			logrus.Errorln(err) // TODO: better logging?
		}
	})

	go func() {
		<-d.nodeService.Context.Done()
		if err := d.closeDht(); err != nil {
			logrus.Errorln(err) // TODO: better logging?
		}
	}()

	d.client = kadDHT
	d.bstore = bstore
	return nil
}

func (d *DhtService) closeDht() error {
	if d.client != nil {
		if d.nodeService.Host != nil {
			d.nodeService.Host.RemoveStreamHandler(bitswapProtocolID)
		}
		if err := d.client.Close(); err != nil {
			return fmt.Errorf("failed to close dht client: %w", err)
		}
		d.client = nil
	}
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
		err = fmt.Errorf("failed to get value: %w", err)
		logrus.Errorf("GetValue: %v", err)
		return err
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
		err = fmt.Errorf("error decoding cid: %w", err)
		logrus.Errorf("GetProviders: %v", err)
		return err
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
		err = fmt.Errorf("failed to put value: %w", err)
		logrus.Errorf("PutValue: %v", err)
		return err
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
		err = fmt.Errorf("error decoding cid: %w", err)
		logrus.Errorf("PutProvider: %v", err)
		return err
	}

	// Start providing the key
	if err := d.client.Provide(d.nodeService.Context, c, true); err != nil {
		err = fmt.Errorf("failed to start providing key: %w", err)
		logrus.Errorf("PutProvider: %v", err)
		return err
	}
	return nil
}

func (d *DhtService) UploadFile(r *http.Request, args *UploadFileArgs, reply *UploadFileReply) error {
	if d.nodeService.Context == nil {
		err := errors.New("context not initialized")
		logrus.Errorf("UploadFile: %v", err)
	}
	if d.bstore == nil {
		err := errors.New("blockstore not initialized")
		logrus.Errorf("UploadFile: %v", err)
		return err
	}

	// Check if path exists
	_, err := os.Stat(args.Path)
	if err != nil {
		if os.IsNotExist(err) {
			err = fmt.Errorf("file does not exist: %w", err)
		} else {
			err = fmt.Errorf("failed to stat file: %w", err)
		}
		logrus.Errorf("UploadFile: %v", err)
		return err
	}

	// TODO: create merkle dag for directories
	// Open the file
	file, err := os.Open(args.Path)
	if err != nil {
		err = fmt.Errorf("failed to open file: %w", err)
		logrus.Errorf("UploadFile: %v", err)
		return err
	}
	defer file.Close()

	// TODO: chunk large files
	// Read file into byte slice
	data, err := io.ReadAll(file)
	if err != nil {
		err = fmt.Errorf("failed to read file: %w", err)
		logrus.Errorf("UploadFile: %v", err)
		return err
	}

	blk := blocks.NewBlock(data)
	if err := d.bstore.Put(d.nodeService.Context, blk); err != nil {
		err = fmt.Errorf("failed to put block: %w", err)
		logrus.Errorf("UploadFile: %v", err)
		return err
	}

	reply.Cid = blk.Cid().String()
	return nil
}

func handleDownloadFile(ctx context.Context, bstore blockstore.Blockstore, s network.Stream) error {
	// Read CID from stream
	buf := bufio.NewReader(s)
	rawCid, err := buf.ReadString('\n')
	if err != nil {
		return fmt.Errorf("failed to read cid from stream: %w", err)
	}
	rawCid = strings.TrimSpace(rawCid)

	// Decode CID
	c, err := cid.Decode(rawCid)
	if err != nil {
		return fmt.Errorf("failed to decode cid: %w", err)
	}

	// Fetch block from blockstore
	blk, err := bstore.Get(ctx, c)
	if err != nil {
		return fmt.Errorf("failed to get block: %w", err)
	}

	// Write databytes to stream
	_, err = s.Write(blk.RawData())
	if err != nil {
		return fmt.Errorf("failed to write block to stream: %w", err)
	}

	return nil
}

func (d *DhtService) DownloadFile(r *http.Request, args *DownloadFileArgs, reply *DownloadFileReply) error {
	if d.nodeService.Host == nil {
		err := errors.New("host not initialized")
		logrus.Errorf("DownloadFile: %v", err)
		return err
	}

	if d.nodeService.Context == nil {
		err := errors.New("context not initialized")
		logrus.Errorf("DownloadFile: %v", err)
	}

	// Parse peer address
	peerAddr, err := peer.AddrInfoFromString(args.PeerAddr)
	if err != nil {
		err = fmt.Errorf("failed to parse peer address: %w", err)
		logrus.Errorf("DownloadFile: %v", err)
		return err
	}

	// Connect to peer with file
	if err := d.nodeService.Host.Connect(d.nodeService.Context, *peerAddr); err != nil {
		err = fmt.Errorf("failed to connect to peer: %w", err)
		logrus.Errorf("DownloadFile: %v", err)
		return err
	}
	defer d.nodeService.Host.Network().ClosePeer(peerAddr.ID)

	// Open stream for file transfer
	stream, err := d.nodeService.Host.NewStream(d.nodeService.Context, peerAddr.ID, bitswapProtocolID)
	if err != nil {
		err = fmt.Errorf("failed to create stream: %w", err)
		logrus.Errorf("DownloadFile: %v", err)
		return err
	}
	defer stream.Close()

	// Request file by CID
	_, err = stream.Write([]byte(args.Cid + "\n"))
	if err != nil {
		err = fmt.Errorf("failed to write cid to stream: %w", err)
		logrus.Errorf("DownloadFile: %v", err)
		return err
	}

	// Create file if not exists
	file, err := os.Create(args.Path)
	if err != nil {
		err = fmt.Errorf("failed to create file: %w", err)
		logrus.Errorf("DownloadFile: %v", err)
		return err
	}
	defer file.Close()

	// Copy databytes from stream to file
	_, err = io.Copy(file, stream)
	if err != nil {
		err = fmt.Errorf("failed to copy stream to file: %w", err)
		logrus.Errorf("DownloadFile: %v", err)
		return err
	}

	return nil
}
