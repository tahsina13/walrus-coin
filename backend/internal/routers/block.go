package routers

import (
	"github.com/gorilla/mux"
	"github.com/tahsina13/walrus-coin/backend/internal/handlers"
	"github.com/tahsina13/walrus-coin/backend/internal/util"
)

func NewBlockRouter(h *handlers.BlockHandler) *mux.Router {
	r := mux.NewRouter()

	r.HandleFunc("/get", util.WithError(h.Get)).Methods("POST")
	r.HandleFunc("/getproxy", util.WithError(h.GetProxy)).Methods("POST")
	r.HandleFunc("/putproxy", util.WithError(h.PutProxy)).Methods("POST")
	r.HandleFunc("/put", util.WithError(h.Put)).Methods("POST")
	r.HandleFunc("/list", util.WithError(h.List)).Methods("POST")
	r.HandleFunc("/rm", util.WithError(h.Remove)).Methods("POST")
	r.HandleFunc("/stat", util.WithError(h.Stat)).Methods("POST")

	return r
}
