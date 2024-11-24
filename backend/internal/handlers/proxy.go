package handlers

import (
	"errors"
	"fmt"
	"net/http"
	"strconv"

	"github.com/elazarl/goproxy"
	dht "github.com/libp2p/go-libp2p-kad-dht"
	"github.com/libp2p/go-libp2p/core/host"
	"github.com/sirupsen/logrus"
)

type ProxyHandler struct {
	node   host.Host
	dht    *dht.IpfsDHT
	server *http.Server
}

func NewProxyHandler(node host.Host, dht *dht.IpfsDHT) (*ProxyHandler, error) {
	if node == nil {
		return nil, errors.New("node is nil")
	}
	if dht == nil {
		return nil, errors.New("dht is nil")
	}
	return &ProxyHandler{node: node, dht: dht}, nil
}

func (h *ProxyHandler) Start(w http.ResponseWriter, r *http.Request) error {
	if h.server != nil {
		return errors.New("server already running")
	}

	query := r.URL.Query()

	var port int
	val, ok := query["port"]
	if ok {
		p, err := strconv.Atoi(val[0])
		if err != nil {
			return err
		}
		port = p
	} else {
		port = 8080 // default port
	}

	// TODO: add stream handler
	// TODO: add dht provider

	h.server = &http.Server{
		Addr:    fmt.Sprintf(":%d", port),
		Handler: goproxy.NewProxyHttpServer(),
	}

	go func() {
		logrus.Infof("Proxy server listening on port %d", port)
		if err := h.server.ListenAndServe(); err != nil {
			logrus.Errorf("Proxy server error: %s", err)
			h.server = nil
		}
	}()

	// TODO: write a response
	return nil
}

func (h *ProxyHandler) Stop(w http.ResponseWriter, r *http.Request) error {
	// TODO: think about synchronization
	if h.server == nil {
		return errors.New("server not running")
	}

	if err := h.server.Close(); err != nil {
		return err
	}
	h.server = nil

	// TODO: write a response
	return nil
}
