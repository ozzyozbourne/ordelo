package main

import (
	"context"
	"errors"
	"fmt"
	"log/slog"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

type ID struct{ value bson.ObjectID }

type containers interface {
	[]*Recipe | []*Cart | []*UserOrder | []*Store | []*VendorOrder
}

type ItemWithID interface {
	*Item
	GetIngredientID() bson.ObjectID
	SetIngredientID(id bson.ObjectID)
}

type UserType interface{ *User | *Vendor | *Admin }

type ContainerWithItems[T ItemWithID] interface {
	*Recipe | *Cart | *UserOrder | *Store | *VendorOrder
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

func isValidRole(role string) error {
	if role == "admin" || role == "user" || role == "vendor" {
		return nil
	} else {
		return errors.New("invalid role")
	}
}

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

func getFilterPush[T containers](id ID, key string, t T) (bson.D, bson.D) {
	filter := bson.D{{Key: "_id", Value: id.value}}
	update := bson.D{{Key: "$push", Value: bson.M{key: bson.M{"$each": t}}}}
	return filter, update
}

func getFilterDelete(id ID, key string, ids []*ID) (bson.D, bson.D) {
	ObjIDs := make([]bson.ObjectID, len(ids))
	for i, sid := range ids {
		ObjIDs[i] = sid.value
	}
	filter := bson.D{{Key: "_id", Value: id.value}}
	update := bson.D{{Key: "$pull", Value: bson.M{key: bson.M{"_id": bson.M{"$in": ObjIDs}}}}}
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

func create[T UserType](ctx context.Context, t T, col *mongo.Collection, source slog.Attr) (res ID, err error) {
	result, err := col.InsertOne(ctx, t)
	if err != nil {
		Logger.ErrorContext(ctx, "Error in inserting a user in DB", slog.Any("error", err), source)
		return
	}
	if res, err = convertToID(ctx, result); err != nil {
		return
	}
	if !result.Acknowledged {
		Logger.ErrorContext(ctx, "Write concern returned false", slog.String("ID", res.String()), source)
		err = fmt.Errorf("write concern returned false")
		return

	}
	Logger.InfoContext(ctx, "User Created Successfully", slog.String("ID", res.String()), source)
	return
}

func update(ctx context.Context, user *Common, col *mongo.Collection, source slog.Attr) error {
	Logger.InfoContext(ctx, "Updating user", source)

	var objId bson.ObjectID
	if objId = user.ID; objId == bson.NilObjectID {
		Logger.ErrorContext(ctx, "The user struct has no ObjectID", slog.Any("error", "No ObjectID"), source)
		return fmt.Errorf("User struct has no ObjectID")
	}
	if err := checkIfDocumentExists(ctx, col, objId); err != nil {
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

	result, err := col.BulkWrite(ctx, models)
	if err != nil {
		Logger.ErrorContext(ctx, "Error in bulk update", slog.Any("error", err), source)
		return err
	}
	if !result.Acknowledged {
		Logger.ErrorContext(ctx, "Write concern returned false", slog.String("ID", user.ID.Hex()), source)
		return fmt.Errorf("write concern returned false")
	}
	if result.ModifiedCount == 0 {
		Logger.ErrorContext(ctx, "No document was modified", slog.Any("User update", user), slog.Any("Result", result), source)
		return fmt.Errorf("no updates were mode for user %+v", user)
	}
	Logger.InfoContext(ctx, "User updated successfully", source)
	return nil
}

func deletes(ctx context.Context, col *mongo.Collection, id ID, source slog.Attr) error {
	result, err := col.DeleteOne(ctx, bson.D{{Key: "_id", Value: id.value}})
	if err != nil {
		Logger.ErrorContext(ctx, "Error deleting user", slog.Any("error", err), source)
		return err
	}
	if !result.Acknowledged {
		Logger.ErrorContext(ctx, "Write concern returned false", slog.String("ID", id.String()), source)
		return fmt.Errorf("write concern returned false")
	}
	if result.DeletedCount == 0 {
		Logger.ErrorContext(ctx, "User not found", slog.String("ID", id.String()), source)
		return fmt.Errorf("User with ID %s not found", id.String())
	}

	Logger.InfoContext(ctx, "User deleted successfully", slog.String("ID", id.String()), vendor_repo_source)
	return nil
}

func createContainers[T containers](ctx context.Context, col *mongo.Collection, id ID,
	ids []*ID, t T, fil, up bson.D, source slog.Attr) error {
	result, err := col.UpdateOne(ctx, fil, up)
	if err != nil {
		Logger.ErrorContext(ctx, "Error in adding containers", slog.Any("error", err), source)
		return err
	}
	if !result.Acknowledged {
		Logger.ErrorContext(ctx, "Write concern returned false", slog.String("ID", id.String()), source)
		return fmt.Errorf("write concern returned false")
	}
	if result.MatchedCount == 0 {
		Logger.ErrorContext(ctx, "User not found", slog.String("_id", id.String()), source)
		return fmt.Errorf("user with ID %s not found", id.String())
	}
	return nil
}

func deleteContainers(ctx context.Context, col *mongo.Collection, id ID, fil, up bson.D, source slog.Attr) error {
	result, err := col.UpdateOne(ctx, fil, up)
	if err != nil {
		Logger.ErrorContext(ctx, "Error in deleting containers", slog.Any("error", err), source)
		return err
	}
	if !result.Acknowledged {
		Logger.ErrorContext(ctx, "Write concern returned false", slog.String("ID", id.String()), source)
		return fmt.Errorf("write concern returned false")
	}
	if result.MatchedCount == 0 {
		Logger.ErrorContext(ctx, "User not found", slog.String("ID", id.String()), source)
		return fmt.Errorf("user with ID %s not found", id.String())
	}
	if result.ModifiedCount == 0 {
		Logger.InfoContext(ctx, "No container were deleted, they may not exist",
			slog.String("vendorID", id.String()), source)
		return fmt.Errorf("no container were deleted with userID: %s", id.String())
	}
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

func findById[U UserType](ctx context.Context, col *mongo.Collection, id ID, source slog.Attr) (user U, err error) {
	Logger.InfoContext(ctx, "Finding User by ID", slog.String("Id", id.String()), source)

	if err = col.FindOne(ctx, bson.D{{Key: "_id", Value: id.value}}).Decode(&user); err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			Logger.ErrorContext(ctx, "User not found", slog.String("ID", id.String()), source)
			err = fmt.Errorf("user with ID %s not found", id.String())
			return
		}
		Logger.ErrorContext(ctx, "Error finding user by ID", slog.Any("error", err), source)
		return
	}

	Logger.InfoContext(ctx, "User found successfully", slog.String("ID", id.String()), source)
	return
}

func findByEmail[U UserType](ctx context.Context, col *mongo.Collection, email string, source slog.Attr) (user U, err error) {
	Logger.InfoContext(ctx, "Finding user by Email", slog.String("Email", email), source)
	filter := bson.D{{Key: "email", Value: email}}

	if err = col.FindOne(ctx, filter).Decode(&user); err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			Logger.ErrorContext(ctx, "user not found", slog.String("email", email), source)
			err = fmt.Errorf("user with email %s not found", email)
			return
		}
		Logger.ErrorContext(ctx, "Error finding user by email", slog.Any("error", err), source)
		return
	}

	Logger.InfoContext(ctx, "Vendor found successfully", slog.String("email", email), source)
	return
}

func findContainer[C containers](ctx context.Context, col *mongo.Collection, id ID, container string, source slog.Attr) (C, error) {
	Logger.InfoContext(ctx, "Finding container array", slog.String("Array", container), source)
	filter := bson.D{{Key: "_id", Value: id.value}}
	projection := bson.D{{Key: container, Value: 1}, {Key: "_id", Value: 0}}

	res := col.FindOne(ctx, filter, options.FindOne().SetProjection(projection))
	if err := res.Err(); err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			Logger.ErrorContext(ctx, "User not found", slog.String("ID", id.String()), source)
			return nil, fmt.Errorf("user with ID %s not found", id.String())
		}
		Logger.ErrorContext(ctx, "Error finding container", slog.String("Array", container), slog.Any("error", err), source)
		return nil, err
	}

	var rawDoc bson.Raw
	if err := res.Decode(&rawDoc); err != nil {
		Logger.ErrorContext(ctx, "Error in decoding to raw document", slog.Any("error", err), source)
		return nil, err
	}

	var containerArray C
	rawValue := rawDoc.Lookup(container)
	if rawValue.Type == bson.TypeNull {
		Logger.ErrorContext(ctx, "Container not found in document", slog.String("Array", container), source)
		return nil, fmt.Errorf("container %s not found in document", container)
	}

	if err := bson.Unmarshal(rawValue.Value, &containerArray); err != nil {
		Logger.ErrorContext(ctx, "Error unmarshaling container data", slog.Any("error", err), source)
		return nil, err
	}
	Logger.InfoContext(ctx, "Container found successfully", slog.Any("Array", fmt.Sprintf("%+v", containerArray)), source)
	return containerArray, nil
}
