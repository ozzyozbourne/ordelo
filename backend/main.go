package main

import (
	"log"
	"net/http"
	"os"

	"github.com/honeycombio/otel-config-go/otelconfig"
	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
	"ordelo/db"
	"ordelo/handlers"
)

var (
	p = os.Getenv("PORT")
)

func main() {
	otelShutdown, err := otelconfig.ConfigureOpenTelemetry()
	if err != nil {
		log.Fatalf("error setting up OTel SDK - %e", err)
	}
	defer otelShutdown()

	log.Printf("Honeycomb opentelemetry observability is up!\n")
	db.InitMongoDB()

	mux := http.NewServeMux()

	mux.HandleFunc("POST /user", handlers.CreateUser)
	mux.HandleFunc("GET /user/{id}", handlers.GetUser)
	// mux.HandleFunc("PUT /user/{id}", handlers.UpdateUser)
	// mux.HandleFunc("DELETE /user/{id}", handlers.DeleteUser)

	wrappedMux := otelhttp.NewHandler(mux, "mux")

	log.Printf("Starting server on port%s\n", p)
	if err := http.ListenAndServe(p, wrappedMux); err != nil {
		log.Fatalf("Unable to start the server on port%s due to %s", p, err)
	}

}
