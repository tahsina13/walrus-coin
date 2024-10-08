package dht_test

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
	dhtGetResponse := rpcdefs.DHTGet(client, "24")
	log.Printf("DHTGet Response: Success=%v, Value=%s", dhtGetResponse.Success, dhtGetResponse.Value)

	dhtGetResponse = rpcdefs.DHTGet(client, "some_key")
	log.Printf("DHTGet Response: Success=%v, Value=%s", dhtGetResponse.Success, dhtGetResponse.Value)
	
	dhtGetResponse = rpcdefs.DHTGet(client, "invalid_key")
	log.Printf("DHTGet Response: Success=%v, Value=%s", dhtGetResponse.Success, dhtGetResponse.Value)

	dhtPutResponse := rpcdefs.DHTPut(client, "some_key", "some_value")
	log.Printf("DHTPut Response: Success=%v, Value=%s", dhtPutResponse.Success, dhtPutResponse.Value)
}


