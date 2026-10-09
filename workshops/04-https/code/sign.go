// The same signing step as "openssl x509 -req -CA ca.pem ...", written in Go,
// except that the certificate it issues expired yesterday. Writes expired.pem.
// Run from the https-lab folder:  go run ./sign
package main

import (
	"crypto"
	"crypto/rand"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/pem"
	"log"
	"math/big"
	"os"
	"time"
)

// readPEM returns the bytes inside the first PEM block of a file.
func readPEM(name string) []byte {
	raw, err := os.ReadFile(name)
	if err != nil {
		log.Fatal(err)
	}
	block, _ := pem.Decode(raw)
	if block == nil {
		log.Fatalf("%s: no PEM block found", name)
	}
	return block.Bytes
}

// readKey accepts both key formats openssl produces:
// "BEGIN PRIVATE KEY" (OpenSSL 3, PKCS#8) and "BEGIN RSA PRIVATE KEY" (LibreSSL on macOS, PKCS#1).
func readKey(name string) crypto.Signer {
	der := readPEM(name)
	if key, err := x509.ParsePKCS8PrivateKey(der); err == nil {
		return key.(crypto.Signer)
	}
	key, err := x509.ParsePKCS1PrivateKey(der)
	if err != nil {
		log.Fatal(err)
	}
	return key
}

func main() {
	ca, err := x509.ParseCertificate(readPEM("ca.pem"))
	if err != nil {
		log.Fatal(err)
	}
	caKey := readKey("ca-key.pem")
	serverKey := readKey("server-key.pem")

	// This struct is server.ext, as Go sees it, plus dates in the past.
	tmpl := &x509.Certificate{
		SerialNumber: big.NewInt(time.Now().Unix()),
		Subject:      pkix.Name{CommonName: "localhost"},
		DNSNames:     []string{"localhost"},
		NotBefore:    time.Now().Add(-48 * time.Hour),
		NotAfter:     time.Now().Add(-24 * time.Hour),
		KeyUsage:     x509.KeyUsageDigitalSignature | x509.KeyUsageKeyEncipherment,
		ExtKeyUsage:  []x509.ExtKeyUsage{x509.ExtKeyUsageServerAuth},
	}
	der, err := x509.CreateCertificate(rand.Reader, tmpl, ca, serverKey.Public(), caKey)
	if err != nil {
		log.Fatal(err)
	}
	out, err := os.Create("expired.pem")
	if err != nil {
		log.Fatal(err)
	}
	pem.Encode(out, &pem.Block{Type: "CERTIFICATE", Bytes: der})
	out.Close()
	log.Println("wrote expired.pem, expired on", tmpl.NotAfter.Format(time.RFC1123))
}
