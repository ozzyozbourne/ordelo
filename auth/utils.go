package main

import (
	"fmt"
	"math/rand"
)

func generateRandowEmails() string {
	b := make([]byte, 5)
	for i := range b {
		b[i] = "abcdefghijklmnopqrstuvwxyz0123456789"[rand.Intn(36)]
	}
	return fmt.Sprintf("%s@test.com", string(b))
}

func isValidRole(role string) bool {
	return role == "admin" || role == "user" || role == "vendor"
}
