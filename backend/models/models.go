package models

import (
	"go.mongodb.org/mongo-driver/v2/bson"
)

// ListItem represents an item in a shopping list
type ListItem struct {
	IngredientID   bson.ObjectID `bson:"ingredient_id" json:"ingredient_id"`
	IngredientName string        `bson:"ingredient_name" json:"ingredient_name"`
	Quantity       float64       `bson:"quantity" json:"quantity"`
}

// List represents the List collection
type List struct {
	ID     bson.ObjectID `bson:"_id,omitempty" json:"list_id"`
	UserID bson.ObjectID `bson:"user_id" json:"user_id"`
	Items  []ListItem    `bson:"items" json:"items"`
}

// GeoJSON represents geographic coordinates for store locations

// OperatingHours represents store operating hours
type OperatingHours struct {
	OpenTime  string `bson:"open_time" json:"open_time"`
	CloseTime string `bson:"close_time" json:"close_time"`
}

// InventoryItem represents an item in a store's inventory

// CartItem represents an item in a cart
type CartItem struct {
	IngredientID   bson.ObjectID `bson:"ingredient_id" json:"ingredient_id"`
	IngredientName string        `bson:"ingredient_name" json:"ingredient_name"`
	Quantity       float64       `bson:"quantity" json:"quantity"`
	Status         string        `bson:"status" json:"status"`
}

// Cart represents the Cart collection
type Cart struct {
	ID         bson.ObjectID `bson:"_id,omitempty" json:"cart_id"`
	StoreID    bson.ObjectID `bson:"store_id" json:"store_id"`
	UserID     bson.ObjectID `bson:"user_id" json:"user_id"`
	TotalPrice float64       `bson:"total_price" json:"total_price"`
	CartStatus string        `bson:"cart_status" json:"cart_status"`
	Items      []CartItem    `bson:"items" json:"items"`
}

// OrderItem represents an item in an order
type OrderItem struct {
	IngredientID   bson.ObjectID `bson:"ingredient_id" json:"ingredient_id"`
	IngredientName string        `bson:"ingredient_name" json:"ingredient_name"`
	Quantity       float64       `bson:"quantity" json:"quantity"`
	Price          float64       `bson:"price" json:"price"`
	StoreID        bson.ObjectID `bson:"store_id" json:"store_id"`
}

// Order represents the Orders collection
type Order struct {
	ID             bson.ObjectID   `bson:"_id,omitempty" json:"order_id"`
	UserID         bson.ObjectID   `bson:"user_id" json:"user_id"`
	StoreIDs       []bson.ObjectID `bson:"store_ids" json:"store_ids"`
	Items          []OrderItem     `bson:"items" json:"items"`
	DeliveryMethod string          `bson:"delivery_method" json:"delivery_method"`
	OrderStatus    string          `bson:"order_status" json:"order_status"`
	TotalPrice     float64         `bson:"total_price" json:"total_price"`
	PaymentStatus  string          `bson:"payment_status" json:"payment_status"`
}

// Vendor represents the Vendors collection
type Vendor struct {
	ID      bson.ObjectID `bson:"_id,omitempty" json:"vendor_id"`
	UserID  bson.ObjectID `bson:"user_id" json:"user_id"`
	StoreID bson.ObjectID `bson:"store_id" json:"store_id"`
}

// Item represents the Items collection
type Item struct {
	ID              bson.ObjectID `bson:"_id,omitempty" json:"ingredient_id"`
	IngredientName  string        `bson:"ingredient_name" json:"ingredient_name"`
	MeasurementUnit float64       `bson:"measurement_unit" json:"measurement_unit"`
}

// UserCredentials is used for login requests
type UserCredentials struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// LoginResponse is returned after successful authentication
type LoginResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}
