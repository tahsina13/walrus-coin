package routers

import (
	"github.com/gorilla/mux"
	"github.com/tahsina13/walrus-coin/backend/internal/handlers"
	"github.com/tahsina13/walrus-coin/backend/internal/util"
)

func NewProxyRouter(h *handlers.ProxyHandler) *mux.Router {
	r := mux.NewRouter()

	r.HandleFunc("/start", util.WithError(h.Start)).Methods("POST")
	r.HandleFunc("/stop", util.WithError(h.Stop)).Methods("POST")

	return r
}
