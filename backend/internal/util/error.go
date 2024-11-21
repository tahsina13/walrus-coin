package util

import (
	"net/http"

	"github.com/sirupsen/logrus"
)

type HandlerE = func(w http.ResponseWriter, r *http.Request) error

func WithError(h HandlerE) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if err := h(w, r); err != nil {
			logrus.Errorf("%s: %s: %s", r.Method, r.URL.Path, err)
			http.Error(w, err.Error(), 500)
		}
	}
}
