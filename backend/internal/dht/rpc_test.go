package main

import (
	"log"
	"net/rpc"
	"testing"
	"github.com/tahsina13/walrus-coin/backend/internal/rpcdefs" // Import your rpcdefs package
)

func TestDHT(t *testing.T) {
	client, err := rpc.Dial("tcp", "localhost:8888")
	if err != nil {
		log.Fatal("Dialing error:", err)
	}
	defer client.Close()

	// Call DHTGet and DHTPut using the refactored functions
	dhtGetResponse := DHTGet(client, "24")
	log.Printf("DHTGet Response: Success=%v, Value=%s", dhtGetResponse.Success, dhtGetResponse.Value)

	dhtGetResponse = DHTGet(client, "some_key")
	log.Printf("DHTGet Response: Success=%v, Value=%s", dhtGetResponse.Success, dhtGetResponse.Value)
	
	dhtGetResponse = DHTGet(client, "invalid_key")
	log.Printf("DHTGet Response: Success=%v, Value=%s", dhtGetResponse.Success, dhtGetResponse.Value)

	dhtPutResponse := DHTPut(client, "some_key", "some_value")
	log.Printf("DHTPut Response: Success=%v, Value=%s", dhtPutResponse.Success, dhtPutResponse.Value)
}

// Function to make DHTGet RPC call and return the result
func DHTGet(client *rpc.Client, key string) rpcdefs.Result {
	dhtGetArgs := rpcdefs.DHTGet{Key: key}
	var dhtGetReply rpcdefs.Result

	err := client.Call("DHTServer.DHTGet", &dhtGetArgs, &dhtGetReply)
	if err != nil {
		log.Fatal("RPC DHTGet error:", err)
	}

	return dhtGetReply
}

// Function to make DHTPut RPC call and return the result
func DHTPut(client *rpc.Client, key string, value string) rpcdefs.Result {
	dhtPutArgs := rpcdefs.DHTPut{Key: key, Value: value}
	var dhtPutReply rpcdefs.Result

	err := client.Call("DHTServer.DHTPut", &dhtPutArgs, &dhtPutReply)
	if err != nil {
		log.Fatal("RPC DHTPut error:", err)
	}

	return dhtPutReply
}
