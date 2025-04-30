package main

import (
	"context"
	"log/slog"

	"go.mongodb.org/mongo-driver/v2/bson"
)

type ID struct {
	value bson.ObjectID
}

type ItemWithID interface {
	GetIngredientID() bson.ObjectID
	SetIngredientID(id bson.ObjectID)
}

type ContainerWithItems[T ItemWithID] interface {
	GetID() bson.ObjectID
	SetID(id bson.ObjectID)
	GetItems() []T
}

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

type ToAdd interface {
	[]*Recipe | []*Cart | []*UserOrder | []*Store | []*VendorOrder
}

func getFilterUpdate[T ToAdd](id ID, key string, t T) (bson.D, bson.D) {
	filter := bson.D{{Key: "_id", Value: id.value}}
	update := bson.D{
		{Key: "$push", Value: bson.M{
			key: bson.M{
				"$each": t,
			},
		}},
	}
	return filter, update

}

func isValidRole(role string) bool { return role == "admin" || role == "user" || role == "vendor" }

func NewID(ctx context.Context, s string) (id ID, err error) {
	objId, err := bson.ObjectIDFromHex(s)
	if err != nil {
		Logger.ErrorContext(ctx, "Id not valid, unable to convert to bson.ObjectID",
			slog.Any("error", err), slog.String("source", "utils"))
		return id, err
	}
	id.value = objId
	return
}

func (id *ID) String() string {
	return id.value.Hex()
}
