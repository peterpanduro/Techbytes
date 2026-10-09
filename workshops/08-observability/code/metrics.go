package main

import (
	"fmt"
	"math"
	"net/http"
	"strings"
	"sync"
)

// One counter (requests by path and status) and one histogram (seconds by path),
// kept in plain maps and printed in the Prometheus text format on /metrics.
var (
	mu       sync.Mutex
	buckets  = []float64{0.1, 0.25, 0.5, 1, 2.5, math.Inf(1)}
	requests = map[string]int{}   // "path status" -> count
	observed = map[string][]int{} // path -> cumulative count per bucket
	sums     = map[string]float64{}
)

func observe(path string, status int, seconds float64) {
	mu.Lock()
	defer mu.Unlock()
	requests[fmt.Sprintf("%s %d", path, status)]++
	if observed[path] == nil {
		observed[path] = make([]int, len(buckets))
	}
	for i, le := range buckets {
		if seconds <= le {
			observed[path][i]++
		}
	}
	sums[path] += seconds
}

func metrics(w http.ResponseWriter, r *http.Request) {
	mu.Lock()
	defer mu.Unlock()
	w.Header().Set("Content-Type", "text/plain; version=0.0.4")
	fmt.Fprintln(w, "# TYPE http_requests_total counter")
	for key, n := range requests {
		path, status, _ := strings.Cut(key, " ")
		fmt.Fprintf(w, "http_requests_total{path=%q,status=%q} %d\n", path, status, n)
	}
	fmt.Fprintln(w, "# TYPE http_request_duration_seconds histogram")
	for path, counts := range observed {
		for i, le := range buckets {
			fmt.Fprintf(w, "http_request_duration_seconds_bucket{path=%q,le=%q} %d\n", path, fmt.Sprint(le), counts[i])
		}
		fmt.Fprintf(w, "http_request_duration_seconds_sum{path=%q} %g\n", path, sums[path])
		fmt.Fprintf(w, "http_request_duration_seconds_count{path=%q} %d\n", path, counts[len(buckets)-1])
	}
}
