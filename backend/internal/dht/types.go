package dht

// DHTGet struct used to request a DHT value
type DHTGetArgs struct {
	Key string 
}

// DHTPut struct used to put a value in the DHT
type DHTPutArgs struct {
	Key   string
	Value string
}

type ChangeNodeIDArgs struct {
	NodeID string 
}

type GetConnectedNodesArgs struct{}

// Result struct used for responses
type Result struct {
	Success bool 
	Value   string 
}

type PeerInfo struct {
	PeerID    string   `json:"peer_id"`
	Addresses []string `json:"addresses"`
}

type DHTClient struct {}
