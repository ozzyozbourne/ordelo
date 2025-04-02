package db

import (
	"context"
	"log"
	"os"
	"time"

	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

var (
	C  = os.Getenv("DB_URI")
	DB = "test"

	Client            *mongo.Client
	UsersCollection   *mongo.Collection
	RecipesCollection *mongo.Collection
	ListsCollection   *mongo.Collection
	StoresCollection  *mongo.Collection
	CartsCollection   *mongo.Collection
	OrdersCollection  *mongo.Collection
	VendorsCollection *mongo.Collection
	ItemsCollection   *mongo.Collection
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
	ListsCollection = d.Collection("lists")
	StoresCollection = d.Collection("stores")
	CartsCollection = d.Collection("carts")
	OrdersCollection = d.Collection("orders")
	VendorsCollection = d.Collection("vendors")
	ItemsCollection = d.Collection("items")

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
