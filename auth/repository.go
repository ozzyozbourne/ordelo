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
	order_repo_source  = slog.Any("source", "OrderRepository")
	cart_repo_source   = slog.Any("source", "CartRepository")
	vendor_repo_source = slog.Any("source", "VendorRepository")
)

type Repositories struct {
	User   UserRepository
	Vendor VendorRepository
}

type UserRepository interface {
	Create(context.Context, *User) (ID, error)
	CreateRecipes(context.Context, ID, []*Recipe) error
	CreateCarts(context.Context, ID, []*Cart) error
	CreateOrders(context.Context, ID, []*UserOrder) error

	FindByID(context.Context, ID) (*User, error)
	FindByEmail(context.Context, string) (*User, error)
	FindRecipes(context.Context, ID) ([]*Recipe, error)
	FindCarts(context.Context, ID) ([]*Cart, error)
	FindOrders(context.Context, ID) ([]*UserOrder, error)

	UpdateUser(context.Context, *User) error
	UpdateRecipes(context.Context, ID, []*Recipe) error
	UpdateCarts(context.Context, ID, []*Cart) error
	UpdateOrders(context.Context, ID, []*UserOrder) error

	DeleteUser(context.Context, ID) error
	DeleteRecipes(context.Context, ID, []*ID) error
	DeleteCarts(context.Context, ID, []*ID) error
}

type VendorRepository interface{}

func initMongoRepositories(mongoClient *mongo.Client) (*Repositories, error) {
	dbName := os.Getenv("DB_NAME")
	if dbName == "" {
		return nil, errors.New("Env varible DB_NAME is empty!")
	}
	mongoRepos := &Repositories{
		User:   newMongoUserRepository(mongoClient, dbName),
		Vendor: newMongoVendorRepository(mongoClient, dbName),
	}
	return mongoRepos, nil
}

type MongoUserRepository struct{ col *mongo.Collection }
type MongoVendorRepository struct{ col *mongo.Collection }

func newMongoUserRepository(client *mongo.Client, dbName string) UserRepository {
	return &MongoUserRepository{col: client.Database(dbName).Collection("user")}
}

func (m MongoUserRepository) Create(ctx context.Context, user *User) (res ID, err error) {
	ctx, span := Tracer.Start(ctx, "CreateUser")
	defer span.End()

	Logger.InfoContext(ctx, "Inserting in Users collection", slog.Any("user", user), user_repo_source)

	result, err := m.col.InsertOne(ctx, user)
	if err != nil {
		Logger.ErrorContext(ctx, "Error in inserting a user in DB", slog.Any("error", err), user_repo_source)
		return
	}

	id, ok := result.InsertedID.(bson.ObjectID)
	if !ok {
		Logger.ErrorContext(ctx, "Error in cast InsertedID interface to bson.ObjectID",
			slog.String("error", "Casting Error"), user_repo_source)
	}
	res.value = id
	Logger.InfoContext(ctx, "User Created Successfully", slog.String("ID", res.String()),
		slog.Any("Result", fmt.Sprintf("%+v", result)), user_repo_source)
	return
}

func (m MongoUserRepository) CreateRecipes(ctx context.Context, id ID, recipes []*Recipe) error {
	ctx, span := Tracer.Start(ctx, "CreateUserRecipes")
	defer span.End()

	Logger.InfoContext(ctx, "Adding Recipe/s to user", slog.Any("Recipe/s", recipes), user_repo_source)
	filter := bson.D{{Key: "_id", Value: id.value}}
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
		Logger.ErrorContext(ctx, "User not found", slog.String("_id", id.String()), user_repo_source)
		return fmt.Errorf("user with ID %s not found", id)
	}

	Logger.InfoContext(ctx, "Recipes added successfully", slog.String("userId", id.String()),
		slog.Any("Result", fmt.Sprintf("%+v", *result)), user_repo_source)
	return nil
}

func (m MongoUserRepository) CreateCarts(ctx context.Context, id ID, carts []*Cart) error {
	ctx, span := Tracer.Start(ctx, "CreateUserCarts")
	defer span.End()

	Logger.InfoContext(ctx, "Adding Cart/s to user", slog.Any("ID", id.String()), user_repo_source)
	filter := bson.D{{Key: "_id", Value: id.value}}
	update := bson.D{
		{Key: "$push", Value: bson.M{
			"carts": bson.M{
				"$each": carts,
			},
		}},
	}

	result, err := m.col.UpdateOne(ctx, filter, update)
	if err != nil {
		Logger.ErrorContext(ctx, "Error updating user carts", slog.Any("error", err), user_repo_source)
		return err
	}

	if result.MatchedCount == 0 {
		Logger.ErrorContext(ctx, "User not found", slog.String("_id", id.String()), user_repo_source)
		return fmt.Errorf("user with ID %s not found", id)
	}

	Logger.InfoContext(ctx, "Carts added successfully", slog.String("userId", id.String()),
		slog.Any("Result", fmt.Sprintf("%+v", *result)), user_repo_source)
	return nil
}

func (m MongoUserRepository) CreateOrders(ctx context.Context, id ID, orders []*UserOrder) error {
	ctx, span := Tracer.Start(ctx, "CreateUserOrders")
	defer span.End()

	Logger.InfoContext(ctx, "Adding Order/s to user", slog.String("ID", id.String()), user_repo_source)
	filter := bson.D{{Key: "_id", Value: id.value}}
	update := bson.D{
		{Key: "$push", Value: bson.M{
			"orders": bson.M{
				"$each": orders,
			},
		}},
	}

	result, err := m.col.UpdateOne(ctx, filter, update)
	if err != nil {
		Logger.ErrorContext(ctx, "Error updating user orders", slog.Any("error", err), user_repo_source)
		return err
	}

	if result.MatchedCount == 0 {
		Logger.ErrorContext(ctx, "User not found", slog.String("_id", id.String()), user_repo_source)
		return fmt.Errorf("user with ID %s not found", id)
	}

	Logger.InfoContext(ctx, "Orders added successfully", slog.String("userId", id.String()),
		slog.Any("Result", fmt.Sprintf("%+v", *result)), user_repo_source)

	return nil
}

func (m MongoUserRepository) FindByID(ctx context.Context, id ID) (user *User, err error) {
	ctx, span := Tracer.Start(ctx, "FindUserID")
	defer span.End()

	Logger.InfoContext(ctx, "Finding User by ID", slog.String("Id", id.String()), user_repo_source)

	if err = m.col.FindOne(ctx, bson.D{{Key: "_id", Value: id.value}}).Decode(&user); err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			Logger.ErrorContext(ctx, "User not found", slog.String("ID", id.String()), user_repo_source)
			return nil, fmt.Errorf("user with ID %s not found", id.String())
		}
		Logger.ErrorContext(ctx, "Error finding user by ID", slog.Any("error", err), user_repo_source)
		return
	}

	Logger.InfoContext(ctx, "User found successfully", slog.String("ID", id.String()),
		slog.Any("User", user), user_repo_source)
	return
}

func (m MongoUserRepository) FindByEmail(ctx context.Context, email string) (user *User, err error) {
	ctx, span := Tracer.Start(ctx, "FindUserByEmail")
	defer span.End()

	Logger.InfoContext(ctx, "Finding User by Email", slog.String("Email", email), user_repo_source)
	filter := bson.D{{Key: "email", Value: email}}

	if err = m.col.FindOne(ctx, filter).Decode(&user); err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			Logger.ErrorContext(ctx, "User not found", slog.String("email", email), user_repo_source)
			return nil, fmt.Errorf("user with email %s not found", email)
		}
		Logger.ErrorContext(ctx, "Error finding user by email", slog.Any("error", err), user_repo_source)
		return
	}

	Logger.InfoContext(ctx, "User found successfully", slog.String("email", email), slog.Any("User", user), user_repo_source)
	return
}

func (m MongoUserRepository) FindRecipes(ctx context.Context, id ID) ([]*Recipe, error) {
	ctx, span := Tracer.Start(ctx, "FindRecipes")
	defer span.End()

	Logger.InfoContext(ctx, "Finding recipies for user", slog.String("UserId", id.value.Hex()), user_repo_source)

	filter := bson.D{{Key: "_id", Value: id.value}}
	projection := bson.D{{Key: "saved_recipes", Value: 1}, {Key: "_id", Value: 0}}

	var result struct {
		SavedRecipes []*Recipe `bson:"saved_recipes"`
	}

	if err := m.col.FindOne(ctx, filter, options.FindOne().SetProjection(projection)).Decode(&result); err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			Logger.ErrorContext(ctx, "User not found", slog.String("ID", id.String()), user_repo_source)
			return nil, fmt.Errorf("User with ID %s not found", id.value.Hex())
		}
		Logger.ErrorContext(ctx, "Error finding recipes", slog.Any("error", err), user_repo_source)

	}

	Logger.InfoContext(ctx, "Recipes found successfully", slog.Any("Recipes", result.SavedRecipes), user_repo_source)
	return result.SavedRecipes, nil
}

func (m MongoUserRepository) FindCarts(ctx context.Context, id ID) ([]*Cart, error) {
	return nil, nil
}

func (m MongoUserRepository) FindOrders(ctx context.Context, id ID) ([]*UserOrder, error) {
	return nil, nil
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
	if err := checkIfDocumentExists(ctx, m.col, objId); err != nil {
		return err
	}

	filter := bson.D{{Key: "_id", Value: objId}}
	var models []mongo.WriteModel
	updateModel := func(update bson.D) {
		updateModel := mongo.NewUpdateOneModel().SetFilter(filter).SetUpdate(update)
		models = append(models, updateModel)
	}

	if user.UserName != "" {
		updateModel(bson.D{{Key: "$set", Value: bson.M{"user_name": user.UserName}}})
	}
	if user.Email != "" {
		updateModel(bson.D{{Key: "$set", Value: bson.M{"email": user.Email}}})
	}
	if user.UserAddress != "" {
		updateModel(bson.D{{Key: "$set", Value: bson.M{"user_address": user.UserAddress}}})
	}
	if user.PasswordHash != "" {
		updateModel(bson.D{{Key: "$set", Value: bson.M{"password_hash": user.PasswordHash}}})
	}

	result, err := m.col.BulkWrite(ctx, models)
	if err != nil {
		Logger.ErrorContext(ctx, "Error in bulk update", slog.Any("error", err), user_repo_source)
		return err
	}

	if result.ModifiedCount == 0 {
		Logger.ErrorContext(ctx, "No document was modified", slog.Any("User update", user), slog.Any("Result", result), user_repo_source)
		return fmt.Errorf("No updates were mode for user %+v", user)
	}

	Logger.InfoContext(
		ctx, "User updated successfully",
		slog.Int64("matchedCount", result.MatchedCount),
		slog.Int64("modifiedCount", result.ModifiedCount),
		slog.Int64("insertedCount", result.InsertedCount),
		slog.Any("Result", *result),
		user_repo_source,
	)
	return nil
}

func (m MongoUserRepository) UpdateRecipes(ctx context.Context, id ID, recipes []*Recipe) error {
	ctx, span := Tracer.Start(ctx, "UpdateRecipes")
	defer span.End()

	Logger.InfoContext(ctx, "Updating recipes for user",
		slog.String("userID", id.String()), slog.Any("recipes", recipes), user_repo_source)

	if err := checkIfDocumentExists(ctx, m.col, id.value); err != nil {
		return err
	}

	models := make([]mongo.WriteModel, 0, len(recipes)*2)
	for _, recipe := range recipes {
		updateFilter := bson.D{
			{Key: "_id", Value: id.value},
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
			{Key: "_id", Value: id.value},
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

func (m MongoUserRepository) UpdateCarts(ctx context.Context, id ID, carts []*Cart) error {
	return nil
}

func (m MongoUserRepository) UpdateOrders(ctx context.Context, id ID, orders []*UserOrder) error {
	return nil
}

func (m MongoUserRepository) DeleteUser(ctx context.Context, id ID) error {
	ctx, span := Tracer.Start(ctx, "DeleteUser")
	defer span.End()

	Logger.InfoContext(ctx, "Deleting a user", slog.String("ID", id.String()), user_repo_source)
	result, err := m.col.DeleteOne(ctx, bson.D{{Key: "_id", Value: id.value}})
	if err != nil {
		Logger.ErrorContext(ctx, "Error deleting user", slog.Any("error", err), user_repo_source)
		return err
	}

	if result.DeletedCount == 0 {
		Logger.ErrorContext(ctx, "User not found", slog.String("ID", id.String()), user_repo_source)
		return fmt.Errorf("user with ID %s not found", id)
	}

	Logger.InfoContext(ctx, "User deleted successfully", slog.String("ID", id.String()), user_repo_source)
	return nil
}

func (m MongoUserRepository) DeleteRecipes(ctx context.Context, id ID, ids []*ID) error {
	ctx, span := Tracer.Start(ctx, "DeleteRecipes")
	defer span.End()

	Logger.InfoContext(ctx, "Deleting recipes for user",
		slog.String("userID", id.String()), slog.Any("recipeIDs", ids), user_repo_source)

	recipesObjIDs := make([]bson.ObjectID, len(ids))
	for i, rid := range ids {
		recipesObjIDs[i] = rid.value
	}

	filter := bson.D{{Key: "_id", Value: id.value}}
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
		Logger.ErrorContext(ctx, "User not found", slog.String("ID", id.String()), user_repo_source)
		return fmt.Errorf("user with ID %s not found", id)
	}

	if result.ModifiedCount == 0 {
		Logger.InfoContext(ctx, "No recipes were deleted, they may not exist",
			slog.String("userID", id.String()), user_repo_source)
	} else {
		Logger.InfoContext(ctx, "Recipes deleted successfully", slog.String("userID", id.String()),
			slog.Int("count", int(result.ModifiedCount)), user_repo_source)
	}

	return nil
}

func (m MongoUserRepository) DeleteCarts(ctx context.Context, id ID, ids []*ID) error {
	return nil
}

func newMongoVendorRepository(client *mongo.Client, dbName string) VendorRepository {
	return &MongoVendorRepository{col: client.Database(dbName).Collection("vendor")}
}

func checkIfDocumentExists(ctx context.Context, col *mongo.Collection, objID bson.ObjectID) error {
	filter := bson.D{{Key: "_id", Value: objID}}
	count, err := col.CountDocuments(ctx, filter)
	if err != nil {
		Logger.ErrorContext(ctx, "Error in checking if document exists", slog.Any("error", err), user_repo_source)
		return err
	}
	if count == 0 {
		Logger.ErrorContext(ctx, "Document not found", slog.String("ID", objID.Hex()), user_repo_source)
		return fmt.Errorf("Document with ID %s not found", objID.Hex())
	}
	return nil
}
