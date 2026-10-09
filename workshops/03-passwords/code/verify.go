package main

import (
	"crypto/pbkdf2"
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"fmt"
	"strconv"
	"strings"
)

const policy = 600_000

var b64 = base64.RawStdEncoding

func hashPassword(password string, iter int) string {
	salt := make([]byte, 16)
	rand.Read(salt)
	sum, _ := pbkdf2.Key(sha256.New, password, salt, iter, 32)
	return fmt.Sprintf("$pbkdf2-sha256$%d$%s$%s", iter, b64.EncodeToString(salt), b64.EncodeToString(sum))
}

// verify reports whether password matches stored, and whether stored should be replaced.
func verify(stored, password string) (ok, stale bool) {
	p := strings.Split(stored, "$")
	if len(p) != 5 || p[1] != "pbkdf2-sha256" {
		return false, false
	}
	iter, _ := strconv.Atoi(p[2])
	salt, _ := b64.DecodeString(p[3])
	want, _ := b64.DecodeString(p[4])
	got, _ := pbkdf2.Key(sha256.New, password, salt, iter, len(want))
	ok = subtle.ConstantTimeCompare(got, want) == 1
	return ok, ok && iter < policy
}

func main() {
	old := hashPassword("dragon", 100_000) // an account hashed years ago
	fmt.Println("stored:", old)

	ok, stale := verify(old, "dragon")
	fmt.Printf("correct password: ok=%v stale=%v\n", ok, stale)
	if ok && stale {
		old = hashPassword("dragon", policy)
		fmt.Println("upgraded:", old)
	}
	ok, stale = verify(old, "dragon")
	fmt.Printf("after upgrade   : ok=%v stale=%v\n", ok, stale)

	ok, _ = verify(old, "wrong")
	fmt.Printf("wrong password  : ok=%v\n", ok)
}
