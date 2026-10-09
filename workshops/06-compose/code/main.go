// The API: takes jobs in over HTTP and puts them on a Redis list.
// It never does the work itself; a worker somewhere else does.
package main

import (
	"bufio"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"io"
	"log"
	"net"
	"net/http"
	"os"
	"strconv"
	"strings"
)

func main() {
	addr := os.Getenv("REDIS_ADDR") // "redis:6379" inside Compose
	if addr == "" {
		addr = "localhost:6379"
	}

	// POST /jobs with any text body: give it an id, push "<id> <text>" on the list.
	http.HandleFunc("POST /jobs", func(w http.ResponseWriter, r *http.Request) {
		body, _ := io.ReadAll(r.Body)
		id := newID()
		n, err := redis(addr, "LPUSH", "jobs", id+" "+string(body))
		if err != nil {
			http.Error(w, err.Error(), 502)
			return
		}
		log.Printf("queued %s (%s waiting)", id, n)
		fmt.Fprintf(w, "{\"id\":%q}\n", id)
	})

	// GET /jobs/<id>: the worker leaves the answer in the key result:<id>.
	http.HandleFunc("GET /jobs/{id}", func(w http.ResponseWriter, r *http.Request) {
		result, err := redis(addr, "GET", "result:"+r.PathValue("id"))
		if err != nil {
			http.Error(w, err.Error(), 502)
			return
		}
		if result == "" {
			http.Error(w, "not done yet", 404)
			return
		}
		fmt.Fprintln(w, result)
	})

	log.Println("api listening on :8080, redis at", addr)
	log.Fatal(http.ListenAndServe(":8080", nil))
}

// redis sends one command in RESP, the Redis wire protocol, and returns the reply.
// A command is an array of bulk strings: "*2\r\n$3\r\nGET\r\n$5\r\nhello\r\n".
func redis(addr string, args ...string) (string, error) {
	c, err := net.Dial("tcp", addr)
	if err != nil {
		return "", err
	}
	defer c.Close()
	fmt.Fprintf(c, "*%d\r\n", len(args))
	for _, a := range args {
		fmt.Fprintf(c, "$%d\r\n%s\r\n", len(a), a)
	}
	rd := bufio.NewReader(c)
	line, err := rd.ReadString('\n')
	if err != nil {
		return "", err
	}
	line = strings.TrimRight(line, "\r\n")
	switch line[0] {
	case '+', ':': // simple string or integer: "+OK", ":3"
		return line[1:], nil
	case '-': // error: "-ERR unknown command"
		return "", fmt.Errorf("redis: %s", line[1:])
	case '$': // bulk string: "$5\r\nhello\r\n"; "$-1" means no such key
		n, _ := strconv.Atoi(line[1:])
		if n < 0 {
			return "", nil
		}
		buf := make([]byte, n+2)
		_, err = io.ReadFull(rd, buf)
		return string(buf[:n]), err
	}
	return "", fmt.Errorf("redis: unexpected reply %q", line)
}

func newID() string {
	b := make([]byte, 4)
	rand.Read(b)
	return hex.EncodeToString(b)
}
