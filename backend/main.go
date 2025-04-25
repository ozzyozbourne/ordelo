package main

import (
	"net/http"
	"os"
)

var (
	p = os.Getenv("PORT")
)

func main() {

	mux := http.NewServeMux()

	// User routes
	mux.Handle("POST /ordelo/user", http.HandlerFunc(handlers.CreateUser))
	mux.HandleFunc("GET /ordelo/user/{id}", handlers.GetUser)
	mux.HandleFunc("PUT /ordelo/user/{id}", handlers.UpdateUser)
	mux.HandleFunc("DELETE /ordelo/user/{id}", handlers.DeleteUser)

	// recipes

}
