package routers

import (
	"github.com/gorilla/mux"
	"github.com/tahsina13/walrus-coin/backend/internal/handlers"
	"github.com/tahsina13/walrus-coin/backend/internal/util"
)

func NewRoutingRouter(h *handlers.RoutingHandler) *mux.Router {
	r := mux.NewRouter()

	r.Handle("/findpeer", util.WithError(h.FindPeer)).Methods("POST")
	r.Handle("/findprovos", util.WithError(h.FindProvos)).Methods("POST")
	r.Handle("/provide", util.WithError(h.Provide)).Methods("POST")
	r.Handle("/provideproxy", util.WithError(h.ProvideProxy)).Methods("POST")
	r.Handle("/findproxyprovos", util.WithError(h.FindProxyProvos)).Methods("POST")

	return r
}
