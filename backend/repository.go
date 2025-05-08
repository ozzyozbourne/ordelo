package main

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"math"
	"os"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

var (
	Repos              *Repositories
	user_repo_source   = slog.Any("source", "UserRepository")
	vendor_repo_source = slog.Any("source", "VendorRepository")
	admin_repo_source  = slog.Any("source", "AdminRepository")
)

type Repositories struct {
	User   UserRepository
	Vendor VendorRepository
	Admin  AdminRepository
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

	UpdateUser(context.Context, *Common) error
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
	FindAllIngredients(context.Context, []*ReqIng) ([]*ResIng, error)
	FindVendorStore(context.Context, ID, ID) ([]*Item, error)

	UpdateVendor(context.Context, *Common) error
	UpdateStores(context.Context, ID, []*Store) error
	UpdateVendorOrders(context.Context, ID, []*VendorOrder) error

	DeleteVendor(context.Context, ID) error
	DeleteStores(context.Context, ID, []*ID) error
}

type AdminRepository interface {
	UserRepository
	VendorRepository
	CreateAdmin(context.Context, *Admin) (ID, error)
	CreateIngredients(context.Context, ID, []*Ingredient) ([]*ID, error)

	FindUsers(context.Context, ID) ([]*Common, error)
	FindVendors(context.Context, ID) ([]*Common, error)
	FindVendorStores(context.Context, ID) ([]*Vendor, error)
	FindAdminByEmail(context.Context, string) (*Admin, error)
	FindAdminByID(context.Context, ID) (*Admin, error)
	FindIngredients(context.Context, ID) ([]*Ingredient, error)

	UpdateAdmin(context.Context, *Common) error
	UpdateIngredients(context.Context, ID, []*Ingredient) error

	Delete(context.Context, ID) error
	DeleteIngredients(context.Context, ID, []*ID) error
}

func initMongoRepositories(mongoClient *mongo.Client) (*Repositories, error) {
	dbName := os.Getenv("DB_NAME")
	if dbName == "" {
		return nil, errors.New("env varible DB_NAME is empty")
	}
	ur, vr := newMongoUserRepository(mongoClient, dbName), newMongoVendorRepository(mongoClient, dbName)
	mongoRepos := &Repositories{
		User:   ur,
		Vendor: vr,
		Admin:  newMongoAdminRepository(mongoClient, dbName, ur, vr),
	}
	return mongoRepos, nil
}

type MongoUserRepository struct{ col *mongo.Collection }
type MongoVendorRepository struct{ col *mongo.Collection }
type MongoAdminRepository struct {
	UserRepository
	VendorRepository
	col    *mongo.Collection
	user   *mongo.Collection
	vendor *mongo.Collection
}

func newMongoUserRepository(client *mongo.Client, dbName string) UserRepository {
	return &MongoUserRepository{col: client.Database(dbName).Collection("user")}
}

func newMongoVendorRepository(client *mongo.Client, dbName string) VendorRepository {
	return &MongoVendorRepository{col: client.Database(dbName).Collection("vendor")}
}

func newMongoAdminRepository(client *mongo.Client, dbName string, ur UserRepository, vr VendorRepository) AdminRepository {
	return &MongoAdminRepository{
		UserRepository:   ur,
		VendorRepository: vr,
		col:              client.Database(dbName).Collection("admin"),
		user:             client.Database(dbName).Collection("user"),
		vendor:           client.Database(dbName).Collection("vendor"),
	}
}

func (m MongoUserRepository) CreateUser(ctx context.Context, user *User) (ID, error) {
	ctx, span := Tracer.Start(ctx, "CreateUser")
	defer span.End()
	Logger.InfoContext(ctx, "Inserting in Users collection", slog.Any("user", user), user_repo_source)
	if user.Carts == nil {
		user.Carts = []*Cart{}
	}
	if user.Orders == nil {
		user.Orders = []*UserOrder{}
	}
	if user.SavedRecipes == nil {
		user.SavedRecipes = []*Recipe{}
	}
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
	ctx, span := Tracer.Start(ctx, "FindUserByID")
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

func (m MongoUserRepository) UpdateUser(ctx context.Context, user *Common) error {
	ctx, span := Tracer.Start(ctx, "UpdateUser")
	defer span.End()
	return update(ctx, user, m.col, user_repo_source)
}

func (m MongoUserRepository) UpdateRecipes(ctx context.Context, id ID, recipes []*Recipe) error {
	ctx, span := Tracer.Start(ctx, "UpdateUserRecipes")
	defer span.End()

	Logger.InfoContext(ctx, "Updating recipes for user", slog.String("userID", id.String()), user_repo_source)
	return processContainers[[]*Recipe](ctx, m.col, id, recipes, user_repo_source)
}

func (m MongoUserRepository) UpdateCarts(ctx context.Context, id ID, carts []*Cart) error {
	ctx, span := Tracer.Start(ctx, "UpdateUserCarts")
	defer span.End()

	Logger.InfoContext(ctx, "Updating carts for user", slog.String("userID", id.String()), user_repo_source)
	return processContainers[[]*Cart](ctx, m.col, id, carts, user_repo_source)
}

func (m MongoUserRepository) UpdateUserOrders(ctx context.Context, id ID, orders []*UserOrder) error {
	ctx, span := Tracer.Start(ctx, "UpdateUserOrders")
	defer span.End()

	Logger.InfoContext(ctx, "Updating orders for user", slog.String("userID", id.String()), user_repo_source)
	return processContainers[[]*UserOrder](ctx, m.col, id, orders, user_repo_source)
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
	if vendor.Orders == nil {
		vendor.Orders = []*VendorOrder{}
	}
	if vendor.Stores == nil {
		vendor.Stores = []*Store{}
	}
	return create[*Vendor](ctx, vendor, m.col, vendor_repo_source)
}

func (m MongoVendorRepository) CreateStores(ctx context.Context, id ID, stores []*Store) ([]*ID, error) {
	ctx, span := Tracer.Start(ctx, "CreateVendorStores")
	defer span.End()

	ids := AssignIDs(stores)

	Logger.InfoContext(ctx, "Adding Store/s to vendor", slog.Any("Store/s", stores), vendor_repo_source)
	filter, update := getFilterPush[[]*Store](id, "stores", stores)

	if err := createContainers[[]*Store](ctx, m.col, id, ids, stores, filter, update, vendor_repo_source); err != nil {
		Logger.ErrorContext(ctx, "Error in adding vendor stores", slog.Any("error", err), vendor_repo_source)
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

func (m MongoVendorRepository) FindAllIngredients(ctx context.Context, req []*ReqIng) ([]*ResIng, error) {
	ctx, span := Tracer.Start(ctx, "FindAllIngredients")
	defer span.End()

	Logger.InfoContext(ctx, "Finding ingredients across all vendors", slog.Any("requirements", req), vendor_repo_source)

	cursor, err := m.col.Find(ctx, bson.D{})
	if err != nil {
		Logger.ErrorContext(ctx, "Error finding vendors", slog.Any("error", err), vendor_repo_source)
		return nil, err
	}
	defer cursor.Close(ctx)

	var results []*ResIng
	for cursor.Next(ctx) {
		var vendor Vendor
		if err := cursor.Decode(&vendor); err != nil {
			Logger.ErrorContext(ctx, "Error decoding vendor", slog.Any("error", err), vendor_repo_source)
			continue
		}

		vendorResult := &ResIng{
			ID:     vendor.ID,
			Stores: []*Store{},
		}

		for _, store := range vendor.Stores {
			storeMatch := &Store{
				ID:        store.ID,
				Name:      store.Name,
				StoreType: store.StoreType,
				Location:  store.Location,
				Items:     []*Item{},
			}
			for _, reqIng := range req {
				var bestMatch *Item
				var minDiff int = math.MinInt32
				for _, item := range store.Items {

					if item.Name == reqIng.Name && item.Unit == reqIng.Unit && item.UnitQuantity >= reqIng.UnitQuantity {
						diff := item.UnitQuantity - reqIng.UnitQuantity

						if minDiff == math.MinInt32 || diff < minDiff {
							bestMatch = &Item{
								Ingredient: Ingredient{
									IngredientID: item.IngredientID,
									Name:         item.Name,
									UnitQuantity: item.UnitQuantity,
									Unit:         item.Unit,
									Price:        item.Price,
								},
								Quantity: item.Quantity,
							}
							minDiff = diff
						}
					}
				}

				if bestMatch != nil {
					storeMatch.Items = append(storeMatch.Items, bestMatch)
				}
			}

			if len(storeMatch.Items) > 0 {
				vendorResult.Stores = append(vendorResult.Stores, storeMatch)
			}
		}

		if len(vendorResult.Stores) > 0 {
			results = append(results, vendorResult)
		}
	}

	if err := cursor.Err(); err != nil {
		Logger.ErrorContext(ctx, "Error iterating vendors", slog.Any("error", err), vendor_repo_source)
		return nil, err
	}

	if len(results) == 0 {
		Logger.ErrorContext(ctx, "No match found", vendor_repo_source)
		return nil, &NoItems{}
	}

	Logger.InfoContext(ctx, "Found matching ingredients", slog.Int("vendorCount", len(results)), vendor_repo_source)
	return results, nil
}

func (m MongoVendorRepository) FindVendorStore(ctx context.Context, vendorid ID, storeid ID) ([]*Item, error) {
	ctx, span := Tracer.Start(ctx, "FindVendorStore")
	defer span.End()

	Logger.InfoContext(ctx, "Finding items in vendor store", slog.String("vendorID", vendorid.String()),
		slog.String("storeID", storeid.String()), vendor_repo_source)

	filter := bson.D{{Key: "_id", Value: vendorid.value}, {Key: "stores._id", Value: storeid.value}}
	projection := bson.D{{Key: "stores.$", Value: 1}}

	var result struct {
		Stores []*Store `bson:"stores"`
	}

	if err := m.col.FindOne(ctx, filter, options.FindOne().SetProjection(projection)).Decode(&result); err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			Logger.ErrorContext(ctx, "Vendor or store not found", slog.String("vendorID", vendorid.String()),
				slog.String("storeID", storeid.String()), vendor_repo_source)
			return nil, fmt.Errorf("vendor with ID %s or store with ID %s not found", vendorid.String(), storeid.String())
		}
		Logger.ErrorContext(ctx, "Error finding store items", slog.Any("error", err), vendor_repo_source)
		return nil, err
	}

	if len(result.Stores) == 0 || result.Stores[0] == nil {
		Logger.ErrorContext(ctx, "Store not found", slog.String("vendorID", vendorid.String()),
			slog.String("storeID", storeid.String()), vendor_repo_source)
		return nil, fmt.Errorf("store with ID %s not found for vendor %s", storeid.String(), vendorid.String())
	}

	items := result.Stores[0].Items
	if len(items) == 0 {
		Logger.InfoContext(ctx, "No items found in store", slog.String("vendorID", vendorid.String()),
			slog.String("storeID", storeid.String()), vendor_repo_source)
		return nil, &NoItems{}
	}

	Logger.InfoContext(ctx, "Items found successfully", slog.Int("count", len(items)), slog.String("vendorID", vendorid.String()),
		slog.String("storeID", storeid.String()), vendor_repo_source)
	return items, nil
}

func (m MongoVendorRepository) FindVendorOrders(ctx context.Context, id ID) ([]*VendorOrder, error) {
	ctx, span := Tracer.Start(ctx, "FindVendorOrders")
	defer span.End()

	Logger.InfoContext(ctx, "Finding orders for vendor", slog.String("VendorId", id.String()), vendor_repo_source)
	return findContainer[[]*VendorOrder](ctx, m.col, id, "orders", vendor_repo_source)

}

func (m MongoVendorRepository) UpdateVendor(ctx context.Context, vendor *Common) error {
	ctx, span := Tracer.Start(ctx, "UpdateVendor")
	defer span.End()
	return update(ctx, vendor, m.col, vendor_repo_source)
}

func (m MongoVendorRepository) UpdateStores(ctx context.Context, id ID, stores []*Store) error {
	ctx, span := Tracer.Start(ctx, "UpdateVendorStores")
	defer span.End()

	Logger.InfoContext(ctx, "Updating stores for vendor", slog.String("vendorID", id.String()), vendor_repo_source)
	return processContainers[[]*Store](ctx, m.col, id, stores, vendor_repo_source)
}

func (m MongoVendorRepository) UpdateVendorOrders(ctx context.Context, id ID, orders []*VendorOrder) error {
	ctx, span := Tracer.Start(ctx, "UpdateVendorOrders")
	defer span.End()

	Logger.InfoContext(ctx, "Updating orders for vendor", slog.String("vendorID", id.String()), vendor_repo_source)
	return processContainers[[]*VendorOrder](ctx, m.col, id, orders, vendor_repo_source)
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
		return err
	}
	Logger.InfoContext(ctx, "Stores deleted successfully", slog.String("vendorID", id.String()), vendor_repo_source)
	return nil
}

func (v MongoAdminRepository) CreateAdmin(ctx context.Context, admin *Admin) (id ID, err error) {
	ctx, span := Tracer.Start(ctx, "CreateAdmin")
	defer span.End()
	if admin.Ingredients == nil {
		admin.Ingredients = []*Ingredient{}
	}
	Logger.InfoContext(ctx, "Inserting in Admin collection", slog.Any("user", admin), admin_repo_source)
	return create[*Admin](ctx, admin, v.col, admin_repo_source)
}

func (v MongoAdminRepository) CreateIngredients(ctx context.Context, id ID, ingredients []*Ingredient) ([]*ID, error) {
	ctx, span := Tracer.Start(ctx, "CreateIngredients")
	defer span.End()

	Logger.InfoContext(ctx, "Adding ingredients to admin", slog.Any("ingredients", ingredients), admin_repo_source)

	ids := make([]*ID, len(ingredients))
	for i, ingredient := range ingredients {
		if ingredient.IngredientID == bson.NilObjectID {
			ingredient.IngredientID = bson.NewObjectID()
		}
		ids[i] = &ID{ingredient.IngredientID}
	}

	filter := bson.D{{Key: "_id", Value: id.value}}
	update := bson.D{{Key: "$push", Value: bson.M{"ingredients": bson.M{"$each": ingredients}}}}

	result, err := v.col.UpdateOne(ctx, filter, update)
	if err != nil {
		Logger.ErrorContext(ctx, "Error adding ingredients", slog.Any("error", err), admin_repo_source)
		return nil, err
	}

	if !result.Acknowledged {
		Logger.ErrorContext(ctx, "Write concern returned false", slog.String("ID", id.String()), admin_repo_source)
		return nil, fmt.Errorf("write concern returned false")
	}

	if result.MatchedCount == 0 {
		Logger.ErrorContext(ctx, "Admin not found", slog.String("ID", id.String()), admin_repo_source)
		return nil, fmt.Errorf("admin with ID %s not found", id.String())
	}

	Logger.InfoContext(ctx, "Ingredients added successfully", slog.String("adminId", id.String()), admin_repo_source)
	return ids, nil
}

func (v MongoAdminRepository) FindUsers(ctx context.Context, id ID) (users []*Common, err error) {
	ctx, span := Tracer.Start(ctx, "FindUsers")
	defer span.End()

	Logger.InfoContext(ctx, "Admin retrieving all users", slog.String("adminID", id.String()), admin_repo_source)
	cursor, err := v.user.Find(ctx, bson.D{})
	if err != nil {
		Logger.ErrorContext(ctx, "Error finding users", slog.Any("error", err), admin_repo_source)
		return
	}
	defer cursor.Close(ctx)

	for cursor.Next(ctx) {
		var user User
		if err := cursor.Decode(&user); err != nil {
			Logger.ErrorContext(ctx, "Error decoding user", slog.Any("error", err), admin_repo_source)
			continue
		}
		users = append(users, &user.Common)
	}
	if err = cursor.Err(); err != nil {
		Logger.ErrorContext(ctx, "Error during cursor iteration", slog.Any("error", err), admin_repo_source)
		return
	}

	Logger.InfoContext(ctx, "Users found successfully", slog.Int("count", len(users)), admin_repo_source)
	return
}

func (v MongoAdminRepository) FindVendors(ctx context.Context, id ID) (vendors []*Common, err error) {
	ctx, span := Tracer.Start(ctx, "FindVendors")
	defer span.End()

	Logger.InfoContext(ctx, "Admin retrieving all vendors", slog.String("adminID", id.String()), admin_repo_source)
	cursor, err := v.vendor.Find(ctx, bson.D{})
	if err != nil {
		Logger.ErrorContext(ctx, "Error finding vendors", slog.Any("error", err), admin_repo_source)
		return
	}
	defer cursor.Close(ctx)

	for cursor.Next(ctx) {
		var vendor Vendor
		if err := cursor.Decode(&vendor); err != nil {
			Logger.ErrorContext(ctx, "Error decoding vendor", slog.Any("error", err), admin_repo_source)
			continue
		}
		vendors = append(vendors, &vendor.Common)
	}

	if err = cursor.Err(); err != nil {
		Logger.ErrorContext(ctx, "Error during cursor iteration", slog.Any("error", err), admin_repo_source)
		return
	}

	Logger.InfoContext(ctx, "Vendors found successfully", slog.Int("count", len(vendors)), admin_repo_source)
	return
}

func (v MongoAdminRepository) FindVendorStores(ctx context.Context, id ID) (vendors []*Vendor, err error) {
	ctx, span := Tracer.Start(ctx, "FindVendorStores")
	defer span.End()

	Logger.InfoContext(ctx, "Admin retrieving all stores", slog.String("adminID", id.String()), admin_repo_source)
	projection := bson.D{
		{Key: "_id", Value: 1},
		{Key: "name", Value: 1},
		{Key: "email", Value: 1},
		{Key: "role", Value: 1},
		{Key: "stores", Value: 1},
	}

	cursor, err := v.vendor.Find(ctx, bson.D{}, options.Find().SetProjection(projection))
	if err != nil {
		Logger.ErrorContext(ctx, "Error finding vendors with stores", slog.Any("error", err), admin_repo_source)
		return
	}
	defer cursor.Close(ctx)

	for cursor.Next(ctx) {
		var vendor Vendor
		if err = cursor.Decode(&vendor); err != nil {
			Logger.ErrorContext(ctx, "Error decoding vendor", slog.Any("error", err), admin_repo_source)
			continue
		}

		if len(vendor.Stores) > 0 {
			vendors = append(vendors, &vendor)
		}
	}

	if err = cursor.Err(); err != nil {
		Logger.ErrorContext(ctx, "Error during cursor iteration", slog.Any("error", err), admin_repo_source)
		return nil, err
	}

	Logger.InfoContext(ctx, "Stores found successfully", slog.Int("vendorCount", len(vendors)), admin_repo_source)
	return vendors, nil
}

func (v MongoAdminRepository) FindAdminByEmail(ctx context.Context, email string) (*Admin, error) {
	ctx, span := Tracer.Start(ctx, "FindAdminByEmail")
	defer span.End()

	return findByEmail[*Admin](ctx, v.col, email, admin_repo_source)
}

func (v MongoAdminRepository) FindAdminByID(ctx context.Context, id ID) (*Admin, error) {
	ctx, span := Tracer.Start(ctx, "FindAdminByID")
	defer span.End()

	return findById[*Admin](ctx, v.col, id, admin_repo_source)
}

func (v MongoAdminRepository) FindIngredients(ctx context.Context, id ID) ([]*Ingredient, error) {
	ctx, span := Tracer.Start(ctx, "FindIngredients")
	defer span.End()

	Logger.InfoContext(ctx, "Finding ingredients for admin", slog.String("AdminId", id.String()), admin_repo_source)
	filter := bson.D{{Key: "_id", Value: id.value}}
	projection := bson.D{{Key: "ingredients", Value: 1}, {Key: "_id", Value: 0}}

	var result struct {
		Ingredients []*Ingredient `bson:"ingredients"`
	}

	if err := v.col.FindOne(ctx, filter, options.FindOne().SetProjection(projection)).Decode(&result); err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			Logger.ErrorContext(ctx, "Admin not found", slog.String("ID", id.String()), admin_repo_source)
			return nil, fmt.Errorf("admin with ID %s not found", id.String())
		}
		Logger.ErrorContext(ctx, "Error finding ingredients", slog.Any("error", err), admin_repo_source)
		return nil, err
	}

	Logger.InfoContext(ctx, "Ingredients found successfully",
		slog.Int("count", len(result.Ingredients)), admin_repo_source)
	return result.Ingredients, nil
}

func (v MongoAdminRepository) UpdateAdmin(ctx context.Context, admin *Common) error {
	ctx, span := Tracer.Start(ctx, "UpdateAdmin")
	defer span.End()

	return update(ctx, admin, v.col, admin_repo_source)
}

func (v MongoAdminRepository) UpdateIngredients(ctx context.Context, id ID, ingredients []*Ingredient) error {
	ctx, span := Tracer.Start(ctx, "UpdateIngredients")
	defer span.End()

	Logger.InfoContext(ctx, "Updating ingredients for admin", slog.String("adminID", id.String()), admin_repo_source)

	if err := checkIfDocumentExists(ctx, v.col, id.value); err != nil {
		return err
	}

	var models []mongo.WriteModel

	for _, ingredient := range ingredients {
		if ingredient.IngredientID == bson.NilObjectID {

			ingredient.IngredientID = bson.NewObjectID()
			pushModel := mongo.NewUpdateOneModel().
				SetFilter(bson.D{{Key: "_id", Value: id.value}}).
				SetUpdate(bson.D{{Key: "$push", Value: bson.M{"ingredients": ingredient}}})
			models = append(models, pushModel)
		} else {

			filter := bson.D{
				{Key: "_id", Value: id.value},
				{Key: "ingredients.ingredient_id", Value: ingredient.IngredientID},
			}

			update := bson.D{{Key: "$set", Value: bson.M{}}}
			setValue := update[0].Value.(bson.M)

			if ingredient.Name != "" {
				setValue["ingredients.$.name"] = ingredient.Name
			}
			if ingredient.UnitQuantity != 0 {
				setValue["ingredients.$.unit_quantity"] = ingredient.UnitQuantity
			}
			if ingredient.Unit != "" {
				setValue["ingredients.$.unit"] = ingredient.Unit
			}
			if ingredient.Price != 0 {
				setValue["ingredients.$.price"] = ingredient.Price
			}

			if len(setValue) > 0 {
				models = append(models, mongo.NewUpdateOneModel().SetFilter(filter).SetUpdate(update))
			}
		}
	}

	if len(models) > 0 {
		result, err := v.col.BulkWrite(ctx, models)
		if err != nil {
			Logger.ErrorContext(ctx, "Error in bulk update", slog.Any("error", err), admin_repo_source)
			return err
		}
		if !result.Acknowledged {
			Logger.ErrorContext(ctx, "Write concern returned false", slog.String("ID", id.String()), admin_repo_source)
			return fmt.Errorf("write concern returned false")
		}
		Logger.InfoContext(ctx, "Ingredients updated successfully",
			slog.Int64("matchedCount", result.MatchedCount),
			slog.Int64("modifiedCount", result.ModifiedCount),
			slog.Int64("insertedCount", result.InsertedCount),
			admin_repo_source)
	} else {
		Logger.InfoContext(ctx, "No updates to perform", admin_repo_source)
	}

	return nil
}

func (v MongoAdminRepository) Delete(ctx context.Context, id ID) error {
	ctx, span := Tracer.Start(ctx, "DeleteAdmin")
	defer span.End()

	Logger.InfoContext(ctx, "Deleting an admin", slog.String("ID", id.String()), admin_repo_source)
	return deletes(ctx, v.col, id, admin_repo_source)
}

func (v MongoAdminRepository) DeleteIngredients(ctx context.Context, id ID, ids []*ID) error {
	ctx, span := Tracer.Start(ctx, "DeleteIngredients")
	defer span.End()

	Logger.InfoContext(ctx, "Deleting ingredients for admin",
		slog.String("adminID", id.String()), slog.Any("ingredientIDs", ids), admin_repo_source)

	objIDs := make([]bson.ObjectID, len(ids))
	for i, ingID := range ids {
		objIDs[i] = ingID.value
	}

	filter := bson.D{{Key: "_id", Value: id.value}}
	update := bson.D{{Key: "$pull", Value: bson.M{
		"ingredients": bson.M{"ingredient_id": bson.M{"$in": objIDs}},
	}}}

	result, err := v.col.UpdateOne(ctx, filter, update)
	if err != nil {
		Logger.ErrorContext(ctx, "Error deleting ingredients", slog.Any("error", err), admin_repo_source)
		return err
	}

	if !result.Acknowledged {
		Logger.ErrorContext(ctx, "Write concern returned false", slog.String("ID", id.String()), admin_repo_source)
		return fmt.Errorf("write concern returned false")
	}

	if result.MatchedCount == 0 {
		Logger.ErrorContext(ctx, "Admin not found", slog.String("ID", id.String()), admin_repo_source)
		return fmt.Errorf("admin with ID %s not found", id.String())
	}

	if result.ModifiedCount == 0 {
		Logger.ErrorContext(ctx, "No ingredients were deleted, they may not exist",
			slog.String("adminID", id.String()), admin_repo_source)
		return fmt.Errorf("no ingredients were deleted with adminID: %s", id.String())
	}

	Logger.InfoContext(ctx, "Ingredients deleted successfully", slog.String("adminID", id.String()), admin_repo_source)
	return nil
}

func getAllIngredients(ctx context.Context, source slog.Attr) ([]*Ingredient, error) {
	ctx, span := Tracer.Start(ctx, "GetAdminIngredients")
	defer span.End()

	admin := Admin{}
	if err := MongoClient.Database(os.Getenv("DB_NAME")).Collection("admin").FindOne(ctx, bson.D{}).Decode(&admin); err != nil {
		Logger.ErrorContext(ctx, "Error in Fetching the single saved admin", slog.Any("error", err), source)
		return nil, err
	}

	Logger.InfoContext(ctx, "Ingrediets found Successfully", source)
	return admin.Ingredients, nil
}
