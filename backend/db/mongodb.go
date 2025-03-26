package db

import (
	"context"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

const (
	C  = "mongodb+srv://shah_441:syQZIFAV7OWd79AS@cs696a.4cvpd.mongodb.net/"
	DB = "test"
)

var (
	Client            *mongo.Client
	UsersCollection   *mongo.Collection
	RecipesCollection *mongo.Collection
	listsCollection   *mongo.Collection
	storesCollection  *mongo.Collection
	cartsCollection   *mongo.Collection
	ordersCollection  *mongo.Collection
	vendorsCollection *mongo.Collection
	itemsCollection   *mongo.Collection
)

func InitMongoDB() {
	log.Printf("Connecting to the DB")
	options := options.Client().ApplyURI(C).SetMaxConnecting(10)

	client, err := mongo.Connect(options)
	if err != nil {
		log.Fatalf("Unable to connect to the mongoDB %s\n", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err = client.Ping(ctx, nil); err != nil {
		log.Fatalf("Unable to ping MongoDB after connection to check for liveness %s", err)
	}

	d := client.Database(DB)
	UsersCollection = d.Collection("users")
	RecipesCollection = d.Collection("recipes")
	listsCollection = d.Collection("lists")
	storesCollection = d.Collection("stores")
	cartsCollection = d.Collection("carts")
	ordersCollection = d.Collection("orders")
	vendorsCollection = d.Collection("vendors")
	itemsCollection = d.Collection("items")

	log.Printf("Connected to MongoDB")
}

func CloseMongoDB() {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	log.Printf("Closing connection to mongoDB")
	if err := Client.Disconnect(ctx); err != nil {
		log.Fatalf("Error in closing MongoDB connection %s\n", err)
	}
	log.Printf("Closed")
}
