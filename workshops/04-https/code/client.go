package main

import (
	"crypto/tls"
	"crypto/x509"
	"log"
	"net/http"
	"os"
)

func main() {
	ca, _ := os.ReadFile("ca.pem")
	pool := x509.NewCertPool()
	pool.AppendCertsFromPEM(ca)
	tr := &http.Transport{TLSClientConfig: &tls.Config{RootCAs: pool}}
	resp, err := (&http.Client{Transport: tr}).Get("https://localhost:8443/")
	if err != nil {
		log.Fatal(err)
	}
	resp.Write(os.Stdout)
}
