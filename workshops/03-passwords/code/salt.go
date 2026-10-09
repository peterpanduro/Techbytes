package main

import (
	"bufio"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"os"
)

func saltedHash(salt []byte, password string) string {
	sum := sha256.Sum256(append(salt, []byte(password)...))
	return hex.EncodeToString(sum[:])
}

func main() {
	// alice and erin both chose the SAME password:
	pw := "dragon"
	aSalt, eSalt := make([]byte, 16), make([]byte, 16)
	rand.Read(aSalt)
	rand.Read(eSalt)
	fmt.Println("alice:", saltedHash(aSalt, pw))
	fmt.Println("erin :", saltedHash(eSalt, pw))
	fmt.Println("same password, different hashes -> rainbow tables are dead")

	// but if the DB leaks, the salt leaks with it. Attack erin, per user:
	target := saltedHash(eSalt, pw)
	f, _ := os.Open("words.txt")
	defer f.Close()
	for sc := bufio.NewScanner(f); sc.Scan(); {
		if saltedHash(eSalt, sc.Text()) == target {
			fmt.Printf("erin's password is still %q\n", sc.Text())
			break
		}
	}
}
