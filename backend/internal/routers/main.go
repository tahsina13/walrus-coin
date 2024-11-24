package routers

import (
	"net/http"

	"github.com/gorilla/mux"
	"github.com/ipfs/boxo/blockstore"
	dht "github.com/libp2p/go-libp2p-kad-dht"
	"github.com/libp2p/go-libp2p/core/host"
	"github.com/tahsina13/walrus-coin/backend/internal/handlers"
)

func NewAPIRouter(node host.Host, dht *dht.IpfsDHT, bstore blockstore.Blockstore) (*mux.Router, error) {
	bootstrapHandler, err := handlers.NewBootstrapHandler(node)
	if err != nil {
		return nil, err
	}

	routingHandler, err := handlers.NewRoutingHandler(dht)
	if err != nil {
		return nil, err
	}

	blockHandler, err := handlers.NewBlockHandler(node, bstore)
	if err != nil {
		return nil, err
	}

	proxyHandler, err := handlers.NewProxyHandler(node, dht)
	if err != nil {
		return nil, err
	}

	r := mux.NewRouter()
	r.PathPrefix("/bootstrap").Handler(http.StripPrefix("/bootstrap", NewBootstrapRouter(bootstrapHandler)))
	r.PathPrefix("/routing").Handler(http.StripPrefix("/routing", NewRoutingRouter(routingHandler)))
	r.PathPrefix("/block").Handler(http.StripPrefix("/block", NewBlockRouter(blockHandler)))
	r.PathPrefix("/proxy").Handler(http.StripPrefix("/proxy", NewProxyRouter(proxyHandler)))

	return r, nil
}
