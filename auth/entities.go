package main

import (
	"time"

	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/v2/bson"
)

type Claims struct {
	UserID string `json:"user_id"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

type AuthService struct {
	userRepo      UserRepository
	jwtSecret     []byte
	accessExpiry  time.Duration
	refreshExpiry time.Duration
	refreshSecret []byte
}

type User struct {
	ID           bson.ObjectID `bson:"_id,omitempty" json:"user_id"`
	UserName     string        `bson:"user_name" json:"user_name"`
	UserAddress  string        `bson:"user_address" json:"user_address"`
	Email        string        `bson:"email" json:"email"`
	PasswordHash string        `bson:"password_hash" json:"password_hash,omitempty"`
	SavedRecipes []Recipe      `bson:"saved_recipes" json:"saved_recipes"`
	Role         string        `bson:"role" json:"role"`
}

type Recipe struct {
	ID              bson.ObjectID `bson:"_id" json:"recipe_id"`
	Title           string        `bson:"title" json:"title"`
	Ingredients     []Ingredient  `bson:"ingredients" json:"ingredients"`
	Description     string        `bson:"description" json:"description"`
	PreparationTime int           `bson:"preparation_time" json:"preparation_time"`
	ServingSize     int           `bson:"serving_size" json:"serving_size"`
}

type Ingredient struct {
	IngredientID bson.ObjectID `bson:"ingredient_id" json:"ingredient_id"`
	Name         string        `bson:"name" json:"name"`
	Quantity     float64       `bson:"quantity" json:"quantity"`
	Unit         string        `bson:"unit" json:"unit"`
}
