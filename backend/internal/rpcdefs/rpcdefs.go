package rpcdefs

// DHTGet struct used to request a DHT value
type DHTGet struct {
	Key string
}

// DHTPut struct used to put a value in the DHT
type DHTPut struct {
	Key   string
	Value string
}

// Result struct used for responses
type Result struct {
	Success bool
	Value   string
}