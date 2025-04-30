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
)

var (
	Repos              *Repositories
	user_repo_source   = slog.Any("source", "UserRepository")
	vendor_repo_source = slog.Any("source", "VendorRepository")
)

type Repositories struct {
	User   UserRepository
	Vendor VendorRepository
}

type UserRepository interface {
	Create(context.Context, *User) (ID, error)
	CreateRecipes(context.Context, ID, []*Recipe) ([]*ID, error)
	CreateCarts(context.Context, ID, []*Cart) ([]*ID, error)
	CreateOrders(context.Context, ID, []*UserOrder) ([]*ID, error)

	FindByID(context.Context, ID) (*User, error)
	FindByEmail(context.Context, string) (*User, error)
	FindRecipes(context.Context, ID) ([]*Recipe, error)
	FindCarts(context.Context, ID) ([]*Cart, error)
	FindOrders(context.Context, ID) ([]*UserOrder, error)

	Update(context.Context, *User) error
	UpdateRecipes(context.Context, ID, []*Recipe) error
	UpdateCarts(context.Context, ID, []*Cart) error
	UpdateOrders(context.Context, ID, []*UserOrder) error

	Delete(context.Context, ID) error
	DeleteRecipes(context.Context, ID, []*ID) error
	DeleteCarts(context.Context, ID, []*ID) error
}

type VendorRepository interface {
	Create(context.Context, *Vendor) (ID, error)
	CreateStores(context.Context, ID, []*Store) ([]*ID, error)
	CreateOrders(context.Context, ID, []*VendorOrder) ([]*ID, error)

	FindByID(context.Context, ID) (*Vendor, error)
	FindByEmail(context.Context, string) (*Vendor, error)
	FindStores(context.Context, ID) ([]*Store, error)
	FindOrders(context.Context, ID) ([]*VendorOrder, error)

	Update(context.Context, *Vendor) error
	UpdateStores(context.Context, ID, []*Store) error
	UpdateOrders(context.Context, ID, []*VendorOrder) error

	Delete(context.Context, ID) error
	DeleteStores(context.Context, ID, []*ID) error
}

func initMongoRepositories(mongoClient *mongo.Client) (*Repositories, error) {
	dbName := os.Getenv("DB_NAME")
	if dbName == "" {
		return nil, errors.New("env varible DB_NAME is empty")
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
	if res, err = convertToID(ctx, result); err != nil {
		return
	}
	if result.Acknowledged == false {
		Logger.ErrorContext(ctx, "Write concern returned false", slog.String("ID", res.String()), user_repo_source)
		err = fmt.Errorf("Write concern returned false")
		return
	}
	Logger.InfoContext(ctx, "User Created Successfully", slog.String("ID", res.String()),
		slog.String("Result", fmt.Sprintf("%+v", result)), user_repo_source)
	return
}

func (m MongoUserRepository) CreateRecipes(ctx context.Context, id ID, recipes []*Recipe) ([]*ID, error) {
	ctx, span := Tracer.Start(ctx, "CreateUserRecipes")
	defer span.End()

	ids := AssignIDs(recipes)

	Logger.InfoContext(ctx, "Adding Recipe/s to user", slog.Any("Recipe/s", recipes), user_repo_source)
	filter, update := getFilterUpdate[[]*Recipe](id, "saved_recipes", recipes)

	result, err := m.col.UpdateOne(ctx, filter, update)
	if err != nil {
		Logger.ErrorContext(ctx, "Error updating user recipes", slog.Any("error", err), user_repo_source)
		return nil, err
	}

	if result.Acknowledged == false {
		Logger.ErrorContext(ctx, "Write concern returned false", slog.String("ID", id.String()), user_repo_source)
		return nil, fmt.Errorf("Write concern returned false")
	}
	if result.MatchedCount == 0 {
		Logger.ErrorContext(ctx, "User not found", slog.String("_id", id.String()), user_repo_source)
		return nil, fmt.Errorf("user with ID %s not found", id.String())
	}

	Logger.InfoContext(ctx, "Recipes added successfully", slog.String("userId", id.String()),
		slog.String("Result", fmt.Sprintf("%+v", *result)), user_repo_source)
	return ids, nil
}

func (m MongoUserRepository) CreateCarts(ctx context.Context, id ID, carts []*Cart) ([]*ID, error) {
	ctx, span := Tracer.Start(ctx, "CreateUserCarts")
	defer span.End()

	ids := AssignIDs(carts)

	Logger.InfoContext(ctx, "Adding Cart/s to user", slog.Any("ID", id.String()), user_repo_source)
	filter, update := getFilterUpdate[[]*Cart](id, "carts", carts)

	result, err := m.col.UpdateOne(ctx, filter, update)
	if err != nil {
		Logger.ErrorContext(ctx, "Error updating user carts", slog.Any("error", err), user_repo_source)
		return nil, err
	}

	if result.Acknowledged == false {
		Logger.ErrorContext(ctx, "Write concern returned false", slog.String("ID", id.String()), user_repo_source)
		return nil, fmt.Errorf("Write concern returned false")
	}
	if result.MatchedCount == 0 {
		Logger.ErrorContext(ctx, "User not found", slog.String("_id", id.String()), user_repo_source)
		return nil, fmt.Errorf("user with ID %s not found", id.String())
	}

	Logger.InfoContext(ctx, "Carts added successfully", slog.String("userId", id.String()),
		slog.String("Result", fmt.Sprintf("%+v", *result)), user_repo_source)
	return ids, nil
}

func (m MongoUserRepository) CreateOrders(ctx context.Context, id ID, orders []*UserOrder) ([]*ID, error) {
	ctx, span := Tracer.Start(ctx, "CreateUserOrders")
	defer span.End()

	ids := AssignIDs(orders)

	Logger.InfoContext(ctx, "Adding Order/s to user", slog.String("ID", id.String()), user_repo_source)
	filter, update := getFilterUpdate[[]*UserOrder](id, "orders", orders)

	result, err := m.col.UpdateOne(ctx, filter, update)
	if err != nil {
		Logger.ErrorContext(ctx, "Error updating user orders", slog.Any("error", err), user_repo_source)
		return nil, err
	}
	if result.Acknowledged == false {
		Logger.ErrorContext(ctx, "Write concern returned false", slog.String("ID", id.String()), user_repo_source)
		return nil, fmt.Errorf("Write concern returned false")
	}
	if result.MatchedCount == 0 {
		Logger.ErrorContext(ctx, "User not found", slog.String("_id", id.String()), user_repo_source)
		return nil, fmt.Errorf("user with ID %s not found", id.String())
	}

	Logger.InfoContext(ctx, "Orders added successfully", slog.String("userId", id.String()),
		slog.String("Result", fmt.Sprintf("%+v", *result)), user_repo_source)

	return ids, nil
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
		slog.String("User", fmt.Sprintf("%+v", *user)), user_repo_source)
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

	Logger.InfoContext(ctx, "User found successfully", slog.String("email", email),
		slog.String("User", fmt.Sprintf("%+v", *user)), user_repo_source)
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

	Logger.InfoContext(ctx, "Recipes found successfully",
		slog.String("Recipes", fmt.Sprintf("%+v", result.SavedRecipes)), user_repo_source)
	return result.SavedRecipes, nil
}

func (m MongoUserRepository) FindCarts(ctx context.Context, id ID) ([]*Cart, error) {
	ctx, span := Tracer.Start(ctx, "FindUserCarts")
	defer span.End()

	Logger.InfoContext(ctx, "Finding carts for user", slog.String("UserId", id.String()), user_repo_source)

	filter := bson.D{{Key: "_id", Value: id.value}}
	projection := bson.D{{Key: "carts", Value: 1}, {Key: "_id", Value: 0}}

	var result struct {
		Carts []*Cart `bson:"carts"`
	}

	if err := m.col.FindOne(ctx, filter, options.FindOne().SetProjection(projection)).Decode(&result); err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			Logger.ErrorContext(ctx, "User not found", slog.String("ID", id.String()), user_repo_source)
			return nil, fmt.Errorf("User with ID %s not found", id.String())
		}
		Logger.ErrorContext(ctx, "Error finding carts", slog.Any("error", err), user_repo_source)
		return nil, err
	}

	Logger.InfoContext(ctx, "Carts found successfully", slog.String("Carts",
		fmt.Sprintf("%+v", result.Carts)), user_repo_source)
	return result.Carts, nil

}

func (m MongoUserRepository) FindOrders(ctx context.Context, id ID) ([]*UserOrder, error) {
	ctx, span := Tracer.Start(ctx, "FindUserOrders")
	defer span.End()

	Logger.InfoContext(ctx, "Finding orders for user", slog.String("UserId", id.String()), user_repo_source)

	filter := bson.D{{Key: "_id", Value: id.value}}
	projection := bson.D{{Key: "orders", Value: 1}, {Key: "_id", Value: 0}}

	var result struct {
		Orders []*UserOrder `bson:"orders"`
	}

	if err := m.col.FindOne(ctx, filter, options.FindOne().SetProjection(projection)).Decode(&result); err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			Logger.ErrorContext(ctx, "User not found", slog.String("ID", id.String()), user_repo_source)
			return nil, fmt.Errorf("User with ID %s not found", id.String())
		}
		Logger.ErrorContext(ctx, "Error finding orders", slog.Any("error", err), user_repo_source)
		return nil, err
	}

	Logger.InfoContext(ctx, "Orders found successfully", slog.Any("Orders",
		fmt.Sprintf("%+v", result.Orders)), user_repo_source)
	return result.Orders, nil
}

func (m MongoUserRepository) Update(ctx context.Context, user *User) error {
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
		models = append(models, mongo.NewUpdateOneModel().SetFilter(filter).SetUpdate(update))
	}

	if user.Name != "" {
		updateModel(bson.D{{Key: "$set", Value: bson.M{"name": user.Name}}})
	}
	if user.Email != "" {
		updateModel(bson.D{{Key: "$set", Value: bson.M{"email": user.Email}}})
	}
	if user.Address != "" {
		updateModel(bson.D{{Key: "$set", Value: bson.M{"address": user.Address}}})
	}
	if user.PasswordHash != "" {
		updateModel(bson.D{{Key: "$set", Value: bson.M{"password_hash": user.PasswordHash}}})
	}

	result, err := m.col.BulkWrite(ctx, models)
	if err != nil {
		Logger.ErrorContext(ctx, "Error in bulk update", slog.Any("error", err), user_repo_source)
		return err
	}

	if result.Acknowledged == false {
		Logger.ErrorContext(ctx, "Write concern returned false", slog.String("ID", user.ID.Hex()), user_repo_source)
		return fmt.Errorf("Write concern returned false")
	}
	if result.ModifiedCount == 0 {
		Logger.ErrorContext(ctx, "No document was modified", slog.Any("User update", user), slog.Any("Result", result), user_repo_source)
		return fmt.Errorf("no updates were mode for user %+v", user)
	}

	Logger.InfoContext(
		ctx, "User updated successfully",
		slog.Int64("matchedCount", result.MatchedCount),
		slog.Int64("modifiedCount", result.ModifiedCount),
		slog.Int64("insertedCount", result.InsertedCount),
		slog.String("Result", fmt.Sprintf("%+v", *result)),
		user_repo_source,
	)
	return nil
}

func (m MongoUserRepository) UpdateRecipes(ctx context.Context, id ID, recipes []*Recipe) error {
	ctx, span := Tracer.Start(ctx, "UpdateUserRecipes")
	defer span.End()

	Logger.InfoContext(ctx, "Updating recipes for user",
		slog.String("userID", id.String()), slog.Any("recipes", recipes), user_repo_source)

	if err := checkIfDocumentExists(ctx, m.col, id.value); err != nil {
		return err
	}

	var models []mongo.WriteModel
	for _, recipe := range recipes {
		if recipe.ID == bson.NilObjectID {
			continue
		}
		updateRecipeFilter := bson.D{
			{Key: "_id", Value: id.value},
			{Key: "saved_recipes._id", Value: recipe.ID},
		}

		fieldsToUpdate := bson.M{}
		if recipe.Description != "" {
			fieldsToUpdate["saved_recipes.$.description"] = recipe.Description
		}
		if recipe.PreparationTime != 0 {
			fieldsToUpdate["saved_recipes.$.preparation_time"] = recipe.PreparationTime
		}
		if recipe.ServingSize != 0 {
			fieldsToUpdate["saved_recipes.$.serving_size"] = recipe.ServingSize
		}

		if len(recipe.Items) > 0 {
			var itemsToInsert []interface{}
			for _, item := range recipe.Items {
				if item.IngredientID == bson.NilObjectID {
					item.IngredientID = bson.NewObjectID()
					itemsToInsert = append(itemsToInsert, item)
				} else {

					updateItemFilters := []interface{}{
						bson.M{"r._id": recipe.ID},
						bson.M{"i.ingredient_id": item.IngredientID},
					}
					itemFieldsToUpdate := bson.M{}

					if item.Name != "" {
						itemFieldsToUpdate["saved_recipes.$[r].items.$[i].name"] = item.Name
					}
					if item.Quantity != 0 {
						itemFieldsToUpdate["saved_recipes.$[r].items.$[i].quantity"] = item.Quantity
					}
					if item.Unit != "" {
						itemFieldsToUpdate["saved_recipes.$[r].items.$[i].unit"] = item.Unit
					}
					if item.Price != 0 {
						itemFieldsToUpdate["saved_recipes.$[r].items.$[i].price"] = item.Price
					}

					if len(itemFieldsToUpdate) > 0 {
						itemUpdate := bson.D{{Key: "$set", Value: itemFieldsToUpdate}}
						models = append(models, mongo.NewUpdateOneModel().SetFilter(bson.D{{Key: "_id", Value: id.value}}).
							SetUpdate(itemUpdate).SetArrayFilters(updateItemFilters))
					}
				}
			}
			if len(itemsToInsert) > 0 {
				pushUpdate := bson.D{
					{Key: "$push", Value: bson.M{
						"saved_recipes.$.items": bson.M{"$each": itemsToInsert},
					}},
				}
				models = append(models, mongo.NewUpdateOneModel().
					SetFilter(updateRecipeFilter).
					SetUpdate(pushUpdate))
			}
		}

		if len(fieldsToUpdate) > 0 {
			update := bson.D{{Key: "$set", Value: fieldsToUpdate}}
			models = append(models, mongo.NewUpdateOneModel().SetFilter(updateRecipeFilter).SetUpdate(update))
		}
	}

	result, err := m.col.BulkWrite(ctx, models)
	if err != nil {
		Logger.ErrorContext(ctx, "Error in bulk update", slog.Any("error", err), user_repo_source)
		return err
	}
	if result.Acknowledged == false {
		Logger.ErrorContext(ctx, "Write concern returned false", slog.String("ID", id.String()), user_repo_source)
		return fmt.Errorf("Write concern returned false")
	}
	Logger.InfoContext(ctx, "Recipes updated successfully",
		slog.Int64("matchedCount", result.MatchedCount),
		slog.Int64("modifiedCount", result.ModifiedCount),
		slog.Int64("insertedCount", result.InsertedCount),
		slog.String("Result", fmt.Sprintf("%+v", *result)),
		user_repo_source)

	return nil

}

func (m MongoUserRepository) UpdateCarts(ctx context.Context, id ID, carts []*Cart) error {
	ctx, span := Tracer.Start(ctx, "UpdateUserCarts")
	defer span.End()

	Logger.InfoContext(ctx, "Updating carts for user",
		slog.String("userID", id.String()), slog.Any("carts", carts), user_repo_source)

	if err := checkIfDocumentExists(ctx, m.col, id.value); err != nil {
		return err
	}

	models := make([]mongo.WriteModel, 0, len(carts)*2)
	for _, cart := range carts {
		updateFilter := bson.D{
			{Key: "_id", Value: id.value},
			{Key: "carts._id", Value: cart.ID},
		}
		update := bson.D{
			{Key: "$set", Value: bson.M{"carts.$": cart}},
		}
		updateModel := mongo.NewUpdateOneModel().
			SetFilter(updateFilter).
			SetUpdate(update)
		models = append(models, updateModel)

		addFilter := bson.D{
			{Key: "_id", Value: id.value},
			{Key: "carts._id", Value: bson.M{"$ne": cart.ID}},
		}
		addUpdate := bson.D{
			{Key: "$push", Value: bson.M{"carts": cart}},
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
	if result.Acknowledged == false {
		Logger.ErrorContext(ctx, "Write concern returned false", slog.String("ID", id.String()), user_repo_source)
		return fmt.Errorf("Write concern returned false")
	}
	Logger.InfoContext(ctx, "Carts updated successfully",
		slog.Int64("matchedCount", result.MatchedCount),
		slog.Int64("modifiedCount", result.ModifiedCount),
		slog.Int64("insertedCount", result.InsertedCount),
		user_repo_source)

	return nil
}

func (m MongoUserRepository) UpdateOrders(ctx context.Context, id ID, orders []*UserOrder) error {
	ctx, span := Tracer.Start(ctx, "UpdateUserOrders")
	defer span.End()

	Logger.InfoContext(ctx, "Updating orders for user",
		slog.String("userID", id.String()), slog.Any("orders", orders), user_repo_source)

	if err := checkIfDocumentExists(ctx, m.col, id.value); err != nil {
		return err
	}

	models := make([]mongo.WriteModel, 0, len(orders)*2)
	for _, order := range orders {
		updateFilter := bson.D{
			{Key: "_id", Value: id.value},
			{Key: "orders._id", Value: order.ID},
		}
		update := bson.D{
			{Key: "$set", Value: bson.M{"orders.$": order}},
		}
		updateModel := mongo.NewUpdateOneModel().
			SetFilter(updateFilter).
			SetUpdate(update)
		models = append(models, updateModel)

		addFilter := bson.D{
			{Key: "_id", Value: id.value},
			{Key: "orders._id", Value: bson.M{"$ne": order.ID}},
		}
		addUpdate := bson.D{
			{Key: "$push", Value: bson.M{"orders": order}},
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
	if result.Acknowledged == false {
		Logger.ErrorContext(ctx, "Write concern returned false", slog.String("ID", id.String()), user_repo_source)
		return fmt.Errorf("Write concern returned false")
	}
	Logger.InfoContext(ctx, "Orders updated successfully",
		slog.Int64("matchedCount", result.MatchedCount),
		slog.Int64("modifiedCount", result.ModifiedCount),
		slog.Int64("insertedCount", result.InsertedCount),
		user_repo_source)

	return nil
}

func (m MongoUserRepository) Delete(ctx context.Context, id ID) error {
	ctx, span := Tracer.Start(ctx, "DeleteUser")
	defer span.End()

	Logger.InfoContext(ctx, "Deleting a user", slog.String("ID", id.String()), user_repo_source)
	result, err := m.col.DeleteOne(ctx, bson.D{{Key: "_id", Value: id.value}})
	if err != nil {
		Logger.ErrorContext(ctx, "Error deleting user", slog.Any("error", err), user_repo_source)
		return err
	}
	if result.Acknowledged == false {
		Logger.ErrorContext(ctx, "Write concern returned false", slog.String("ID", id.String()), user_repo_source)
		return fmt.Errorf("Write concern returned false")
	}
	if result.DeletedCount == 0 {
		Logger.ErrorContext(ctx, "User not found", slog.String("ID", id.String()), user_repo_source)
		return fmt.Errorf("user with ID %s not found", id.String())
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
	if result.Acknowledged == false {
		Logger.ErrorContext(ctx, "Write concern returned false", slog.String("ID", id.String()), user_repo_source)
		return fmt.Errorf("Write concern returned false")
	}
	if result.MatchedCount == 0 {
		Logger.ErrorContext(ctx, "User not found", slog.String("ID", id.String()), user_repo_source)
		return fmt.Errorf("user with ID %s not found", id.String())
	}
	if result.ModifiedCount == 0 {
		Logger.InfoContext(ctx, "No recipes were deleted, they may not exist",
			slog.String("userID", id.String()), user_repo_source)
	}

	Logger.InfoContext(ctx, "Recipes deleted successfully", slog.String("userID", id.String()),
		slog.Int("count", int(result.ModifiedCount)), user_repo_source)

	return nil
}

func (m MongoUserRepository) DeleteCarts(ctx context.Context, id ID, ids []*ID) error {
	ctx, span := Tracer.Start(ctx, "DeleteUserCarts")
	defer span.End()

	Logger.InfoContext(ctx, "Deleting carts for user",
		slog.String("userID", id.String()), slog.Any("cartIDs", ids), user_repo_source)

	cartsObjIDs := make([]bson.ObjectID, len(ids))
	for i, cid := range ids {
		cartsObjIDs[i] = cid.value
	}

	filter := bson.D{{Key: "_id", Value: id.value}}
	update := bson.D{
		{Key: "$pull", Value: bson.M{
			"carts": bson.M{
				"_id": bson.M{"$in": cartsObjIDs},
			},
		}},
	}

	result, err := m.col.UpdateOne(ctx, filter, update)
	if err != nil {
		Logger.ErrorContext(ctx, "Error deleting carts", slog.Any("error", err), user_repo_source)
		return err
	}
	if result.Acknowledged == false {
		Logger.ErrorContext(ctx, "Write concern returned false", slog.String("ID", id.String()), user_repo_source)
		return fmt.Errorf("Write concern returned false")
	}
	if result.MatchedCount == 0 {
		Logger.ErrorContext(ctx, "User not found", slog.String("ID", id.String()), user_repo_source)
		return fmt.Errorf("user with ID %s not found", id.String())
	}
	if result.ModifiedCount == 0 {
		Logger.InfoContext(ctx, "No carts were deleted, they may not exist",
			slog.String("userID", id.String()), user_repo_source)
	}

	Logger.InfoContext(ctx, "Carts deleted successfully", slog.String("userID", id.String()),
		slog.Int("count", int(result.ModifiedCount)), user_repo_source)

	return nil
}

func newMongoVendorRepository(client *mongo.Client, dbName string) VendorRepository {
	return &MongoVendorRepository{col: client.Database(dbName).Collection("vendor")}
}

func (m MongoVendorRepository) Create(ctx context.Context, vendor *Vendor) (res ID, err error) {
	ctx, span := Tracer.Start(ctx, "CreateVendor")
	defer span.End()

	Logger.InfoContext(ctx, "Inserting in Vendors collection", slog.Any("vendor", vendor), vendor_repo_source)

	result, err := m.col.InsertOne(ctx, vendor)
	if err != nil {
		Logger.ErrorContext(ctx, "Error in inserting a vendor in DB", slog.Any("error", err), vendor_repo_source)
		return
	}
	if res, err = convertToID(ctx, result); err != nil {
		return
	}
	if result.Acknowledged == false {
		Logger.ErrorContext(ctx, "Write concern returned false", slog.String("ID", res.String()), vendor_repo_source)
		err = fmt.Errorf("Write concern returned false")
		return
	}
	Logger.InfoContext(ctx, "User Created Successfully", slog.String("ID", res.String()),
		slog.String("Result", fmt.Sprintf("%+v", result)), user_repo_source)
	return
}

func (m MongoVendorRepository) CreateStores(ctx context.Context, id ID, stores []*Store) ([]*ID, error) {
	ctx, span := Tracer.Start(ctx, "CreateVendorStores")
	defer span.End()

	ids := AssignIDs(stores)

	Logger.InfoContext(ctx, "Adding Store/s to vendor", slog.Any("Store/s", stores), vendor_repo_source)
	filter, update := getFilterUpdate[[]*Store](id, "stores", stores)

	result, err := m.col.UpdateOne(ctx, filter, update)
	if err != nil {
		Logger.ErrorContext(ctx, "Error updating vendor stores", slog.Any("error", err), vendor_repo_source)
		return nil, err
	}
	if result.Acknowledged == false {
		Logger.ErrorContext(ctx, "Write concern returned false", slog.String("ID", id.String()), vendor_repo_source)
		return nil, fmt.Errorf("Write concern returned false")
	}
	if result.MatchedCount == 0 {
		Logger.ErrorContext(ctx, "Vendor not found", slog.String("_id", id.String()), vendor_repo_source)
		return nil, fmt.Errorf("vendor with ID %s not found", id.String())
	}

	Logger.InfoContext(ctx, "Stores added successfully", slog.String("vendorId", id.String()),
		slog.String("Result", fmt.Sprintf("%+v", *result)), vendor_repo_source)

	return ids, nil
}

func (m MongoVendorRepository) CreateOrders(ctx context.Context, id ID, orders []*VendorOrder) ([]*ID, error) {
	ctx, span := Tracer.Start(ctx, "CreateVendorOrders")
	defer span.End()

	ids := AssignIDs(orders)

	Logger.InfoContext(ctx, "Adding Order/s to vendor", slog.String("ID", id.String()), vendor_repo_source)
	filter, update := getFilterUpdate[[]*VendorOrder](id, "orders", orders)

	result, err := m.col.UpdateOne(ctx, filter, update)
	if err != nil {
		Logger.ErrorContext(ctx, "Error updating vendor orders", slog.Any("error", err), vendor_repo_source)
		return nil, err
	}
	if result.Acknowledged == false {
		Logger.ErrorContext(ctx, "Write concern returned false", slog.String("ID", id.String()), vendor_repo_source)
		return nil, fmt.Errorf("Write concern returned false")
	}

	if result.MatchedCount == 0 {
		Logger.ErrorContext(ctx, "Vendor not found", slog.String("_id", id.String()), vendor_repo_source)
		return nil, fmt.Errorf("vendor with ID %s not found", id.String())
	}

	Logger.InfoContext(ctx, "Orders added successfully", slog.String("vendorId", id.String()),
		slog.String("Result", fmt.Sprintf("%+v", *result)), vendor_repo_source)

	return ids, nil
}

func (m MongoVendorRepository) FindByID(ctx context.Context, id ID) (vendor *Vendor, err error) {
	ctx, span := Tracer.Start(ctx, "FindVendorID")
	defer span.End()

	Logger.InfoContext(ctx, "Finding Vendor by ID", slog.String("Id", id.String()), vendor_repo_source)

	if err = m.col.FindOne(ctx, bson.D{{Key: "_id", Value: id.value}}).Decode(&vendor); err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			Logger.ErrorContext(ctx, "Vendor not found", slog.String("ID", id.String()), vendor_repo_source)
			return nil, fmt.Errorf("vendor with ID %s not found", id.String())
		}
		Logger.ErrorContext(ctx, "Error finding vendor by ID", slog.Any("error", err), vendor_repo_source)
		return
	}

	Logger.InfoContext(ctx, "Vendor found successfully", slog.String("ID", id.String()),
		slog.String("Vendor", fmt.Sprintf("%+v", *vendor)), vendor_repo_source)
	return
}

func (m MongoVendorRepository) FindByEmail(ctx context.Context, email string) (vendor *Vendor, err error) {
	ctx, span := Tracer.Start(ctx, "FindVendorByEmail")
	defer span.End()

	Logger.InfoContext(ctx, "Finding Vendor by Email", slog.String("Email", email), vendor_repo_source)
	filter := bson.D{{Key: "email", Value: email}}

	if err = m.col.FindOne(ctx, filter).Decode(&vendor); err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			Logger.ErrorContext(ctx, "Vendor not found", slog.String("email", email), vendor_repo_source)
			return nil, fmt.Errorf("vendor with email %s not found", email)
		}
		Logger.ErrorContext(ctx, "Error finding vendor by email", slog.Any("error", err), vendor_repo_source)
		return
	}

	Logger.InfoContext(ctx, "Vendor found successfully", slog.String("email", email),
		slog.String("Vendor", fmt.Sprintf("%+v", *vendor)), vendor_repo_source)
	return
}

func (m MongoVendorRepository) FindStores(ctx context.Context, id ID) ([]*Store, error) {
	ctx, span := Tracer.Start(ctx, "FindVendorStores")
	defer span.End()

	Logger.InfoContext(ctx, "Finding stores for vendor", slog.String("VendorId", id.String()), vendor_repo_source)

	filter := bson.D{{Key: "_id", Value: id.value}}
	projection := bson.D{{Key: "stores", Value: 1}, {Key: "_id", Value: 0}}

	var result struct {
		Stores []*Store `bson:"stores"`
	}

	if err := m.col.FindOne(ctx, filter, options.FindOne().SetProjection(projection)).Decode(&result); err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			Logger.ErrorContext(ctx, "Vendor not found", slog.String("ID", id.String()), vendor_repo_source)
			return nil, fmt.Errorf("Vendor with ID %s not found", id.String())
		}
		Logger.ErrorContext(ctx, "Error finding stores", slog.Any("error", err), vendor_repo_source)
		return nil, err
	}

	Logger.InfoContext(ctx, "Stores found successfully", slog.String("Stores",
		fmt.Sprintf("%+v", result.Stores)), vendor_repo_source)
	return result.Stores, nil
}

func (m MongoVendorRepository) FindOrders(ctx context.Context, id ID) ([]*VendorOrder, error) {
	ctx, span := Tracer.Start(ctx, "FindVendorOrders")
	defer span.End()

	Logger.InfoContext(ctx, "Finding orders for vendor", slog.String("VendorId", id.String()), vendor_repo_source)

	filter := bson.D{{Key: "_id", Value: id.value}}
	projection := bson.D{{Key: "orders", Value: 1}, {Key: "_id", Value: 0}}

	var result struct {
		Orders []*VendorOrder `bson:"orders"`
	}

	if err := m.col.FindOne(ctx, filter, options.FindOne().SetProjection(projection)).Decode(&result); err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			Logger.ErrorContext(ctx, "Vendor not found", slog.String("ID", id.String()), vendor_repo_source)
			return nil, fmt.Errorf("Vendor with ID %s not found", id.String())
		}
		Logger.ErrorContext(ctx, "Error finding orders", slog.Any("error", err), vendor_repo_source)
		return nil, err
	}

	Logger.InfoContext(ctx, "Orders found successfully", slog.Any("Orders",
		fmt.Sprintf("%+v", result.Orders)), vendor_repo_source)
	return result.Orders, nil
}

func (m MongoVendorRepository) Update(ctx context.Context, vendor *Vendor) error {
	ctx, span := Tracer.Start(ctx, "UpdateVendor")
	defer span.End()
	Logger.InfoContext(ctx, "Updating vendor", slog.Any("vendor", vendor), vendor_repo_source)

	var objId bson.ObjectID
	if objId = vendor.ID; objId == bson.NilObjectID {
		Logger.ErrorContext(ctx, "The vendor struct has no ObjectID", slog.Any("error", "No ObjectID"), vendor_repo_source)
		return fmt.Errorf("Vendor struct has no ObjectID")
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

	if vendor.Name != "" {
		updateModel(bson.D{{Key: "$set", Value: bson.M{"name": vendor.Name}}})
	}
	if vendor.Email != "" {
		updateModel(bson.D{{Key: "$set", Value: bson.M{"email": vendor.Email}}})
	}
	if vendor.Address != "" {
		updateModel(bson.D{{Key: "$set", Value: bson.M{"address": vendor.Address}}})
	}
	if vendor.PasswordHash != "" {
		updateModel(bson.D{{Key: "$set", Value: bson.M{"password_hash": vendor.PasswordHash}}})
	}

	result, err := m.col.BulkWrite(ctx, models)
	if err != nil {
		Logger.ErrorContext(ctx, "Error in bulk update", slog.Any("error", err), vendor_repo_source)
		return err
	}
	if result.Acknowledged == false {
		Logger.ErrorContext(ctx, "Write concern returned false", slog.String("ID", objId.Hex()), vendor_repo_source)
		return fmt.Errorf("Write concern returned false")
	}
	if result.ModifiedCount == 0 {
		Logger.ErrorContext(ctx, "No document was modified", slog.Any("Vendor update", vendor), slog.Any("Result", result), vendor_repo_source)
		return fmt.Errorf("no updates were mode for vendor %+v", vendor)
	}

	Logger.InfoContext(
		ctx, "Vendor updated successfully",
		slog.Int64("matchedCount", result.MatchedCount),
		slog.Int64("modifiedCount", result.ModifiedCount),
		slog.Int64("insertedCount", result.InsertedCount),
		slog.String("Result", fmt.Sprintf("%+v", *result)),
		vendor_repo_source,
	)
	return nil
}

func (m MongoVendorRepository) UpdateStores(ctx context.Context, id ID, stores []*Store) error {
	ctx, span := Tracer.Start(ctx, "UpdateVendorStores")
	defer span.End()

	Logger.InfoContext(ctx, "Updating stores for vendor",
		slog.String("vendorID", id.String()), slog.Any("stores", stores), vendor_repo_source)

	if err := checkIfDocumentExists(ctx, m.col, id.value); err != nil {
		return err
	}

	models := make([]mongo.WriteModel, 0, len(stores)*2)
	for _, store := range stores {
		updateFilter := bson.D{
			{Key: "_id", Value: id.value},
			{Key: "stores._id", Value: store.ID},
		}
		update := bson.D{
			{Key: "$set", Value: bson.M{"stores.$": store}},
		}
		updateModel := mongo.NewUpdateOneModel().
			SetFilter(updateFilter).
			SetUpdate(update)
		models = append(models, updateModel)

		addFilter := bson.D{
			{Key: "_id", Value: id.value},
			{Key: "stores._id", Value: bson.M{"$ne": store.ID}},
		}
		addUpdate := bson.D{
			{Key: "$push", Value: bson.M{"stores": store}},
		}
		addModel := mongo.NewUpdateOneModel().
			SetFilter(addFilter).
			SetUpdate(addUpdate)
		models = append(models, addModel)
	}

	result, err := m.col.BulkWrite(ctx, models)
	if err != nil {
		Logger.ErrorContext(ctx, "Error in bulk update", slog.Any("error", err), vendor_repo_source)
		return err
	}

	if result.Acknowledged == false {
		Logger.ErrorContext(ctx, "Write concern returned false", slog.String("ID", id.String()), vendor_repo_source)
		return fmt.Errorf("Write concern returned false")
	}
	Logger.InfoContext(ctx, "Stores updated successfully",
		slog.Int64("matchedCount", result.MatchedCount),
		slog.Int64("modifiedCount", result.ModifiedCount),
		slog.Int64("insertedCount", result.InsertedCount),
		slog.String("Result", fmt.Sprintf("%+v", *result)),
		vendor_repo_source)

	return nil
}

func (m MongoVendorRepository) UpdateOrders(ctx context.Context, id ID, orders []*VendorOrder) error {
	ctx, span := Tracer.Start(ctx, "UpdateVendorOrders")
	defer span.End()

	Logger.InfoContext(ctx, "Updating orders for vendor",
		slog.String("vendorID", id.String()), slog.Any("orders", orders), vendor_repo_source)

	if err := checkIfDocumentExists(ctx, m.col, id.value); err != nil {
		return err
	}

	models := make([]mongo.WriteModel, 0, len(orders)*2)
	for _, order := range orders {
		updateFilter := bson.D{
			{Key: "_id", Value: id.value},
			{Key: "orders._id", Value: order.ID},
		}
		update := bson.D{
			{Key: "$set", Value: bson.M{"orders.$": order}},
		}
		updateModel := mongo.NewUpdateOneModel().
			SetFilter(updateFilter).
			SetUpdate(update)
		models = append(models, updateModel)

		addFilter := bson.D{
			{Key: "_id", Value: id.value},
			{Key: "orders._id", Value: bson.M{"$ne": order.ID}},
		}
		addUpdate := bson.D{
			{Key: "$push", Value: bson.M{"orders": order}},
		}
		addModel := mongo.NewUpdateOneModel().
			SetFilter(addFilter).
			SetUpdate(addUpdate)
		models = append(models, addModel)
	}

	result, err := m.col.BulkWrite(ctx, models)
	if err != nil {
		Logger.ErrorContext(ctx, "Error in bulk update", slog.Any("error", err), vendor_repo_source)
		return err
	}
	if result.Acknowledged == false {
		Logger.ErrorContext(ctx, "Write concern returned false", slog.String("ID", id.String()), vendor_repo_source)
		return fmt.Errorf("Write concern returned false")
	}
	Logger.InfoContext(ctx, "Orders updated successfully",
		slog.Int64("matchedCount", result.MatchedCount),
		slog.Int64("modifiedCount", result.ModifiedCount),
		slog.Int64("insertedCount", result.InsertedCount),
		slog.Bool("Acknowlegded", result.Acknowledged),
		vendor_repo_source)

	return nil
}

func (m MongoVendorRepository) Delete(ctx context.Context, id ID) error {
	ctx, span := Tracer.Start(ctx, "DeleteVendor")
	defer span.End()

	Logger.InfoContext(ctx, "Deleting a vendor", slog.String("ID", id.String()), vendor_repo_source)
	result, err := m.col.DeleteOne(ctx, bson.D{{Key: "_id", Value: id.value}})
	if err != nil {
		Logger.ErrorContext(ctx, "Error deleting vendor", slog.Any("error", err), vendor_repo_source)
		return err
	}
	if result.Acknowledged == false {
		Logger.ErrorContext(ctx, "Write concern returned false", slog.String("ID", id.String()), vendor_repo_source)
		return fmt.Errorf("Write concern returned false")
	}
	if result.DeletedCount == 0 {
		Logger.ErrorContext(ctx, "Vendor not found", slog.String("ID", id.String()), vendor_repo_source)
		return fmt.Errorf("vendor with ID %s not found", id.String())
	}

	Logger.InfoContext(ctx, "Vendor deleted successfully", slog.String("ID", id.String()), vendor_repo_source)
	return nil
}

func (m MongoVendorRepository) DeleteStores(ctx context.Context, id ID, ids []*ID) error {
	ctx, span := Tracer.Start(ctx, "DeleteVendorStores")
	defer span.End()

	Logger.InfoContext(ctx, "Deleting stores for vendor",
		slog.String("vendorID", id.String()), slog.Any("storeIDs", ids), vendor_repo_source)

	storesObjIDs := make([]bson.ObjectID, len(ids))
	for i, sid := range ids {
		storesObjIDs[i] = sid.value
	}

	filter := bson.D{{Key: "_id", Value: id.value}}
	update := bson.D{
		{Key: "$pull", Value: bson.M{
			"stores": bson.M{
				"_id": bson.M{"$in": storesObjIDs},
			},
		}},
	}

	result, err := m.col.UpdateOne(ctx, filter, update)
	if err != nil {
		Logger.ErrorContext(ctx, "Error deleting stores", slog.Any("error", err), vendor_repo_source)
		return err
	}
	if result.Acknowledged == false {
		Logger.ErrorContext(ctx, "Write concern returned false", slog.String("ID", id.String()), vendor_repo_source)
		return fmt.Errorf("Write concern returned false")
	}
	if result.MatchedCount == 0 {
		Logger.ErrorContext(ctx, "Vendor not found", slog.String("ID", id.String()), vendor_repo_source)
		return fmt.Errorf("vendor with ID %s not found", id.String())
	}
	if result.ModifiedCount == 0 {
		Logger.InfoContext(ctx, "No stores were deleted, they may not exist",
			slog.String("vendorID", id.String()), vendor_repo_source)
	}

	Logger.InfoContext(ctx, "Stores deleted successfully", slog.String("vendorID", id.String()),
		slog.Int("count", int(result.ModifiedCount)), vendor_repo_source)

	return nil
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
		return fmt.Errorf("document with ID %s not found", objID.Hex())
	}
	return nil
}

func convertToID(ctx context.Context, result *mongo.InsertOneResult) (ID, error) {
	res, ok := result.InsertedID.(bson.ObjectID)
	if !ok {
		Logger.ErrorContext(ctx, "Error in cast InsertedID interface to bson.ObjectID",
			slog.String("error", "Casting Error"), vendor_repo_source)
		return ID{value: bson.NilObjectID}, fmt.Errorf("error unable to cast result.InsertedID to bson.ObjectID")
	}
	return ID{value: res}, nil

}
