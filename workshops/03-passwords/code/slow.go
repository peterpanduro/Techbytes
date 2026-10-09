package main

import (
	"crypto/pbkdf2"
	"crypto/rand"
	"crypto/sha256"
	"fmt"
	"time"
)

const iterations = 600_000 // OWASP-recommended work factor for PBKDF2-HMAC-SHA256

func main() {
	salt := make([]byte, 16)
	rand.Read(salt)
	start := time.Now()
	pbkdf2.Key(sha256.New, "dragon", salt, iterations, 32)
	per := time.Since(start)
	fmt.Printf("one hash: %v  (%.0f hashes/second)\n", per, 1/per.Seconds())

	words := 300.0
	fmt.Printf("step-2 wordlist (300 words): %v\n", time.Duration(words*float64(per)))
	space := 26.0 * 26 * 26 * 26 * 26 * 26 * 26 * 26 // 8 lowercase letters
	secs := space * per.Seconds()
	fmt.Printf("all 8-char lowercase (%.2e): %.0f years\n", space, secs/(3600*24*365))
}
