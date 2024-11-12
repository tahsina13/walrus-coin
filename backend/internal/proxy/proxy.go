package proxy

import (
	"bufio"
	"fmt"
	"io"
	"log"
	"net/http"
	"context"

	"github.com/libp2p/go-libp2p/core/network"
	"github.com/libp2p/go-libp2p/core/peer"
	"github.com/tahsina13/walrus-coin/backend/internal/node"
)

const (
	ProtocolID = "/walrusnet/proxy"
)

type ProxyService struct {
	nodeService *node.NodeService
	DestPeerID peer.ID 
}

func NewProxyService(n *node.NodeService) *ProxyService {
	return &ProxyService{nodeService: n}
}

// SetDestination sets the destination peer ID via RPC
func (n *ProxyService) SetProxy(r *http.Request, args *SetProxyRequest, reply *SetProxyResponse) error {
	n.DestPeerID = args.DestPeerID
	reply.Status = "Destination peer ID set successfully"
	return nil
}

func (n *ProxyService) StartServerProxy(r *http.Request, args *StartServerProxyRequest, reply *StartServerProxyResponse) error{
	n.nodeService.Host.SetStreamHandler(ProtocolID, serverStreamHandler)
	return nil
}

func (n *ProxyService) StopServerProxy(r *http.Request, args *StopServerProxyRequest, reply *StopServerProxyResponse) error{ 
	n.nodeService.Host.RemoveStreamHandler(ProtocolID)
	return nil
}

// serverStreamHandler handles incoming HTTP requests over libp2p streams
func serverStreamHandler(stream network.Stream) {
    defer stream.Close()

    // Create a new buffered reader for reading the incoming HTTP request
    buf := bufio.NewReader(stream)
    req, err := http.ReadRequest(buf)
    if err != nil {
        stream.Reset()
        log.Printf("Error reading request: %v\n", err)
        return
    }
    defer req.Body.Close()

    // Ensure we reset the URL for making an outbound request
    req.URL.Scheme = "http"
    req.URL.Host = req.Host
	req.RequestURI = ""

    // Create a new HTTP request based on the incoming request
    outreq := new(http.Request)
    *outreq = *req

    // Create an HTTP client with custom settings
    client := &http.Client{}

    log.Printf("Making request to %s\n", req.URL)
    resp, err := client.Do(outreq)
    if err != nil {
        stream.Reset()
        log.Printf("Error making request: %v\n", err)
        return
    }

    // Write the response back to the libp2p stream
    err = resp.Write(stream)
    if err != nil {
        log.Printf("Error writing response to stream: %v\n", err)
    }
}



// Proxy HTTP handler forwards requests to the set peer ID and proxy address over libp2p
// func (n *ProxyService) Proxy(w http.ResponseWriter, r *http.Request) {
// 	fmt.Printf("Received request on /: %s %s\n", r.Method, r.URL)		
// 	fmt.Println("Proxying request to", n.DestPeerID)
// 	if n.DestPeerID == "" {
// 		http.Error(w, "Destination peer ID not set", http.StatusBadRequest)
// 		return
// 	}

// 	// Open a new stream to the configured destination peer
// 	ctx := network.WithAllowLimitedConn(n.nodeService.Context, ProtocolID)
// 	stream, err := n.nodeService.Host.NewStream(ctx, n.DestPeerID, ProtocolID)
// 	if err != nil {
// 		log.Println("Error creating stream:", err)
// 		http.Error(w, "Failed to create stream to destination", http.StatusInternalServerError)
// 		return
// 	}
// 	defer stream.Close()

// 	// Write the HTTP request to the libp2p stream
// 	err = r.Write(stream)
// 	if err != nil {
// 		stream.Reset()
// 		log.Println("Error writing to stream:", err)
// 		http.Error(w, "Failed to send request", http.StatusServiceUnavailable)
// 		return
// 	}

// 	// Read the response from the stream
// 	buf := bufio.NewReader(stream)
// 	resp, err := http.ReadResponse(buf, r)
// 	if err != nil {
// 		stream.Reset()
// 		log.Println("Error reading response from stream:", err)
// 		http.Error(w, "Failed to receive response", http.StatusServiceUnavailable)
// 		return
// 	}

// 	// Copy headers from the response to the client
// 	for k, v := range resp.Header {
// 		for _, s := range v {
// 			w.Header().Add(k, s)
// 		}
// 	}

// 	// Write response status code
// 	w.WriteHeader(resp.StatusCode)

// 	// Copy the body to the client
// 	io.Copy(w, resp.Body)
// 	resp.Body.Close()
// }

func (p *ProxyService) Proxy(w http.ResponseWriter, r *http.Request) {
	fmt.Printf("proxying request for %s to peer %s\n", r.URL, p.DestPeerID)
	// We need to send the request to the remote libp2p peer, so
	// we open a stream to it
	stream, err := p.nodeService.Host.NewStream(context.Background(), p.DestPeerID, ProtocolID)
	// If an error happens, we write an error for response.
	if err != nil {
		log.Println(err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer stream.Close()

	// r.Write() writes the HTTP request to the stream.
	err = r.Write(stream)
	if err != nil {
		stream.Reset()
		log.Println(err)
		http.Error(w, err.Error(), http.StatusServiceUnavailable)
		return
	}

	// Now we read the response that was sent from the dest
	// peer
	buf := bufio.NewReader(stream)
	resp, err := http.ReadResponse(buf, r)
	if err != nil {
		stream.Reset()
		log.Println(err)
		http.Error(w, err.Error(), http.StatusServiceUnavailable)
		return
	}

	// Copy any headers
	for k, v := range resp.Header {
		for _, s := range v {
			w.Header().Add(k, s)
		}
	}

	// Write response status and headers
	w.WriteHeader(resp.StatusCode)

	// Finally copy the body
	io.Copy(w, resp.Body)
	resp.Body.Close()
}