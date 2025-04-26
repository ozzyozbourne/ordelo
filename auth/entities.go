package main

import (
	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/v2/bson"
)

type Claims struct {
	UserID string `json:"user_id"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

type User struct {
	ID           bson.ObjectID `bson:"_id,omitempty" json:"user_id"`
	UserName     string        `bson:"user_name" json:"user_name"`
	UserAddress  string        `bson:"user_address" json:"user_address"`
	Email        string        `bson:"email" json:"email"`
	PasswordHash string        `bson:"password_hash" json:"password_hash,omitempty"`
	SavedRecipes []*Recipe     `bson:"saved_recipes" json:"saved_recipes"`
	Role         string        `bson:"role" json:"role"`
}

type Recipe struct {
	ID              bson.ObjectID `bson:"_id" json:"recipe_id"`
	Title           string        `bson:"title" json:"title"`
	Ingredients     []*Ingredient `bson:"ingredients" json:"ingredients"`
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

type Vendor struct {
	ID            bson.ObjectID `bson:"_id,omitempty" json:"user_id"`
	VendorName    string        `bson:"vendor_name" json:"vendor_name"`
	VendorAddress string        `bson:"vendor_address" json:"vendor_address"`
	Email         string        `bson:"email" json:"email"`
	PasswordHash  string        `bson:"password_hash" json:"password_hash,omitempty"`
	Stores        []*Store      `bson:"stores" json:"stores"`
	Role          string        `bson:"role" json:"role"`
}

type Store struct {
	ID        bson.ObjectID   `bson:"_id,omitempty" json:"store_id"`
	Name      string          `bson:"name" json:"name"`
	StoreType string          `bson:"store_type" json:"store_type"`
	Location  GeoJSON         `bson:"location" json:"location"`
	Inventory []InventoryItem `bson:"inventory" json:"inventory"`
}

type InventoryItem struct {
	ID       bson.ObjectID `bson:"_id,omitempty" json:"ingredient_id"`
	Name     string        `bson:"name" json:"name"`
	Price    float64       `bson:"price" json:"price"`
	Quantity float64       `bson:"quantity" json:"quantity"`
	Category string        `bson:"category" json:"category"`
}

type GeoJSON struct {
	Type        string    `bson:"type" json:"type"`
	Coordinates []float64 `bson:"coordinates" json:"coordinates"`
}
