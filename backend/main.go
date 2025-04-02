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
	mux.HandleFunc("POST /user", handlers.CreateUser)
	mux.HandleFunc("GET /user/{id}", handlers.GetUser)
	mux.HandleFunc("PUT /user/{id}", handlers.UpdateUser)
	mux.HandleFunc("DELETE /user/{id}", handlers.DeleteUser)
	mux.HandleFunc("GET /user/{id}/recipes", handlers.GetUserRecipes)
	mux.HandleFunc("POST /user/{id}/recipes/{recipeId}", handlers.SaveRecipe)
	mux.HandleFunc("DELETE /user/{id}/recipes/{recipeId}", handlers.UnsaveRecipe)
	mux.HandleFunc("GET /user/{id}/lists", handlers.GetUserLists)
	mux.HandleFunc("GET /user/{id}/carts", handlers.GetUserCarts)
	mux.HandleFunc("GET /user/{id}/orders", handlers.GetUserOrders)

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

	// Store routes
	mux.HandleFunc("POST /store", handlers.CreateStore)
	mux.HandleFunc("GET /store/{id}", handlers.GetStore)
	mux.HandleFunc("PUT /store/{id}", handlers.UpdateStore)
	mux.HandleFunc("DELETE /store/{id}", handlers.DeleteStore)
	mux.HandleFunc("GET /stores/nearby", handlers.GetNearbyStores)
	mux.HandleFunc("GET /store/{id}/orders", handlers.GetStoreOrders)

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
