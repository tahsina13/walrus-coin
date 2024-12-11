package routers

import (
	"net/http"

	"github.com/gorilla/mux"
	leveldb "github.com/ipfs/go-ds-leveldb"
	dht "github.com/libp2p/go-libp2p-kad-dht"
	"github.com/libp2p/go-libp2p/core/host"
	"github.com/tahsina13/walrus-coin/backend/internal/handlers"
)

func NewAPIRouter(node host.Host, dht *dht.IpfsDHT, dstore *leveldb.Datastore) (*mux.Router, error) {
	bootstrapHandler, err := handlers.NewBootstrapHandler(node)
	if err != nil {
		return nil, err
	}

	routingHandler, err := handlers.NewRoutingHandler(dht)
	if err != nil {
		return nil, err
	}

	blockHandler, err := handlers.NewBlockHandler(node, dstore)
	if err != nil {
		return nil, err
	}

	r := mux.NewRouter()
	r.PathPrefix("/bootstrap").Handler(http.StripPrefix("/bootstrap", NewBootstrapRouter(bootstrapHandler)))
	r.PathPrefix("/routing").Handler(http.StripPrefix("/routing", NewRoutingRouter(routingHandler)))
	r.PathPrefix("/block").Handler(http.StripPrefix("/block", NewBlockRouter(blockHandler)))

	return r, nil
}
