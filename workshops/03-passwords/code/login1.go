package main

import (
	"fmt"
	"os"
	"strings"
)

func main() {
	data, _ := os.ReadFile("users.txt")
	users := map[string]string{}
	for _, line := range strings.Split(strings.TrimSpace(string(data)), "\n") {
		name, stored, _ := strings.Cut(line, ":")
		users[name] = stored
	}
	name, password := os.Args[1], os.Args[2]
	if users[name] == password {
		fmt.Printf("welcome, %s\n", name)
	} else {
		fmt.Println("no")
	}
}
