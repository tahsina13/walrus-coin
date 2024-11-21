package routers

import (
	"github.com/gorilla/mux"
	"github.com/tahsina13/walrus-coin/backend/internal/handlers"
	"github.com/tahsina13/walrus-coin/backend/internal/util"
)

func NewBootstrapRouter(h *handlers.BootstrapHandler) *mux.Router {
	r := mux.NewRouter()

	r.HandleFunc("/add", util.WithError(h.Add)).Methods("POST")
	r.HandleFunc("/list", util.WithError(h.List)).Methods("POST")
	r.HandleFunc("/rm", util.WithError(h.Remove)).Methods("POST")

	return r
}
