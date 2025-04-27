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
	Carts        []*Cart       `bson:"carts" json:"carts"`
	Orders       []*UserOrder  `bson:"orders" json:"orders"`
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
	ID            bson.ObjectID  `bson:"_id,omitempty" json:"user_id"`
	VendorName    string         `bson:"vendor_name" json:"vendor_name"`
	VendorAddress string         `bson:"vendor_address" json:"vendor_address"`
	Email         string         `bson:"email" json:"email"`
	PasswordHash  string         `bson:"password_hash" json:"password_hash,omitempty"`
	Stores        []*Store       `bson:"stores" json:"stores"`
	Orders        []*VendorOrder `bson:"orders" json:"orders"`
	Role          string         `bson:"role" json:"role"`
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

type UserOrder struct {
	ID             bson.ObjectID `bson:"_id,omitempty" json:"order_id"`
	VendorID       bson.ObjectID `bson:"vendor_id" json:"vendor_id"`
	StoreID        bson.ObjectID `bson:"store_id" json:"store_id"`
	Items          []OrderItem   `bson:"items" json:"items"`
	DeliveryMethod string        `bson:"delivery_method" json:"delivery_method"`
	OrderStatus    string        `bson:"order_status" json:"order_status"`
	TotalPrice     float64       `bson:"total_price" json:"total_price"`
	PaymentStatus  string        `bson:"payment_status" json:"payment_status"`
}

type VendorOrder struct {
	ID             bson.ObjectID `bson:"_id,omitempty" json:"order_id"`
	UserID         bson.ObjectID `bson:"user_id" json:"user_id"`
	StoreID        bson.ObjectID `bson:"store_id" json:"store_id"`
	Items          []OrderItem   `bson:"items" json:"items"`
	DeliveryMethod string        `bson:"delivery_method" json:"delivery_method"`
	OrderStatus    string        `bson:"order_status" json:"order_status"`
	TotalPrice     float64       `bson:"total_price" json:"total_price"`
}

type OrderItem struct {
	IngredientID   bson.ObjectID `bson:"ingredient_id" json:"ingredient_id"`
	IngredientName string        `bson:"ingredient_name" json:"ingredient_name"`
	Quantity       float64       `bson:"quantity" json:"quantity"`
	Price          float64       `bson:"price" json:"price"`
	StoreID        bson.ObjectID `bson:"store_id" json:"store_id"`
}

type Cart struct {
	ID         bson.ObjectID `bson:"_id,omitempty" json:"cart_id"`
	VendorID   bson.ObjectID `bson:"vendor_id" json:"vendor_id"`
	StoreID    bson.ObjectID `bson:"store_id" json:"store_id"`
	TotalPrice float64       `bson:"total_price" json:"total_price"`
	CartStatus string        `bson:"cart_status" json:"cart_status"`
	Items      []CartItem    `bson:"items" json:"items"`
}

type CartItem struct {
	IngredientID   bson.ObjectID `bson:"ingredient_id" json:"ingredient_id"`
	IngredientName string        `bson:"ingredient_name" json:"ingredient_name"`
	Quantity       float64       `bson:"quantity" json:"quantity"`
	Status         string        `bson:"status" json:"status"`
}
