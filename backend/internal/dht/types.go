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

// Result struct used for responses
type Result struct {
	Success bool 
	Value   string 
}

type DHTClient struct {}