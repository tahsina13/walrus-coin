package util

import (
	"net/http"
	"time"

	"github.com/sirupsen/logrus"
)

func LoggerMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		logrus.Infof("Started %s: %s", r.Method, r.URL.Path)

		// Call the next handler
		next.ServeHTTP(w, r)

		duration := time.Since(start)
		logrus.Infof("Completed %s: %s in %v", r.Method, r.URL.Path, duration)
	})
}
