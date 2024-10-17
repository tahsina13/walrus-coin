package dht

import (
	"crypto/sha256"
	"errors"
	"fmt"
	"log"
	"net/http"

	"github.com/ipfs/go-cid"
	dht "github.com/libp2p/go-libp2p-kad-dht"
	record "github.com/libp2p/go-libp2p-record"
	"github.com/libp2p/go-libp2p/core/peer"
	"github.com/multiformats/go-multihash"
)

func (d *DhtService) CreateDht(r *http.Request, args *CreateDhtArgs, reply *CreateDhtReply) error {
	if d.NodeService == nil {
		return errors.New("no node service")
	}
	ctx := d.NodeService.GetContext()
	if ctx == nil {
		return errors.New("context not initialized")
	}
	h := d.NodeService.GetHost()
	if h == nil {
		return errors.New("host not initialized")
	}
	if d.client != nil {
		return errors.New("dht client already initialized")
	}

	// Set up the DHT instance
	kadDHT, err := dht.New(ctx, h, dht.Mode(dht.ModeClient))
	if err != nil {
		err = fmt.Errorf("failed to create dht client: %w", err)
		log.Printf("CreateDht: %v\n", err)
		return err
	}

	// Configure the DHT to use the custom validator
	kadDHT.Validator = record.NamespacedValidator{
		"orcanet": &CustomValidator{}, // Add a custom validator for the "orcanet" namespace
	}

	// Bootstrap the DHT (connect to other peers to join the DHT network)
	err = kadDHT.Bootstrap(ctx)
	if err != nil {
		err = fmt.Errorf("failed to bootstrap dht client: %w", err)
		log.Printf("CreateDht: %v\n", err)
		return err
	}

	go func() {
		<-ctx.Done()
		if err := kadDHT.Close(); err != nil {
			log.Println(err) // TODO: better error messaging
		}
		d.client = nil
	}()

	d.client = kadDHT
	return nil
}

func (d *DhtService) CloseDht(r *http.Request, args *CreateDhtArgs, reply *CreateDhtReply) error {
	if d.client == nil {
		return errors.New("dht client not initialized")
	}
	if err := d.client.Close(); err != nil {
		err = fmt.Errorf("failed to close dht client: %w", err)
		log.Printf("CloseDht: %v\n", err)
		return err
	}
	return nil
}

func (d *DhtService) GetValue(r *http.Request, args *GetValueArgs, reply *GetValueReply) error {
	if d.NodeService == nil {
		return errors.New("no node service")
	}
	if d.client == nil {
		return errors.New("dht client not initialized")
	}
	dhtKey := "/orcanet/" + args.Key
	value, err := d.client.GetValue(d.NodeService.GetContext(), dhtKey)
	if err != nil {
		err = fmt.Errorf("failed to get value: %w", err)
		log.Printf("GetValue: %v\n", err)
		return err
	}
	reply.Value = string(value)
	return nil
}

func (d *DhtService) GetProviders(r *http.Request, args *GetProvidersArgs, reply *GetProvidersReply) error {
	if d.NodeService == nil {
		return errors.New("no node service")
	}
	if d.client == nil {
		return errors.New("dht client not initialized")
	}
	key := args.Key
	data := []byte(key)
	hash := sha256.Sum256(data)
	mh, err := multihash.EncodeName(hash[:], "sha2-256")
	if err != nil {
		err = fmt.Errorf("error encoding multihash: %w", err)
		log.Printf("GetProviders: %v\n", err)
		return err
	}
	c := cid.NewCidV1(cid.Raw, mh)
	providers := d.client.FindProvidersAsync(d.NodeService.GetContext(), c, args.Count)

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
	if d.NodeService == nil {
		return errors.New("no node service")
	}
	if d.client == nil {
		return errors.New("dht client not initialized")
	}
	dhtKey := "/orcanet/" + args.Key
	if err := d.client.PutValue(d.NodeService.GetContext(), dhtKey, []byte(args.Value)); err != nil {
		err = fmt.Errorf("failed to put value: %w", err)
		log.Printf("PutValue: %v\n", err)
		return err
	}
	return nil
}

func (d *DhtService) PutProvider(r *http.Request, args *PutProviderArgs, reply *PutProviderReply) error {
	if d.NodeService == nil {
		return errors.New("no node service")
	}
	if d.client == nil {
		return errors.New("dht client is not initialized")
	}
	data := []byte(args.Key)
	hash := sha256.Sum256(data)
	mh, err := multihash.EncodeName(hash[:], "sha2-256")
	if err != nil {
		err = fmt.Errorf("PutProvider: error encoding multihash: %w", err)
		log.Printf("PutProvider: %v\n", err)
		return err
	}
	c := cid.NewCidV1(cid.Raw, mh)

	// Start providing the key
	if err := d.client.Provide(d.NodeService.GetContext(), c, true); err != nil {
		err = fmt.Errorf("PutProvider: failed to start providing key: %w", err)
		log.Printf("PutProvider: %v\n", err)
		return err
	}
	return nil
}
