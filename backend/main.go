package main

import (
	"log"
	"net/http"
	"os"

	"ordelo/db"
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

	log.Printf("Honeycomb opentelemetry observability is up!\n")
	db.InitMongoDB()

	mux := http.NewServeMux()

	// User routes
	mux.Handle("POST /ordelo/user", http.HandlerFunc(handlers.CreateUser))
	mux.HandleFunc("GET /ordelo/user/{id}", handlers.GetUser)
	mux.HandleFunc("PUT /ordelo/user/{id}", handlers.UpdateUser)
	mux.HandleFunc("DELETE /ordelo/user/{id}", handlers.DeleteUser)

	// recipes
	mux.HandleFunc("GET /ordelo/user/{id}/recipes", handlers.GetUserRecipes)
	mux.HandleFunc("POST /ordero/user/{id}/recipes/{recipeId}", handlers.SaveRecipe)
	mux.HandleFunc("POST /ordero/user/{id}/recipes/{recipeId}", handlers.UpdateRecipe)
	mux.HandleFunc("DELETE /ordelo/user/{id}/recipes/{recipeId}", handlers.UnsaveRecipe)

	// Store routes
	mux.HandleFunc("GET /ordelo/vendor/{vendor_id}/store", handlers.GetStore)
	mux.HandleFunc("GET /ordelo/vendor/{vendor_id}/{store_id}", handlers.GetStores)
	mux.HandleFunc("POST /ordelo/vendor/{vendor_id}/store", handlers.CreateStore)
	mux.HandleFunc("PUT /ordelo/vendor/{vendor_id}/{store_id}", handlers.UpdateStore)
	mux.HandleFunc("DELETE /ordelo/vendor/{vendor_id}/{store_id}", handlers.DeleteStore)

	// Recipe routes
	mux.HandleFunc("POST /recipe", handlers.CreateRecipe)
	mux.HandleFunc("GET /recipe/{id}", handlers.GetRecipe)
	mux.HandleFunc("PUT /recipe/{id}", handlers.UpdateRecipe)
	mux.HandleFunc("DELETE /recipe/{id}", handlers.DeleteRecipe)
	mux.HandleFunc("GET /recipes", handlers.GetAllRecipes)

	// List routes
	mux.HandleFunc("POST /list", handlers.CreateList)
	mux.HandleFunc("GET /list/{id}", handlers.GetList)
	mux.HandleFunc("PUT /list/{id}", handlers.UpdateList)
	mux.HandleFunc("DELETE /list/{id}", handlers.DeleteList)

	// Cart routes
	mux.HandleFunc("POST /cart", handlers.CreateCart)
	mux.HandleFunc("GET /cart/{id}", handlers.GetCart)
	mux.HandleFunc("PUT /cart/{id}", handlers.UpdateCart)
	mux.HandleFunc("DELETE /cart/{id}", handlers.DeleteCart)

	// Order routes
	mux.HandleFunc("POST /order", handlers.CreateOrder)
	mux.HandleFunc("GET /order/{id}", handlers.GetOrder)
	mux.HandleFunc("PUT /order/{id}", handlers.UpdateOrder)
	mux.HandleFunc("DELETE /order/{id}", handlers.DeleteOrder)

	// Vendor routes
	mux.HandleFunc("POST /vendor", handlers.CreateVendor)
	mux.HandleFunc("GET /vendor/{id}", handlers.GetVendor)
	mux.HandleFunc("PUT /vendor/{id}", handlers.UpdateVendor)
	mux.HandleFunc("DELETE /vendor/{id}", handlers.DeleteVendor)
	mux.HandleFunc("GET /vendors", handlers.GetVendors)

	// Item routes
	mux.HandleFunc("POST /item", handlers.CreateItem)
	mux.HandleFunc("GET /item/{id}", handlers.GetItem)
	mux.HandleFunc("PUT /item/{id}", handlers.UpdateItem)
	mux.HandleFunc("DELETE /item/{id}", handlers.DeleteItem)
	mux.HandleFunc("GET /items", handlers.GetItems)

	wrappedMux := otelhttp.NewHandler(mux, "mux")

	log.Printf("Starting server on port%s\n", p)
	if err := http.ListenAndServe(p, wrappedMux); err != nil {
		log.Fatalf("Unable to start the server on port%s due to %s", p, err)
	}

}
