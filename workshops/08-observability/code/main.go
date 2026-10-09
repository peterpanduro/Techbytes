package main

import (
	"fmt"
	"log"
	"log/slog"
	"math/rand/v2"
	"net/http"
	"os"
	"time"
)

// recorder remembers the status code a handler wrote, so we can log it.
type recorder struct {
	http.ResponseWriter
	status int
}

func (r *recorder) WriteHeader(code int) { r.status = code; r.ResponseWriter.WriteHeader(code) }

// wrap runs around every handler: time it, log one line, record one observation.
func wrap(h http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		id := fmt.Sprintf("%08x", rand.Uint32())
		r.Header.Set("X-Request-Id", id)
		rec := &recorder{w, 200}
		h(rec, r)
		slog.Info("request", "method", r.Method, "path", r.URL.Path, "status", rec.status,
			"duration_ms", time.Since(start).Milliseconds(), "request_id", id)
		observe(r.URL.Path, rec.status, time.Since(start).Seconds())
	}
}

func main() {
	slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, nil)))
	http.HandleFunc("/", wrap(func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, "hello")
	}))
	http.HandleFunc("/products", wrap(func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, `["socks","hat","mug"]`)
	}))
	http.HandleFunc("/checkout", wrap(func(w http.ResponseWriter, r *http.Request) {
		time.Sleep(300 * time.Millisecond) // the payment provider is never fast
		if rand.IntN(10) == 0 {            // and one call in ten hangs
			time.Sleep(2 * time.Second)
			slog.Warn("payment provider timed out", "request_id", r.Header.Get("X-Request-Id"))
			http.Error(w, "payment provider timed out", http.StatusGatewayTimeout)
			return
		}
		fmt.Fprintln(w, "paid")
	}))
	http.HandleFunc("/metrics", metrics)
	log.Println("listening on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
