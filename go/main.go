package main

import (
	"context"
	"log"
	"net/http"
	"time"

	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"

	"ordelo/handlers"
)

const (
	c  = "mongodb+srv://mordersechssechssechs:ahoomisterazozin123@sandbox.tujsg.mongodb.net/?retryWrites=true&w=majority&appName=sandbox"
	p  = ":8080"
	db = "test"
)

var (
	Client            *mongo.Client
	usersCollection   *mongo.Collection
	recipesCollection *mongo.Collection
	listsCollection   *mongo.Collection
	storesCollection  *mongo.Collection
	cartsCollection   *mongo.Collection
	ordersCollection  *mongo.Collection
	vendorsCollection *mongo.Collection
	itemsCollection   *mongo.Collection
)

func main() {
	initMongoDB()
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

func initMongoDB() {
	log.Printf("Connect to the DB")
	options := options.Client().ApplyURI(c).SetMaxConnecting(10)

	client, err := mongo.Connect(options)
	if err != nil {
		log.Fatalf("Unable to connect to the mongoDB %s\n", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err = client.Ping(ctx, nil); err != nil {
		log.Fatalf("Unable to ping MongoDB after connection to check for liveness %s", err)
	}

	d := client.Database(db)
	usersCollection = d.Collection("users")
	recipesCollection = d.Collection("recipes")
	listsCollection = d.Collection("lists")
	storesCollection = d.Collection("stores")
	cartsCollection = d.Collection("carts")
	ordersCollection = d.Collection("orders")
	vendorsCollection = d.Collection("vendors")
	itemsCollection = d.Collection("items")

	log.Printf("Connected to MongoDB")

}

func closeMongoDB() {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := Client.Disconnect(ctx); err != nil {
		log.Fatalf("Error in closing MongoDB connection %s\n", err)
	}
}
