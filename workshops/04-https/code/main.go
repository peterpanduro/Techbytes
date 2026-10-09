package main

import (
	"fmt"
	"log"
	"net/http"
)

func main() {
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "Hello over %s, encrypted: %v\n", r.Proto, r.TLS != nil)
	})
	log.Fatal(http.ListenAndServeTLS(":8443", "server.pem", "server-key.pem", nil))
}
