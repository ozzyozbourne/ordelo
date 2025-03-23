package main

import (
	"log"
	"net/http"

	"ordelo/db"
	"ordelo/handlers"
)

const (
	p = ":8080"
)

func main() {
	db.InitMongoDB()
	mux := http.NewServeMux()

	mux.HandleFunc("POST /user", handlers.CreateUser)
	// mux.HandleFunc("GET /user/{id}", handlers.GetUser)
	// mux.HandleFunc("PUT /user/{id}", handlers.UpdateUser)
	// mux.HandleFunc("DELETE /user/{id}", handlers.DeleteUser)

	log.Printf("Starting server on port%s\n", p)
	if err := http.ListenAndServe(p, mux); err != nil {
		log.Fatalf("Unable to start the server on port%s due to %s", p, err)
	}

}
