package rpcdefs

import(
	"log"
	"net/rpc"
)

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

// Function to make DHTGet RPC call and return the result
func DHTGet(client *rpc.Client, key string) Result {
	dhtGetArgs := DHTGetArgs{Key: key}
	var dhtGetReply Result

	err := client.Call("DHTServer.DHTGet", &dhtGetArgs, &dhtGetReply)
	if err != nil {
		log.Fatal("RPC DHTGet error:", err)
	}

	return dhtGetReply
}

// Function to make DHTPut RPC call and return the result
func DHTPut(client *rpc.Client, key string, value string) Result {
	dhtPutArgs := DHTPutArgs{Key: key, Value: value}
	var dhtPutReply Result

	err := client.Call("DHTServer.DHTPut", &dhtPutArgs, &dhtPutReply)
	if err != nil {
		log.Fatal("RPC DHTPut error:", err)
	}

	return dhtPutReply
}