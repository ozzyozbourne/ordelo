package main

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"os"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
	"go.mongodb.org/mongo-driver/v2/mongo/writeconcern"
)

var (
	Repos              *Repositories
	defSessOpts        = options.Session().SetDefaultTransactionOptions(options.Transaction().SetWriteConcern(writeconcern.Majority()))
	user_repo_source   = slog.Any("source", "UserRepository")
	store_repo_source  = slog.Any("source", "StoreRepository")
	order_repo_source  = slog.Any("source", "OrderRepository")
	cart_repo_source   = slog.Any("source", "CartRepository")
	vendor_repo_source = slog.Any("source", "VendorRepository")
)

type Repositories struct {
	User   UserRepository
	Store  StoreRepository
	Order  OrderRepository
	Cart   CartRepository
	Vendor VendorRepository
}

type UserRepository interface {
	CreateUser(context.Context, *User) (string, error)
	CreateUserRecipes(context.Context, string, []*Recipe) error

	FindUser(context.Context, string) (*User, error)
	FindRecipes(context.Context, string) ([]Recipe, error)

	UpdateUser(context.Context, *User) error
	UpdateRecipes(context.Context, string, []*Recipe) error

	DeleteUser(context.Context, string) error
	DeleteRecipes(context.Context, string, []string) error
}

type StoreRepository interface{}
type OrderRepository interface{}
type CartRepository interface{}
type VendorRepository interface{}

func initRepositories() error {
	dbName := os.Getenv("DB_NAME")
	if dbName == "" {
		return errors.New("Env varible DB_NAME is empty!")
	}
	Repos = &Repositories{
		User:   newMongoUserRepository(MongoClient, dbName),
		Store:  newMongoStoreRepository(MongoClient, dbName),
		Order:  newMongoOrderRepository(MongoClient, dbName),
		Cart:   newMongoCartRepository(MongoClient, dbName),
		Vendor: newMongoVendorRepository(MongoClient, dbName),
	}
	return nil
}

type MongoUserRepository struct{ col *mongo.Collection }
type MongoStoreRepository struct{ col *mongo.Collection }
type MongoOrderRepository struct{ col *mongo.Collection }
type MongoCartRepository struct{ col *mongo.Collection }
type MongoVendorRepository struct{ col *mongo.Collection }

func newMongoUserRepository(client *mongo.Client, dbName string) UserRepository {
	return &MongoUserRepository{col: client.Database(dbName).Collection("user")}
}

func (m MongoUserRepository) CreateUser(ctx context.Context, user *User) (string, error) {
	Logger.InfoContext(ctx, fmt.Sprintf("Insertion -> %+v in Users collection", user), slog.String("Opt", "Insert"), user_repo_source)
	result, err := m.col.InsertOne(ctx, user)

	if err != nil {
		Logger.ErrorContext(ctx, "Error in inserting a user in DB", slog.Any("error", err), user_repo_source)
		return "", err
	}
	id, ok := result.InsertedID.(bson.ObjectID)

	if !ok {
		Logger.ErrorContext(ctx, "Error in cast InsertedID interface to bson.ObjectID", slog.String("error", "Casting Error"),
			user_repo_source)
	}

	Logger.InfoContext(ctx, "User Created Successfully", slog.String("ID", id.Hex()), user_repo_source)
	return id.Hex(), nil
}

func (m MongoUserRepository) CreateUserRecipes(ctx context.Context, id string, recipes []*Recipe) error {
	return nil
}

func (m MongoUserRepository) FindUser(ctx context.Context, id string) (*User, error) {

}

func (m MongoUserRepository) FindRecipes(ctx context.Context, id string) ([]Recipe, error) {

}

func (m MongoUserRepository) UpdateUser(ctx context.Context, user *User) error {

}

func (m MongoUserRepository) UpdateRecipes(ctx context.Context, id string, recipe []*Recipe) error {

}

func (m MongoUserRepository) DeleteUser(ctx context.Context, id string) error {

}

func (m MongoUserRepository) DeleteRecipes(ctx context.Context, id string, ids []string) error {

}

func newMongoStoreRepository(client *mongo.Client, dbName string) StoreRepository {
	return &MongoStoreRepository{collection: client.Database(dbName).Collection("store")}
}

func newMongoOrderRepository(client *mongo.Client, dbName string) OrderRepository {
	return &MongoOrderRepository{collection: client.Database(dbName).Collection("order")}
}

func newMongoCartRepository(client *mongo.Client, dbName string) StoreRepository {
	return &MongoCartRepository{collection: client.Database(dbName).Collection("cart")}
}

func newMongoVendorRepository(client *mongo.Client, dbName string) VendorRepository {
	return &MongoVendorRepository{collection: client.Database(dbName).Collection("vendor")}
}
