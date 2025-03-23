package main

import (
	"go.mongodb.org/mongo-driver/v2/bson"
	"time"
)

// User represents the Users collection
type User struct {
	ID           bson.ObjectID   `bson:"_id,omitempty" json:"user_id"`
	UserName     string          `bson:"user_name" json:"user_name"`
	UserAddress  string          `bson:"user_address" json:"user_address"`
	Email        string          `bson:"email" json:"email"`
	PasswordHash string          `bson:"password_hash" json:"password_hash,omitempty"`
	SavedRecipes []bson.ObjectID `bson:"saved_recipes" json:"saved_recipes"`
	Role         string          `bson:"role" json:"role"`
	CreatedAt    time.Time       `bson:"created_at" json:"created_at"`
}

// response
type APIReponse struct {
	Status  int    `json:"status"`
	Message string `json:"message"`
	Data    any    `json:"data,omnitempty"`
}
