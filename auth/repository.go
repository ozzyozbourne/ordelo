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
	CreateUser(context.Context, *User) (bson.ObjectID, error)
	CreateUserRecipes(context.Context, string, []*Recipe) error

	FindUserByID(context.Context, string) (*User, error)
	FindUserByEmail(context.Context, string) (*User, error)
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

func initMongoRepositories(mongoClient *mongo.Client) (*Repositories, error) {
	dbName := os.Getenv("DB_NAME")
	if dbName == "" {
		return nil, errors.New("Env varible DB_NAME is empty!")
	}
	mongoRepos := &Repositories{
		User:   newMongoUserRepository(mongoClient, dbName),
		Store:  newMongoStoreRepository(mongoClient, dbName),
		Order:  newMongoOrderRepository(mongoClient, dbName),
		Cart:   newMongoCartRepository(mongoClient, dbName),
		Vendor: newMongoVendorRepository(mongoClient, dbName),
	}
	return mongoRepos, nil
}

type MongoUserRepository struct{ col *mongo.Collection }
type MongoStoreRepository struct{ col *mongo.Collection }
type MongoOrderRepository struct{ col *mongo.Collection }
type MongoCartRepository struct{ col *mongo.Collection }
type MongoVendorRepository struct{ col *mongo.Collection }

func newMongoUserRepository(client *mongo.Client, dbName string) UserRepository {
	return &MongoUserRepository{col: client.Database(dbName).Collection("user")}
}

func (m MongoUserRepository) CreateUser(c context.Context, user *User) (bson.ObjectID, error) {
	ctx, span := Tracer.Start(c, "CreateUser Mongo")
	defer span.End()

	Logger.InfoContext(ctx, "Inserting in Users collection", slog.Any("user", user), user_repo_source)

	result, err := m.col.InsertOne(ctx, user)
	if err != nil {
		Logger.ErrorContext(ctx, "Error in inserting a user in DB", slog.Any("error", err), user_repo_source)
		return bson.NilObjectID, err
	}

	id, ok := result.InsertedID.(bson.ObjectID)
	if !ok {
		Logger.ErrorContext(ctx, "Error in cast InsertedID interface to bson.ObjectID", slog.String("error", "Casting Error"),
			user_repo_source)
	}

	Logger.InfoContext(ctx, "User Created Successfully", slog.String("ID", id.Hex()), user_repo_source)
	return id, nil
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
		return err
	}

	if result.MatchedCount == 0 {
		Logger.ErrorContext(ctx, "User not found", slog.String("_id", id), user_repo_source)
		return fmt.Errorf("user with ID %s not found", id)
	}

	Logger.InfoContext(ctx, "Recipes added successfully", slog.String("userId", id), slog.Any("Result", result), user_repo_source)
	return nil
}

func (m MongoUserRepository) FindUserByID(ctx context.Context, id string) (*User, error) {
	ctx, span := Tracer.Start(ctx, "FindUserID")
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
		Logger.ErrorContext(ctx, "Error finding user by ID", slog.Any("error", err), user_repo_source)
		return nil, err
	}

	Logger.InfoContext(ctx, "User found successfully", slog.String("ID", id), slog.Any("User", user), user_repo_source)
	return &user, nil
}

func (m MongoUserRepository) FindUserByEmail(ctx context.Context, email string) (*User, error) {
	ctx, span := Tracer.Start(ctx, "FindUserByEmail")
	defer span.End()

	Logger.InfoContext(ctx, "Finding User by Email", slog.String("Email", email), user_repo_source)
	filter := bson.D{{Key: "email", Value: email}}
	var user User

	err := m.col.FindOne(ctx, filter).Decode(&user)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			Logger.ErrorContext(ctx, "User not found", slog.String("email", email), user_repo_source)
			return nil, fmt.Errorf("user with email %s not found", email)
		}
		Logger.ErrorContext(ctx, "Error finding user by email", slog.Any("error", err), user_repo_source)
		return nil, err
	}

	Logger.InfoContext(ctx, "User found successfully", slog.String("email", email), slog.Any("User", user), user_repo_source)
	return &user, nil
}

func (m MongoUserRepository) FindRecipes(ctx context.Context, id string) ([]*Recipe, error) {
	ctx, span := Tracer.Start(ctx, "FindRecipes")
	defer span.End()

	Logger.InfoContext(ctx, "Finding recipies for user", slog.String("UserId", id), user_repo_source)
	objId, err := bson.ObjectIDFromHex(id)
	if err != nil {
		Logger.ErrorContext(ctx, "Id not valid, unable to convert to bson.ObjectID", slog.Any("error", err), user_repo_source)
		return nil, err
	}
	filter := bson.D{{Key: "_id", Value: objId}}
	projection := bson.D{{Key: "saved_recipes", Value: 1}, {Key: "_id", Value: 0}}

	var result struct {
		SavedRecipes []*Recipe `bson:"saved_recipes"`
	}

	err = m.col.FindOne(ctx, filter, options.FindOne().SetProjection(projection)).Decode(&result)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			Logger.ErrorContext(ctx, "User not found", slog.String("ID", id), user_repo_source)
			return nil, fmt.Errorf("User with ID %s not found", id)
		}
		Logger.ErrorContext(ctx, "Error finding recipes", slog.Any("error", err), user_repo_source)

	}

	Logger.InfoContext(ctx, "Recipes found successfully", slog.Any("Recipes", result.SavedRecipes), user_repo_source)
	return result.SavedRecipes, nil
}

func (m MongoUserRepository) UpdateUser(ctx context.Context, user *User) error {
	ctx, span := Tracer.Start(ctx, "UpdateUser")
	defer span.End()
	Logger.InfoContext(ctx, "Updating user", slog.Any("user", user), user_repo_source)

	var objId bson.ObjectID
	if objId = user.ID; objId == bson.NilObjectID {
		Logger.ErrorContext(ctx, "The user struct has no ObjectID", slog.Any("error", "No ObjectID"), user_repo_source)
		return fmt.Errorf("User struct has no ObjectID")
	}

	user.ID = bson.NilObjectID
	filter := bson.D{{Key: "_id", Value: objId}}
	update := bson.D{{Key: "$set", Value: user}}

	result, err := m.col.UpdateOne(ctx, filter, update)
	if err != nil {
		Logger.ErrorContext(ctx, "Error updating user", slog.Any("error", err), user_repo_source)
		return err
	}

	if result.MatchedCount == 0 {
		Logger.ErrorContext(ctx, "User not found", slog.String("ID", user.ID.Hex()), user_repo_source)
		return fmt.Errorf("user with ID %s not found", user.ID.Hex())
	}

	Logger.InfoContext(ctx, "User updated successfully", slog.String("ID", user.ID.Hex()), user_repo_source)
	return nil
}

func (m MongoUserRepository) UpdateRecipes(ctx context.Context, id string, recipes []*Recipe) error {
	ctx, span := Tracer.Start(ctx, "UpdateRecipes")
	defer span.End()

	Logger.InfoContext(ctx, "Updating recipes for user", slog.String("userID", id), slog.Any("recipes", recipes), user_repo_source)
	objId, err := bson.ObjectIDFromHex(id)
	if err != nil {
		Logger.ErrorContext(ctx, "Id not valid, unable to convert to bson.ObjectID", slog.Any("error", err), user_repo_source)
		return err
	}

	filter := bson.D{{Key: "_id", Value: objId}}
	count, err := m.col.CountDocuments(ctx, filter)
	if err != nil {
		Logger.ErrorContext(ctx, "Error checking if user exists", slog.Any("error", err), user_repo_source)
		return err
	}
	if count == 0 {
		Logger.ErrorContext(ctx, "User not found", slog.String("ID", id), user_repo_source)
		return fmt.Errorf("user with ID %s not found", id)
	}

	models := make([]mongo.WriteModel, 0, len(recipes)*2)

	for _, recipe := range recipes {
		updateFilter := bson.D{
			{Key: "_id", Value: objId},
			{Key: "saved_recipes._id", Value: recipe.ID},
		}
		update := bson.D{
			{Key: "$set", Value: bson.M{"saved_recipes.$": recipe}},
		}
		updateModel := mongo.NewUpdateOneModel().
			SetFilter(updateFilter).
			SetUpdate(update)
		models = append(models, updateModel)

		addFilter := bson.D{
			{Key: "_id", Value: objId},
			{Key: "saved_recipes._id", Value: bson.M{"$ne": recipe.ID}},
		}
		addUpdate := bson.D{
			{Key: "$push", Value: bson.M{"saved_recipes": recipe}},
		}
		addModel := mongo.NewUpdateOneModel().
			SetFilter(addFilter).
			SetUpdate(addUpdate)
		models = append(models, addModel)
	}

	result, err := m.col.BulkWrite(ctx, models)
	if err != nil {
		Logger.ErrorContext(ctx, "Error in bulk update", slog.Any("error", err), user_repo_source)
		return err
	}

	Logger.InfoContext(ctx, "Recipes updated successfully",
		slog.Int64("matchedCount", result.MatchedCount),
		slog.Int64("modifiedCount", result.ModifiedCount),
		slog.Int64("insertedCount", result.InsertedCount),
		user_repo_source)

	return nil
}

func (m MongoUserRepository) DeleteUser(ctx context.Context, id string) error {
	ctx, span := Tracer.Start(ctx, "DeleteUser")
	defer span.End()

	Logger.InfoContext(ctx, "Deleting a user", slog.String("ID", id), user_repo_source)
	objId, err := bson.ObjectIDFromHex(id)
	if err != nil {
		Logger.ErrorContext(ctx, "Id not valid, unable to convert to bson.ObjectID", slog.Any("error", err), user_repo_source)
		return err
	}

	filter := bson.D{{Key: "_id", Value: objId}}
	result, err := m.col.DeleteOne(ctx, filter)
	if err != nil {
		Logger.ErrorContext(ctx, "Error deleting user", slog.Any("error", err), user_repo_source)
		return err
	}

	if result.DeletedCount == 0 {
		Logger.ErrorContext(ctx, "User not found", slog.String("ID", id), user_repo_source)
		return fmt.Errorf("user with ID %s not found", id)
	}

	Logger.InfoContext(ctx, "User deleted successfully", slog.String("ID", id), user_repo_source)
	return nil
}

func (m MongoUserRepository) DeleteRecipes(ctx context.Context, id string, ids []string) error {
	ctx, span := Tracer.Start(ctx, "DeleteRecipes")
	defer span.End()

	Logger.InfoContext(ctx, "Deleting recipes for user", slog.String("userID", id), slog.Any("recipeIDs", ids), user_repo_source)
	objId, err := bson.ObjectIDFromHex(id)
	if err != nil {
		Logger.ErrorContext(ctx, "Id not valid, unable to convert to bson.ObjectID", slog.Any("error", err), user_repo_source)
		return err
	}

	recipesObjIDs := make([]bson.ObjectID, len(ids))
	for i, rid := range ids {
		recipeObjId, err := bson.ObjectIDFromHex(rid)
		if err != nil {
			Logger.ErrorContext(ctx, "Recipe ID not valid", slog.String("recipeID", rid), slog.Any("error", err), user_repo_source)
			return err
		}
		recipesObjIDs[i] = recipeObjId
	}
	filter := bson.D{{Key: "_id", Value: objId}}
	update := bson.D{
		{Key: "$pull", Value: bson.M{
			"saved_recipes": bson.M{
				"_id": bson.M{"$in": recipesObjIDs},
			},
		}},
	}

	result, err := m.col.UpdateOne(ctx, filter, update)
	if err != nil {
		Logger.ErrorContext(ctx, "Error deleting recipes", slog.Any("error", err), user_repo_source)
		return err
	}

	if result.MatchedCount == 0 {
		Logger.ErrorContext(ctx, "User not found", slog.String("ID", id), user_repo_source)
		return fmt.Errorf("user with ID %s not found", id)
	}

	if result.ModifiedCount == 0 {
		Logger.InfoContext(ctx, "No recipes were deleted, they may not exist", slog.String("userID", id), user_repo_source)
	} else {
		Logger.InfoContext(ctx, "Recipes deleted successfully", slog.String("userID", id),
			slog.Int("count", int(result.ModifiedCount)), user_repo_source)
	}

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
