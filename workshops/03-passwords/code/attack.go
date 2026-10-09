package main

import (
	"bufio"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"os"
	"strings"
	"time"
)

func main() {
	data, _ := os.ReadFile("hashes.txt")
	want := map[string]bool{}
	for _, h := range strings.Fields(string(data)) {
		want[h] = true
	}
	f, _ := os.Open("words.txt")
	sc := bufio.NewScanner(f)
	start := time.Now()
	for sc.Scan() {
		sum := sha256.Sum256([]byte(sc.Text()))
		if want[hex.EncodeToString(sum[:])] {
			fmt.Printf("cracked  %q\n", sc.Text())
		}
	}
	fmt.Printf("hashed the whole list in %v\n", time.Since(start))
}
