package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/tahsina13/walrus-coin/backend/internal/coin"
)

func handleGetBlockCount(w http.ResponseWriter, r *http.Request) {
	count, err := coin.GetBlockCount()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	response := map[string]int64{
		"count": count,
	}
	jsonResponse, err := json.Marshal(response)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	w.Write(jsonResponse)
}

func GetCoinHandler() *http.ServeMux {
	mux := http.NewServeMux()
	mux.HandleFunc("/blockcount", handleGetBlockCount)
	return mux
}
