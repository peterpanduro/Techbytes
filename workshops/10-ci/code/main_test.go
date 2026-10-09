package main

import (
	"path/filepath"
	"testing"
)

// TestBump counts three visits in a fresh, empty folder that Go deletes afterwards.
func TestBump(t *testing.T) {
	path := filepath.Join(t.TempDir(), "visits.txt")
	for want := 1; want <= 3; want++ {
		if got := bump(path); got != want {
			t.Fatalf("visit %d: bump returned %d", want, got)
		}
	}
}
