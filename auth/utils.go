package main

import (
	"context"
	"log/slog"

	"go.mongodb.org/mongo-driver/v2/bson"
)

func isValidRole(role string) bool {
	return role == "admin" || role == "user" || role == "vendor"
}

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
