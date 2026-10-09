package main

import (
	"crypto/tls"
	"fmt"
	"os/exec"
)

func main() {
	for _, tool := range []string{"openssl", "curl"} {
		if _, err := exec.LookPath(tool); err != nil {
			fmt.Println("not found on PATH:", tool)
			return
		}
	}
	fmt.Println("ready:", tls.VersionName(tls.VersionTLS13), "in Go, openssl and curl on PATH")
}
