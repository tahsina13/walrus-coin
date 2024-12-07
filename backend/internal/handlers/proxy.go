package handlers

import (
	"context"
	"log"
	"net/http"
	"net/url"
	"strconv"
	"time"

	"github.com/elazarl/goproxy"
	"github.com/tahsina13/walrus-coin/backend/internal/util"
)

type ProxyHandler struct {
	localProxy  *http.Server
	remoteProxy *http.Server
}

func NewProxyHandler() *ProxyHandler {
	return &ProxyHandler{}
}

func (h *ProxyHandler) StartProxying(w http.ResponseWriter, r *http.Request) error {
	h.StopProxy()
	remoteProxyAddr := r.FormValue("remoteProxyAddr")
	port := r.FormValue("port")
	if remoteProxyAddr == "" {
		return util.BadRequestWithBody(bootstrapError{Message: "No remote proxy address provided"})
	}
	secondHopProxyURL, err := url.Parse(remoteProxyAddr)
	if err != nil {
		log.Fatal(err)
	}
	if port == "" {
		port = ":8083"
	}
	

	if secondHopProxyURL.Port() == "" {
		secondHopProxyURL.Host = secondHopProxyURL.Hostname() + ":8084"
	}

	proxy := goproxy.NewProxyHttpServer()
	proxy.Verbose = false

    proxy.Tr = &http.Transport{
		Proxy: http.ProxyURL(secondHopProxyURL),
		ForceAttemptHTTP2: true, // Force HTTP/2 for better logging and proxy handling
	}
	proxy.ConnectDial = proxy.NewConnectDialToProxy(secondHopProxyURL.String())

	proxy.OnResponse().DoFunc(
		func(resp *http.Response, ctx *goproxy.ProxyCtx) *http.Response {
			price := resp.Header.Get("price")
			priceInt, err := strconv.Atoi(price)
			if err != nil {
				log.Printf("Unable to parse price to int: %v\n", err)
			}
			log.Print(priceInt)
			//TODO: LOGIC FOR SENDING MONEY
			return resp
		})

	h.localProxy = &http.Server{
		Addr:    ":8083",
		Handler: proxy,
	}

	// Run the server in a goroutine
	go func() {
		if err := h.localProxy.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Could not listen on :8083: %v\n", err)
		}
	}()
	return nil
}

func (h *ProxyHandler) StartProxyServer(w http.ResponseWriter, r *http.Request) error {
	price := r.FormValue("price")
	port := r.FormValue("port")
	if price == "" {
		return util.BadRequestWithBody(bootstrapError{Message: "No price included"})
	}
	priceInt, err := strconv.Atoi(price)
	if err != nil {
		return util.BadRequestWithBody(bootstrapError{Message: "Unable to parse price to int"})
	}
	if port == "" {
		port = ":8084"
	}

	proxy := goproxy.NewProxyHttpServer()
	proxy.Verbose = false
    
	proxy.OnResponse().DoFunc(
		func(resp *http.Response, ctx *goproxy.ProxyCtx) *http.Response {
			if resp.ContentLength > 0{
				resp.Header.Set("price", strconv.Itoa(priceInt*int(resp.ContentLength)))
			} else {
				resp.Header.Set("price", "0")
			}
			return resp
		})

	h.remoteProxy = &http.Server{
		Addr:    port,
		Handler: proxy,
	}

	// Run the server in a goroutine
	go func() {
		if err := h.remoteProxy.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Printf("Could not listen on :8084: %v\n", err)
		}
	}()
	return nil
}

func (h *ProxyHandler) StopProxying(w http.ResponseWriter, r *http.Request) error {
	if h.localProxy != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		if err := h.localProxy.Shutdown(ctx); err != nil {
			log.Fatalf("Proxying server Shutdown Failed:%+v", err)
			return err
		}
		log.Println("Proxying server stopped")
	}
	return nil
}

func (h *ProxyHandler) StopProxyServer(w http.ResponseWriter, r *http.Request) error {
	if h.remoteProxy != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()
		if err := h.remoteProxy.Shutdown(ctx); err != nil {
			log.Fatalf("Second hop proxy server Shutdown Failed:%+v", err)
			return err
		}
		log.Println("Second hop proxy server stopped")
	}
	return nil
}

func (h *ProxyHandler) StopProxy() { //called with start_proxy in order to stop if there is a proxy running
	if h.localProxy != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		if err := h.localProxy.Shutdown(ctx); err != nil {
			log.Fatalf("Proxying server Shutdown Failed:%+v", err)
		}
		log.Println("Proxying server stopped")
	}
}
