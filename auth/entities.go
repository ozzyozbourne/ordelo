package main

import (
	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/v2/bson"
)

type ID struct {
	value bson.ObjectID
}

type Claims struct {
	UserID string `json:"user_id"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

type Common struct {
	ID           bson.ObjectID `bson:"_id,omitempty" json:"user_id"`
	Name         string        `bson:"name" json:"name"`
	Address      string        `bson:"address" json:"address"`
	Email        string        `bson:"email" json:"email"`
	PasswordHash string        `bson:"password_hash" json:"password_hash,omitempty"`
	Role         string        `bson:"role" json:"role"`
}

type User struct {
	Common
	SavedRecipes []*Recipe    `bson:"saved_recipes" json:"saved_recipes"`
	Carts        []*Cart      `bson:"carts" json:"carts"`
	Orders       []*UserOrder `bson:"orders" json:"orders"`
}

type Vendor struct {
	Common
	Stores []*Store       `bson:"stores" json:"stores"`
	Orders []*VendorOrder `bson:"orders" json:"orders"`
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
	Unit         string        `bson:"unit" json:"unit"`
	Price        float64       `bson:"price" json:"price"`
}

type Item struct {
	Ingredient
	Unit int `bson:"unit" json:"unit"`
}

type Cart struct {
	ID         bson.ObjectID `bson:"_id,omitempty" json:"cart_id"`
	VendorID   bson.ObjectID `bson:"vendor_id" json:"vendor_id"`
	StoreID    bson.ObjectID `bson:"store_id" json:"store_id"`
	TotalPrice float64       `bson:"total_price" json:"total_price"`
	CartStatus string        `bson:"cart_status" json:"cart_status"`
	Items      []*Item       `bson:"items" json:"items"`
}

type UserOrder struct {
	Order
	VendorID      bson.ObjectID `bson:"vendor_id" json:"vendor_id"`
	PaymentStatus string        `bson:"payment_status" json:"payment_status"`
}

type VendorOrder struct {
	Order
	UserID bson.ObjectID `bson:"user_id" json:"user_id"`
}

type Order struct {
	ID             bson.ObjectID `bson:"_id,omitempty" json:"order_id"`
	StoreID        bson.ObjectID `bson:"store_id" json:"store_id"`
	Items          []*Item       `bson:"items" json:"items"`
	DeliveryMethod string        `bson:"delivery_method" json:"delivery_method"`
	OrderStatus    string        `bson:"order_status" json:"order_status"`
	TotalPrice     float64       `bson:"total_price" json:"total_price"`
}

type Store struct {
	ID        bson.ObjectID `bson:"_id,omitempty" json:"store_id"`
	Name      string        `bson:"name" json:"name"`
	StoreType string        `bson:"store_type" json:"store_type"`
	Location  GeoJSON       `bson:"location" json:"location"`
	Items     []*Item       `bson:"items" json:"items"`
}

type GeoJSON struct {
	Type        string    `bson:"type" json:"type"`
	Coordinates []float64 `bson:"coordinates" json:"coordinates"`
}
