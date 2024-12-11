package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net"
	"net/http"
	"net/url"
	"strconv"
	"time"

	"github.com/elazarl/goproxy"
	"github.com/ipfs/go-cid"
	dht "github.com/libp2p/go-libp2p-kad-dht"
	"github.com/libp2p/go-libp2p/core/host"
	"github.com/libp2p/go-libp2p/core/network"
	"github.com/libp2p/go-libp2p/core/peer"
	"github.com/tahsina13/walrus-coin/backend/internal/util"
)

type ProxyHandler struct {
	localProxy  *http.Server
	remoteProxy *http.Server
	numBytes	uint64
	dht 	   *dht.IpfsDHT
	node	   host.Host
}

type Metadata struct{
	Price int `json:"price"`
	URL string `json:"url"`
}
var proxyCID = cid.NewCidV1(cid.Raw, []byte("proxy"))
var meta Metadata

const (
	proxyMetadata  = "/orcanet/proxy/data"
)

func NewProxyHandler(dhtInstance *dht.IpfsDHT, nodeInstance host.Host) *ProxyHandler {
	handler := &ProxyHandler{dht: dhtInstance, node: nodeInstance}
	return handler
}

func orPanic(err error) {
	if err != nil {
		panic(err)
	}
}

type countingReader struct {
	reader     io.Reader
	bytesCount int64
}

func (cr *countingReader) Read(p []byte) (int, error) {
	n, err := cr.reader.Read(p)
	cr.bytesCount += int64(n)
	return n, err
}

type BytesResponse struct {
    Bytes uint64 `json:"bytes"`
}

func (h *ProxyHandler) GetNumBytes(w http.ResponseWriter, r *http.Request) error {
	response := BytesResponse{
		Bytes: h.numBytes,
	}
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(response); err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return err
    }
	return nil
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
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte(fmt.Sprintf("Could not parse URL: %v", err))) // Send the error message
		return fmt.Errorf("could not parse URL: %v", err)
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
		ForceAttemptHTTP2: true, 
	}
	proxy.ConnectDial = proxy.NewConnectDialToProxy(secondHopProxyURL.String())

	proxy.OnRequest().DoFunc(func(req *http.Request, ctx *goproxy.ProxyCtx) (*http.Request, *http.Response) {
		// Wrap the request body to count bytes read
		countingReqBody := &countingReader{reader: req.Body}
		req.Body = io.NopCloser(countingReqBody)
	
		// Forward the request to the second hop
		resp, err := proxy.Tr.RoundTrip(req)
		if err != nil {
			return req, goproxy.NewResponse(req, goproxy.ContentTypeText, http.StatusInternalServerError, "Internal Server Error")
		}
	
		// Wrap the response body to count bytes written
		countingRespBody := &countingReader{reader: resp.Body}
		resp.Body = io.NopCloser(countingRespBody)
	
		// Log the byte counts
		go func() {
			time.Sleep(1 * time.Second) // Wait for the response to be fully read
			fmt.Printf("Bytes sent to remote: %d, Bytes received from remote: %d\n", countingReqBody.bytesCount, countingRespBody.bytesCount)
			h.numBytes += uint64(countingReqBody.bytesCount + countingRespBody.bytesCount)
		}()
	
		return req, resp
	})
	
	proxy.OnRequest().HijackConnect(func(req *http.Request, client net.Conn, ctx *goproxy.ProxyCtx) {
		defer func() {
			if e := recover(); e != nil {
				ctx.Logf("error connecting to remote: %v", e)
				client.Write([]byte("HTTP/1.1 500 Cannot reach destination\r\n\r\n"))
			}
			client.Close()
		}()

		// Connect to the remote server
		remoteProxyConn, err := net.Dial("tcp", secondHopProxyURL.Host)
		orPanic(err)
		defer remoteProxyConn.Close()

		connectRequest := fmt.Sprintf("CONNECT %s HTTP/1.1\r\nHost: %s\r\n\r\n", req.Host, req.Host)
		_, err = remoteProxyConn.Write([]byte(connectRequest))
		if err != nil {
			ctx.Logf("Error sending CONNECT request to remote proxy: %v", err)
			client.Write([]byte("HTTP/1.1 502 Bad Gateway\r\n\r\n"))
			return
		}

		// Step 3: Read the response from the remote proxy to confirm the tunnel is established
		buf := make([]byte, 1024)
		_, err = remoteProxyConn.Read(buf)
		if err != nil {
			ctx.Logf("Error reading response from remote proxy: %v", err)
			client.Write([]byte("HTTP/1.1 502 Bad Gateway\r\n\r\n"))
			return
		}

		// Notify client that the connection is established
		client.Write([]byte("HTTP/1.1 200 OK\r\n\r\n"))

		// Create channels to monitor byte counts
		clientToRemote := make(chan int64)
		remoteToClient := make(chan int64)

		// Copy data from client to remote and measure bytes
		go func() {
			defer func() {
				if r := recover(); r != nil {
					log.Printf("Recovered from panic: %v", r)
				}
			}()
			bytes, err := io.Copy(remoteProxyConn, client)
			if err != nil {
				log.Printf("Error: %v", err)
			}
			clientToRemote <- bytes
		}()
		
		// Copy data from remote to client and measure bytes
		go func() {
			defer func() {
				if r := recover(); r != nil {
					log.Printf("Recovered from panic: %v", r)
				}
			}()
			bytes, err := io.Copy(client, remoteProxyConn)
			if err != nil {
				log.Printf("Error copying from remote to client: %v", err)
			}
			remoteToClient <- bytes
		}()

		// Wait for both directions to complete
		totalClientToRemote := <-clientToRemote
		totalRemoteToClient := <-remoteToClient

		// Log the byte counts
		fmt.Printf("Bytes sent to remote: %d, Bytes received from remote: %d\n",
			totalClientToRemote, totalRemoteToClient)
		h.numBytes += uint64(totalClientToRemote + totalRemoteToClient)
	})


	h.localProxy = &http.Server{
		Addr:    port,
		Handler: proxy,
	}

	errCh := make(chan error, 1)
	go func() {
		// Attempt to start the proxy server
		err := h.localProxy.ListenAndServe()
		if err != nil && err != http.ErrServerClosed {
			errCh <- err
		}
	}()

	// 1 second timeout for proxy server to start
	select {
	case err := <-errCh:
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError) // Set the response status code to 500 (Internal Server Error)
			w.Write([]byte(fmt.Sprintf("Could not start local proxy server: %v", err))) // Send the error message
			return fmt.Errorf("could not start local proxy server: %v", err)
		}
	case <-time.After(1 * time.Second):
		log.Println("Local proxy server started successfully.")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("Local proxy server started successfully."))
	}

	return nil
}

func (h *ProxyHandler) StartProxyServer(w http.ResponseWriter, r *http.Request) error {
	query := r.URL.Query()
	if arg, ok := query["price"]; ok {
		var temp = arg[0]
		result, err := strconv.Atoi(temp)
		orPanic(err)
		meta.Price = result
	} else {
		return util.BadRequestWithBody(routingError{Message: "argument \"price\" is required"})
	}
	
	var ipaddr string
	if arg, ok := query["ipaddr"]; ok {
		var temp = arg[0]
		ipaddr = temp
	} else {
		return util.BadRequestWithBody(routingError{Message: "argument \"ipaddr\" is required"})
	}
	url, err := url.Parse(ipaddr)
	if err != nil {
		return util.BadRequestWithBody(routingError{Message: fmt.Sprintf("invalid ipaddr: %v", err)})
	}
	if(url.Port() == ""){
		url.Host = url.Hostname() + ":8084"
	}
	meta.URL = url.Host

	proxy := goproxy.NewProxyHttpServer()
	proxy.Verbose = false

	h.remoteProxy = &http.Server{
		Addr:    url.Host,
		Handler: proxy,
	}

	// Run the server in a goroutine
	errCh := make(chan error, 1)
	go func() {
		// Attempt to start the proxy server
		err := h.remoteProxy.ListenAndServe()
		if err != nil && err != http.ErrServerClosed {
			errCh <- err
		}
	}()
	// 1 second timeout for proxy server to start
	select {
	case err := <-errCh:
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError) // Set the response status code to 500 (Internal Server Error)
			w.Write([]byte(fmt.Sprintf("Could not start remote proxy server: %v", err))) // Send the error message
			return fmt.Errorf("could not start remote proxy server: %v", err)
		}
	case <-time.After(1 * time.Second):
		log.Println("Remote proxy server started successfully.")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("Remote proxy server started successfully."))
		err := h.dht.Provide(context.Background(), proxyCID, true)
		orPanic(err)
		h.node.SetStreamHandler(proxyMetadata, h.SendMetadata)
	}
	
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
		h.node.RemoveStreamHandler(proxyMetadata)
		h.dht.ProviderStore()
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

func (h *ProxyHandler) FindProxies(w http.ResponseWriter, r *http.Request) error {
	query := r.URL.Query()
	var count int
	if arg, ok := query["count"]; ok {
		temp, err := strconv.Atoi(arg[0])
		if err != nil {
			return util.BadRequestWithBody(routingError{Message: fmt.Sprintf("invalid count: %v", err)})
		}
		count = temp
	} else {
		count = 10
	}

	var metadataList []Metadata
	for p := range h.dht.FindProvidersAsync(r.Context(), proxyCID, count) {
		if p.ID == peer.ID("") {
			break
		}

		if p.ID == h.node.ID() {
			continue  // Skip this peer and move to the next iteration
		}

		fmt.Print("Found peer: ", p.ID, "\n")

		// Establish a stream to the peer
		stream, err := h.node.NewStream(r.Context(), p.ID, proxyMetadata)
		if err != nil {
			log.Printf("Error creating stream to peer %s: %v", p.ID, err)
			continue
		}

		// Retrieve metadata from the peer
		var metadata Metadata
		decoder := json.NewDecoder(stream)
		if err := decoder.Decode(&metadata); err != nil {
			log.Printf("Error decoding metadata from peer %s: %v", p.ID, err)
			continue
		}

		metadataList = append(metadataList, metadata)
	}

	// Send aggregated metadata as the response
	if err := json.NewEncoder(w).Encode(metadataList); err != nil {
		return util.BadRequest(err)
	}
	return nil
}


func (h *ProxyHandler) SendMetadata(s network.Stream){
	defer s.Close()
	jsonData, err := json.Marshal(meta)
	if err != nil {
		log.Printf("Error marshaling metadata: %v", err)
		return
	}
	_, err = s.Write(jsonData)
	if err != nil {
		log.Printf("Error sending metadata: %v", err)
		return
	}
	log.Printf("Sent metadata: %s", string(jsonData))
}