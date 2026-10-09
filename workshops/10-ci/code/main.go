// A tiny web server: says hello, tells you which machine it runs on,
// and counts visits in a file so we can see what survives a restart.
package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"

	"golang.org/x/text/language"
)

func main() {
	greeting := os.Getenv("GREETING") // configuration comes from the environment
	if greeting == "" {
		greeting = "Hello"
	}
	host, _ := os.Hostname() // inside a container this is the container id

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/" { // browsers also ask for /favicon.ico; do not count that
			http.NotFound(w, r)
			return
		}
		n := bump("visits.txt")
		log.Printf("%s %s -> visit %d", r.Method, r.URL.Path, n)
		fmt.Fprintf(w, "%s from %s! You are visit number %d.\n", greet(r.Header.Get("Accept-Language"), greeting), host, n)
	})

	log.Println("listening on http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

// bump reads a number from the file, adds one, writes it back.
func bump(path string) int {
	b, _ := os.ReadFile(path)
	n, _ := strconv.Atoi(strings.TrimSpace(string(b)))
	n++
	if err := os.WriteFile(path, []byte(strconv.Itoa(n)), 0o644); err != nil {
		log.Println("could not save the counter:", err)
	}
	return n
}

// greet says Hej to visitors whose first choice of language is Swedish.
func greet(acceptLanguage, fallback string) string {
	tags, _, err := language.ParseAcceptLanguage(acceptLanguage)
	if err != nil || len(tags) == 0 {
		return fallback
	}
	if base, _ := tags[0].Base(); base.String() == "sv" {
		return "Hej"
	}
	return fallback
}
