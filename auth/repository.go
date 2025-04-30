package main

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"os"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
)

var (
	Repos              *Repositories
	user_repo_source   = slog.Any("source", "UserRepository")
	vendor_repo_source = slog.Any("source", "VendorRepository")
)

type Repositories struct {
	User   UserRepository
	Vendor VendorRepository
	Admin  VendorRepository
}

type UserRepository interface {
	CreateUser(context.Context, *User) (ID, error)
	CreateRecipes(context.Context, ID, []*Recipe) ([]*ID, error)
	CreateCarts(context.Context, ID, []*Cart) ([]*ID, error)
	CreateUserOrders(context.Context, ID, []*UserOrder) ([]*ID, error)

	FindUserByID(context.Context, ID) (*User, error)
	FindUserByEmail(context.Context, string) (*User, error)
	FindRecipes(context.Context, ID) ([]*Recipe, error)
	FindCarts(context.Context, ID) ([]*Cart, error)
	FindUserOrders(context.Context, ID) ([]*UserOrder, error)

	UpdateUser(context.Context, *User) error
	UpdateRecipes(context.Context, ID, []*Recipe) error
	UpdateCarts(context.Context, ID, []*Cart) error
	UpdateUserOrders(context.Context, ID, []*UserOrder) error

	DeleteUser(context.Context, ID) error
	DeleteRecipes(context.Context, ID, []*ID) error
	DeleteCarts(context.Context, ID, []*ID) error
}

type VendorRepository interface {
	CreateVendor(context.Context, *Vendor) (ID, error)
	CreateStores(context.Context, ID, []*Store) ([]*ID, error)
	CreateVendorOrders(context.Context, ID, []*VendorOrder) ([]*ID, error)

	FindVendorByID(context.Context, ID) (*Vendor, error)
	FindVendorByEmail(context.Context, string) (*Vendor, error)
	FindStores(context.Context, ID) ([]*Store, error)
	FindVendorOrders(context.Context, ID) ([]*VendorOrder, error)

	UpdateVendor(context.Context, *Vendor) error
	UpdateStores(context.Context, ID, []*Store) error
	UpdateVendorOrders(context.Context, ID, []*VendorOrder) error

	DeleteVendor(context.Context, ID) error
	DeleteStores(context.Context, ID, []*ID) error
}

type AdminRepository interface {
	UserRepository
	VendorRepository
	CreateAdmin(context.Context, *Admin) (ID, error)
	CreateIngredients(context.Context, []*Ingredient) ([]*ID, error)

	FindAdminByID(context.Context, ID) (*Admin, error)
	FindAdminByEmail(context.Context, string) (*Admin, error)
	FindIngredients(context.Context, ID) ([]*Ingredient, error)

	UpdateAdmin(context.Context, *Admin) error
	UpdateIngredients(context.Context, ID, []*Ingredient) error

	DeleteIngredients(context.Context, ID, []*ID) error
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

type MongoAdminRepository struct {
	*MongoUserRepository
	*MongoVendorRepository
	col *mongo.Collection
}

func newMongoUserRepository(client *mongo.Client, dbName string) UserRepository {
	return &MongoUserRepository{col: client.Database(dbName).Collection("user")}
}

func newMongoVendorRepository(client *mongo.Client, dbName string) VendorRepository {
	return &MongoVendorRepository{col: client.Database(dbName).Collection("vendor")}
}

func (m MongoUserRepository) CreateUser(ctx context.Context, user *User) (ID, error) {
	ctx, span := Tracer.Start(ctx, "CreateUser")
	defer span.End()
	Logger.InfoContext(ctx, "Inserting in Users collection", slog.Any("user", user), user_repo_source)
	return create[*User](ctx, user, m.col, user_repo_source)
}

func (m MongoUserRepository) CreateRecipes(ctx context.Context, id ID, recipes []*Recipe) ([]*ID, error) {
	ctx, span := Tracer.Start(ctx, "CreateUserRecipes")
	defer span.End()
	ids := AssignIDs(recipes)

	Logger.InfoContext(ctx, "Adding Recipe/s to user", slog.Any("Recipe/s", recipes), user_repo_source)
	filter, update := getFilterPush[[]*Recipe](id, "saved_recipes", recipes)

	if err := createContainers[[]*Recipe](ctx, m.col, id, ids, recipes, filter, update, user_repo_source); err != nil {
		Logger.ErrorContext(ctx, "Error adding in user recipes", slog.Any("error", err), user_repo_source)
		return nil, err
	}

	Logger.InfoContext(ctx, "Recipes added successfully", slog.String("userId", id.String()), user_repo_source)
	return ids, nil
}

func (m MongoUserRepository) CreateCarts(ctx context.Context, id ID, carts []*Cart) ([]*ID, error) {
	ctx, span := Tracer.Start(ctx, "CreateUserCarts")
	defer span.End()

	ids := AssignIDs(carts)

	Logger.InfoContext(ctx, "Adding Cart/s to user", slog.Any("ID", id.String()), user_repo_source)
	filter, update := getFilterPush[[]*Cart](id, "carts", carts)

	if err := createContainers[[]*Cart](ctx, m.col, id, ids, carts, filter, update, user_repo_source); err != nil {
		Logger.ErrorContext(ctx, "Error in adding user cart", slog.Any("error", err), user_repo_source)
		return nil, err
	}

	Logger.InfoContext(ctx, "Carts added successfully", slog.String("userId", id.String()), user_repo_source)
	return ids, nil
}

func (m MongoUserRepository) CreateUserOrders(ctx context.Context, id ID, orders []*UserOrder) ([]*ID, error) {
	ctx, span := Tracer.Start(ctx, "CreateUserOrders")
	defer span.End()

	ids := AssignIDs(orders)

	Logger.InfoContext(ctx, "Adding Order/s to user", slog.String("ID", id.String()), user_repo_source)
	filter, update := getFilterPush[[]*UserOrder](id, "orders", orders)

	if err := createContainers[[]*UserOrder](ctx, m.col, id, ids, orders, filter, update, user_repo_source); err != nil {
		Logger.ErrorContext(ctx, "Error in adding user orders", slog.Any("error", err), user_repo_source)
		return nil, err
	}

	Logger.InfoContext(ctx, "Orders added successfully", slog.String("userId", id.String()), user_repo_source)
	return ids, nil
}

func (m MongoUserRepository) FindUserByID(ctx context.Context, id ID) (user *User, err error) {
	ctx, span := Tracer.Start(ctx, "FindUserID")
	defer span.End()

	return findById[*User](ctx, m.col, id, user_repo_source)
}

func (m MongoUserRepository) FindUserByEmail(ctx context.Context, email string) (user *User, err error) {
	ctx, span := Tracer.Start(ctx, "FindUserByEmail")
	defer span.End()

	return findByEmail[*User](ctx, m.col, email, user_repo_source)
}

func (m MongoUserRepository) FindRecipes(ctx context.Context, id ID) ([]*Recipe, error) {
	ctx, span := Tracer.Start(ctx, "FindRecipes")
	defer span.End()

	Logger.InfoContext(ctx, "Finding recipies for user", slog.String("UserId", id.value.Hex()), user_repo_source)
	return findContainer[[]*Recipe](ctx, m.col, id, "saved_recipes", user_repo_source)
}

func (m MongoUserRepository) FindCarts(ctx context.Context, id ID) ([]*Cart, error) {
	ctx, span := Tracer.Start(ctx, "FindUserCarts")
	defer span.End()

	Logger.InfoContext(ctx, "Finding carts for user", slog.String("UserId", id.String()), user_repo_source)
	return findContainer[[]*Cart](ctx, m.col, id, "carts", user_repo_source)
}

func (m MongoUserRepository) FindUserOrders(ctx context.Context, id ID) ([]*UserOrder, error) {
	ctx, span := Tracer.Start(ctx, "FindUserOrders")
	defer span.End()

	Logger.InfoContext(ctx, "Finding orders for user", slog.String("UserId", id.String()), user_repo_source)
	return findContainer[[]*UserOrder](ctx, m.col, id, "orders", user_repo_source)
}

func (m MongoUserRepository) UpdateUser(ctx context.Context, user *User) error {
	ctx, span := Tracer.Start(ctx, "UpdateUser")
	defer span.End()
	return update(ctx, &user.Common, m.col, user_repo_source)
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

func (m MongoUserRepository) UpdateUserOrders(ctx context.Context, id ID, orders []*UserOrder) error {
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

func (m MongoUserRepository) DeleteUser(ctx context.Context, id ID) error {
	ctx, span := Tracer.Start(ctx, "DeleteUser")
	defer span.End()

	Logger.InfoContext(ctx, "Deleting a user", slog.String("ID", id.String()), user_repo_source)
	return deletes(ctx, m.col, id, user_repo_source)
}

func (m MongoUserRepository) DeleteRecipes(ctx context.Context, id ID, ids []*ID) error {
	ctx, span := Tracer.Start(ctx, "DeleteRecipes")
	defer span.End()

	Logger.InfoContext(ctx, "Deleting recipes for user",
		slog.String("userID", id.String()), slog.Any("recipeIDs", ids), user_repo_source)

	filter, update := getFilterDelete(id, "saved_recipes", ids)

	if err := deleteContainers(ctx, m.col, id, filter, update, vendor_repo_source); err != nil {
		Logger.ErrorContext(ctx, "Error in deleting recipes", slog.Any("error", err), user_repo_source)
		return err
	}

	Logger.InfoContext(ctx, "Recipes deleted successfully", slog.String("userID", id.String()), user_repo_source)
	return nil
}

func (m MongoUserRepository) DeleteCarts(ctx context.Context, id ID, ids []*ID) error {
	ctx, span := Tracer.Start(ctx, "DeleteUserCarts")
	defer span.End()

	Logger.InfoContext(ctx, "Deleting carts for user",
		slog.String("userID", id.String()), slog.Any("cartIDs", ids), user_repo_source)

	filter, update := getFilterDelete(id, "carts", ids)
	if err := deleteContainers(ctx, m.col, id, filter, update, vendor_repo_source); err != nil {
		Logger.ErrorContext(ctx, "Error in deleting carts", slog.Any("error", err), user_repo_source)
		return err
	}

	Logger.InfoContext(ctx, "Carts deleted successfully", slog.String("userID", id.String()), user_repo_source)
	return nil
}

func (m MongoVendorRepository) CreateVendor(ctx context.Context, vendor *Vendor) (res ID, err error) {
	ctx, span := Tracer.Start(ctx, "CreateVendor")
	defer span.End()

	return create[*Vendor](ctx, vendor, m.col, vendor_repo_source)
}

func (m MongoVendorRepository) CreateStores(ctx context.Context, id ID, stores []*Store) ([]*ID, error) {
	ctx, span := Tracer.Start(ctx, "CreateVendorStores")
	defer span.End()

	ids := AssignIDs(stores)

	Logger.InfoContext(ctx, "Adding Store/s to vendor", slog.Any("Store/s", stores), vendor_repo_source)
	filter, update := getFilterPush[[]*Store](id, "stores", stores)

	if err := createContainers[[]*Store](ctx, m.col, id, ids, stores, filter, update, vendor_repo_source); err != nil {
		Logger.ErrorContext(ctx, "Error in adding vendor stores", slog.Any("error", err), user_repo_source)
		return nil, err
	}

	Logger.InfoContext(ctx, "Stores added successfully", slog.String("vendorId", id.String()), vendor_repo_source)
	return ids, nil
}

func (m MongoVendorRepository) CreateVendorOrders(ctx context.Context, id ID, orders []*VendorOrder) ([]*ID, error) {
	ctx, span := Tracer.Start(ctx, "CreateVendorOrders")
	defer span.End()

	ids := AssignIDs(orders)

	Logger.InfoContext(ctx, "Adding Order/s to vendor", slog.String("ID", id.String()), vendor_repo_source)
	filter, update := getFilterPush[[]*VendorOrder](id, "orders", orders)

	if err := createContainers[[]*VendorOrder](ctx, m.col, id, ids, orders, filter, update, vendor_repo_source); err != nil {
		Logger.ErrorContext(ctx, "Error in adding vendor orders", slog.Any("error", err), user_repo_source)
		return nil, err
	}

	Logger.InfoContext(ctx, "Orders added successfully", slog.String("vendorId", id.String()), vendor_repo_source)
	return ids, nil
}

func (m MongoVendorRepository) FindVendorByID(ctx context.Context, id ID) (vendor *Vendor, err error) {
	ctx, span := Tracer.Start(ctx, "FindVendorID")
	defer span.End()

	return findById[*Vendor](ctx, m.col, id, vendor_repo_source)

}

func (m MongoVendorRepository) FindVendorByEmail(ctx context.Context, email string) (vendor *Vendor, err error) {
	ctx, span := Tracer.Start(ctx, "FindVendorByEmail")
	defer span.End()

	return findByEmail[*Vendor](ctx, m.col, email, vendor_repo_source)
}

func (m MongoVendorRepository) FindStores(ctx context.Context, id ID) ([]*Store, error) {
	ctx, span := Tracer.Start(ctx, "FindVendorStores")
	defer span.End()

	Logger.InfoContext(ctx, "Finding stores for vendor", slog.String("VendorId", id.String()), vendor_repo_source)
	return findContainer[[]*Store](ctx, m.col, id, "stores", vendor_repo_source)
}

func (m MongoVendorRepository) FindVendorOrders(ctx context.Context, id ID) ([]*VendorOrder, error) {
	ctx, span := Tracer.Start(ctx, "FindVendorOrders")
	defer span.End()

	Logger.InfoContext(ctx, "Finding orders for vendor", slog.String("VendorId", id.String()), vendor_repo_source)
	return findContainer[[]*VendorOrder](ctx, m.col, id, "orders", vendor_repo_source)

}

func (m MongoVendorRepository) UpdateVendor(ctx context.Context, vendor *Vendor) error {
	ctx, span := Tracer.Start(ctx, "UpdateVendor")
	defer span.End()
	return update(ctx, &vendor.Common, m.col, vendor_repo_source)
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

func (m MongoVendorRepository) UpdateVendorOrders(ctx context.Context, id ID, orders []*VendorOrder) error {
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

func (m MongoVendorRepository) DeleteVendor(ctx context.Context, id ID) error {
	ctx, span := Tracer.Start(ctx, "DeleteVendor")
	defer span.End()

	Logger.InfoContext(ctx, "Deleting a vendor", slog.String("ID", id.String()), vendor_repo_source)
	return deletes(ctx, m.col, id, vendor_repo_source)
}

func (m MongoVendorRepository) DeleteStores(ctx context.Context, id ID, ids []*ID) error {
	ctx, span := Tracer.Start(ctx, "DeleteVendorStores")
	defer span.End()

	Logger.InfoContext(ctx, "Deleting stores for vendor",
		slog.String("vendorID", id.String()), slog.Any("storeIDs", ids), vendor_repo_source)

	filter, update := getFilterDelete(id, "stores", ids)

	if err := deleteContainers(ctx, m.col, id, filter, update, vendor_repo_source); err != nil {
		Logger.ErrorContext(ctx, "Error in deleting stores", slog.Any("error", err), vendor_repo_source)
		return err
	}

	Logger.InfoContext(ctx, "Stores deleted successfully", slog.String("vendorID", id.String()), vendor_repo_source)
	return nil
}
