package main

import (
	"context"
	"errors"
	"os"

	"go.mongodb.org/mongo-driver/v2/mongo"
)

var Repos *Repositories

type Repositories struct {
	User   UserRepository
	Store  StoreRepository
	Order  OrderRepository
	Cart   CartRepository
	Vendor VendorRepository
}

type UserRepository interface {
	CreateUser(context.Context, *User) error
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

type MongoUserRepository struct{ collection *mongo.Collection }
type MongoStoreRepository struct{ collection *mongo.Collection }
type MongoOrderRepository struct{ collection *mongo.Collection }
type MongoCartRepository struct{ collection *mongo.Collection }
type MongoVendorRepository struct{ collection *mongo.Collection }

func newMongoUserRepository(client *mongo.Client, dbName string) UserRepository {
	return &MongoUserRepository{collection: client.Database(dbName).Collection("user")}
}

func (m MongoUserRepository) CreateUser(ctx context.Context, user *User) error { return nil }

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
