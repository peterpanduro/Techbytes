package main

import (
	"crypto/subtle"
	"fmt"
	"strings"
	"time"
)

func avg(compare func() bool, reps int) time.Duration {
	hits := 0
	start := time.Now()
	for i := 0; i < reps; i++ {
		if compare() {
			hits++
		}
	}
	_ = hits
	return time.Since(start) / time.Duration(reps)
}

func main() {
	const n, reps = 65536, 50000
	secret := strings.Repeat("a", n)
	first := "b" + secret[1:]  // differs at the FIRST byte
	last := secret[:n-1] + "b" // differs at the LAST byte
	sec, fb, lb := []byte(secret), []byte(first), []byte(last)

	fmt.Println("plain ==")
	fmt.Println("  differs at first byte:", avg(func() bool { return secret == first }, reps))
	fmt.Println("  differs at last byte :", avg(func() bool { return secret == last }, reps))
	fmt.Println("subtle.ConstantTimeCompare")
	fmt.Println("  differs at first byte:", avg(func() bool { return subtle.ConstantTimeCompare(sec, fb) == 1 }, reps))
	fmt.Println("  differs at last byte :", avg(func() bool { return subtle.ConstantTimeCompare(sec, lb) == 1 }, reps))
}
