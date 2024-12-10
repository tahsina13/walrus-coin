package handlers

import (
	"context"
	"fmt"
	"io"
	"log"
	"net"
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

	h.localProxy = &http.Server{
		Addr:    ":8083",
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
    
	proxy.OnRequest().DoFunc(func(req *http.Request, ctx *goproxy.ProxyCtx) (*http.Request, *http.Response) {
		// Create counting readers and writers
		countingReqBody := &countingReader{reader: req.Body}
		req.Body = io.NopCloser(countingReqBody)

		// Make the request to the remote server
		resp, err := http.DefaultTransport.RoundTrip(req)
		if err != nil {
			return req, goproxy.NewResponse(req, goproxy.ContentTypeText, http.StatusInternalServerError, "Internal Server Error")
		}

		countingRespBody := &countingReader{reader: resp.Body}
		resp.Body = io.NopCloser(countingRespBody)

		// Log the byte counts
		go func() {
			time.Sleep(1 * time.Second) // Wait for the response to be fully read
			fmt.Printf("Bytes sent to remote: %d, Bytes received from remote: %d, Price per byte: %d\n", countingReqBody.bytesCount, countingRespBody.bytesCount, priceInt)
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
		remote, err := net.Dial("tcp", req.URL.Host)
		orPanic(err)
		defer remote.Close()

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
			bytes, err := io.Copy(remote, client)
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
			bytes, err := io.Copy(client, remote)
			if err != nil {
				log.Printf("Error copying from remote to client: %v", err)
			}
			remoteToClient <- bytes
		}()

		// Wait for both directions to complete
		totalClientToRemote := <-clientToRemote
		totalRemoteToClient := <-remoteToClient

		// Log the byte counts
		fmt.Printf("Bytes sent to remote: %d, Bytes received from remote: %d, Price per byte: %d\n",
			totalClientToRemote, totalRemoteToClient, priceInt)
	})


	h.remoteProxy = &http.Server{
		Addr:    port,
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
