package main

import (
	"context"
	"fmt"
	"log/slog"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
)

type ID struct{ value bson.ObjectID }

type ToAdd interface {
	[]*Recipe | []*Cart | []*UserOrder | []*Store | []*VendorOrder
}

type ItemWithID interface {
	GetIngredientID() bson.ObjectID
	SetIngredientID(id bson.ObjectID)
}

type UserType interface{ *User | *Vendor }

type ContainerWithItems[T ItemWithID] interface {
	GetID() bson.ObjectID
	SetID(id bson.ObjectID)
	GetItems() []T
}

func (id *ID) String() string { return id.value.Hex() }

func (r *Recipe) GetID() bson.ObjectID   { return r.ID }
func (r *Recipe) SetID(id bson.ObjectID) { r.ID = id }
func (r *Recipe) GetItems() []*Item      { return r.Items }

func (c *Cart) GetID() bson.ObjectID   { return c.ID }
func (c *Cart) SetID(id bson.ObjectID) { c.ID = id }
func (c *Cart) GetItems() []*Item      { return c.Items }

func (o *UserOrder) GetID() bson.ObjectID   { return o.ID }
func (o *UserOrder) SetID(id bson.ObjectID) { o.ID = id }
func (o *UserOrder) GetItems() []*Item      { return o.Items }

func (s *Store) GetID() bson.ObjectID   { return s.ID }
func (s *Store) SetID(id bson.ObjectID) { s.ID = id }
func (s *Store) GetItems() []*Item      { return s.Items }

func (o *VendorOrder) GetID() bson.ObjectID   { return o.ID }
func (o *VendorOrder) SetID(id bson.ObjectID) { o.ID = id }
func (o *VendorOrder) GetItems() []*Item      { return o.Items }

func (i *Item) GetIngredientID() bson.ObjectID   { return i.IngredientID }
func (i *Item) SetIngredientID(id bson.ObjectID) { i.IngredientID = id }

func isValidRole(role string) bool { return role == "admin" || role == "user" || role == "vendor" }

func AssignIDs[I ItemWithID, C ContainerWithItems[I]](containers []C) []*ID {
	ids := make([]*ID, len(containers))
	for i, container := range containers {
		id := bson.NewObjectID()
		container.SetID(id)
		ids[i] = &ID{id}
		for _, item := range container.GetItems() {
			item.SetIngredientID(bson.NewObjectID())
		}
	}
	return ids
}

func getFilterUpdate[T ToAdd](id ID, key string, t T) (bson.D, bson.D) {
	filter := bson.D{{Key: "_id", Value: id.value}}
	update := bson.D{{Key: "$push", Value: bson.M{key: bson.M{"$each": t}}}}
	return filter, update
}

func NewID(ctx context.Context, s string) (ID, error) {
	objId, err := bson.ObjectIDFromHex(s)
	if err != nil {
		Logger.ErrorContext(ctx, "Id not valid, unable to convert to bson.ObjectID",
			slog.Any("error", err), slog.String("source", "utils"))
		return ID{bson.NilObjectID}, err
	}
	return ID{objId}, nil
}

func create[T UserType](ctx context.Context, t T, col *mongo.Collection, userType string, source slog.Attr) (res ID, err error) {
	result, err := col.InsertOne(ctx, t)
	if err != nil {
		Logger.ErrorContext(ctx, "Error in inserting a user in DB", slog.Any("error", err),
			slog.String("typeOfUser", userType), source)
		return
	}

	if res, err = convertToID(ctx, result); err != nil {
		return
	}

	if result.Acknowledged == false {
		Logger.ErrorContext(ctx, "Write concern returned false", slog.String("ID", res.String()), source)
		err = fmt.Errorf("Write concern returned false")
		return

	}
	Logger.InfoContext(ctx, "User Created Successfully", slog.String("ID", res.String()), slog.String("typeOfUser", userType), source)
	return
}

func createContainers[T ToAdd](ctx context.Context, col *mongo.Collection, id ID, ids []*ID, t T, fil, up bson.D) error {
	result, err := col.UpdateOne(ctx, fil, up)
	if err != nil {
		Logger.ErrorContext(ctx, "Error in adding containers", slog.Any("error", err), user_repo_source)
		return err
	}
	if result.Acknowledged == false {
		Logger.ErrorContext(ctx, "Write concern returned false", slog.String("ID", id.String()), user_repo_source)
		return fmt.Errorf("Write concern returned false")
	}
	if result.MatchedCount == 0 {
		Logger.ErrorContext(ctx, "User not found", slog.String("_id", id.String()), user_repo_source)
		return fmt.Errorf("user with ID %s not found", id.String())
	}
	return nil
}
