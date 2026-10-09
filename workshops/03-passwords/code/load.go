package main

import (
	"fmt"
	"os"
	"strings"
)

func loadUsers(path string) (map[string]string, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	users := map[string]string{}
	for _, line := range strings.Split(strings.TrimSpace(string(data)), "\n") {
		name, secret, _ := strings.Cut(line, ":")
		users[name] = secret
	}
	return users, nil
}

func main() {
	users, err := loadUsers("users.txt")
	if err != nil {
		fmt.Println("error:", err)
		os.Exit(1)
	}
	fmt.Printf("ready: %d users loaded\n", len(users))
}
