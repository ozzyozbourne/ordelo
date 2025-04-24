package main

import (
	"log"
	"net/http"
	"os"

	"ordelo/handlers"

	"github.com/honeycombio/otel-config-go/otelconfig"
	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
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

	mux := http.NewServeMux()

	// User routes
	mux.Handle("POST /ordelo/user", http.HandlerFunc(handlers.CreateUser))
	mux.HandleFunc("GET /ordelo/user/{id}", handlers.GetUser)
	mux.HandleFunc("PUT /ordelo/user/{id}", handlers.UpdateUser)
	mux.HandleFunc("DELETE /ordelo/user/{id}", handlers.DeleteUser)

	// recipes
	wrappedMux := otelhttp.NewHandler(mux, "mux")

	log.Printf("Starting server on port%s\n", p)
	if err := http.ListenAndServe(p, wrappedMux); err != nil {
		log.Fatalf("Unable to start the server on port%s due to %s", p, err)
	}

}
