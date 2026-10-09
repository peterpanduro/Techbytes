package main

import "testing"

// TestGreet checks that the first language in Accept-Language picks the greeting.
func TestGreet(t *testing.T) {
	cases := []struct{ header, want string }{
		{"sv-SE,sv;q=0.9,en;q=0.8", "Hej"},
		{"en-GB,en;q=0.9,sv;q=0.5", "Hello"},
		{"", "Hello"},
	}
	for _, c := range cases {
		if got := greet(c.header, "Hello"); got != c.want {
			t.Errorf("greet(%q) = %q, want %q", c.header, got, c.want)
		}
	}
}
