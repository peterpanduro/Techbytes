package main

import (
	"crypto/pbkdf2"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
)

func main() {
	key, _ := pbkdf2.Key(sha256.New, "techbytes", []byte("salt"), 1000, 16)
	fmt.Println("ready", hex.EncodeToString(key))
}
