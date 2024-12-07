package routers

import (
	"github.com/gorilla/mux"
	"github.com/tahsina13/walrus-coin/backend/internal/handlers"
	"github.com/tahsina13/walrus-coin/backend/internal/util"
)

func NewProxyRouter(h *handlers.ProxyHandler) *mux.Router {
	r := mux.NewRouter()

	r.Handle("/connect", util.WithError(h.StartProxying)).Methods("POST")
	r.Handle("/disconnect", util.WithError(h.StopProxying)).Methods("POST")
	r.Handle("/start", util.WithError(h.StartProxyServer)).Methods("POST")
	r.Handle("/stop", util.WithError(h.StopProxyServer)).Methods("POST")

	return r
}
