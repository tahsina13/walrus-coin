package util

import (
	"net/http"

	"github.com/sirupsen/logrus"
)

type HandlerE = func(w http.ResponseWriter, r *http.Request) error

type ErrorResponder interface {
	RespondError(w http.ResponseWriter, r *http.Request) bool
}

func WithError(h HandlerE) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if err := h(w, r); err != nil {
			if er, ok := err.(ErrorResponder); ok {
				if er.RespondError(w, r) {
					return
				}
			}

			logrus.Errorf("Something went wrong: %s", err)

			http.Error(w, http.StatusText(http.StatusInternalServerError), http.StatusInternalServerError)
		}
	}
}
