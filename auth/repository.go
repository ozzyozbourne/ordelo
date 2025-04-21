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
	FindRecipes(context.Context, string) ([]*Recipe, error)

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

func (m MongoUserRepository) CreateUser(c context.Context, user *User) (string, error) {
	ctx, span := Tracer.Start(c, "CreateUser")
	defer span.End()

	Logger.InfoContext(ctx, "Inserting in Users collection", slog.Any("user", user), user_repo_source)

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

func (m MongoUserRepository) CreateUserRecipes(c context.Context, id string, recipes []*Recipe) error {
	ctx, span := Tracer.Start(c, "CreateUserRecipes")
	defer span.End()

	Logger.InfoContext(ctx, "Adding Recipe/s to user", slog.Any("Recipe/s", recipes), user_repo_source)
	objId, err := bson.ObjectIDFromHex(id)
	if err != nil {
		Logger.ErrorContext(ctx, "Id not valid unable to convert to bson.ObjectID", slog.Any("error", err), user_repo_source)
		return err
	}

	filter := bson.D{{Key: "_id", Value: objId}}
	update := bson.D{
		{Key: "$push", Value: bson.M{
			"saved_recipes": bson.M{
				"$each": recipes,
			},
		}},
	}

	result, err := m.col.UpdateOne(ctx, filter, update)
	if err != nil {
		Logger.ErrorContext(ctx, "Error updating user recipes", slog.Any("error", err), user_repo_source)
	}

	if result.MatchedCount == 0 {
		Logger.ErrorContext(ctx, "User not found", slog.String("_id", id), user_repo_source)
		return fmt.Errorf("user with ID %s not found", id)
	}

	Logger.InfoContext(ctx, "Recipes added successfully", slog.String("userId", id), slog.Any("Result", result), user_repo_source)
	return nil
}

func (m MongoUserRepository) FindUser(c context.Context, id string) (*User, error) {
	ctx, span := Tracer.Start(c, "FindUser")
	defer span.End()

	Logger.InfoContext(ctx, "Finding User by ID", slog.String("Id", id), user_repo_source)
	objId, err := bson.ObjectIDFromHex(id)
	if err != nil {
		Logger.ErrorContext(ctx, "Id not valid, unable to convert to bson.ObjectID", slog.Any("error", err), user_repo_source)
		return nil, err
	}

	filter := bson.D{{Key: "_id", Value: objId}}
	var user User

	err = m.col.FindOne(ctx, filter).Decode(&user)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			Logger.ErrorContext(ctx, "User not found", slog.String("ID", id), user_repo_source)
			return nil, fmt.Errorf("user with ID %s not found", id)
		}
		Logger.ErrorContext(ctx, "Error finding user", slog.Any("error", err), user_repo_source)
		return nil, err
	}

	Logger.InfoContext(ctx, "User found successfully", slog.String("ID", id), slog.Any("User", user), user_repo_source)
	return &user, nil
}

func (m MongoUserRepository) FindRecipes(c context.Context, id string) ([]*Recipe, error) {
	return nil, nil
}

func (m MongoUserRepository) UpdateUser(c context.Context, user *User) error {
	return nil
}

func (m MongoUserRepository) UpdateRecipes(c context.Context, id string, recipe []*Recipe) error {
	return nil
}

func (m MongoUserRepository) DeleteUser(c context.Context, id string) error {
	return nil
}

func (m MongoUserRepository) DeleteRecipes(c context.Context, id string, ids []string) error {
	return nil
}

func newMongoStoreRepository(client *mongo.Client, dbName string) StoreRepository {
	return &MongoStoreRepository{col: client.Database(dbName).Collection("store")}
}

func newMongoOrderRepository(client *mongo.Client, dbName string) OrderRepository {
	return &MongoOrderRepository{col: client.Database(dbName).Collection("order")}
}

func newMongoCartRepository(client *mongo.Client, dbName string) StoreRepository {
	return &MongoCartRepository{col: client.Database(dbName).Collection("cart")}
}

func newMongoVendorRepository(client *mongo.Client, dbName string) VendorRepository {
	return &MongoVendorRepository{col: client.Database(dbName).Collection("vendor")}
}
