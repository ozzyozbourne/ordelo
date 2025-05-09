package main

import (
	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/v2/bson"
)

// -----------------------------------------------------------------------
//
// ------------------------Basic types------------------------------------

type RequestRecipes struct {
	Recipes []*Recipe `json:"recipes"`
}

type RequestCarts struct {
	Carts []*Cart `json:"carts"`
}

type RequestUserOrders struct {
	Orders []*UserOrder `json:"orders"`
}

type RequestStores struct {
	Stores []*Store `json:"stores"`
}

type RequestVendorOrders struct {
	Orders []*VendorOrder `json:"orders"`
}

type ReqIngArray struct {
	Compare []*ReqIng `json:"compare"`
}

type ComConReq interface {
	RequestRecipes | RequestCarts | RequestUserOrders | RequestVendorOrders | RequestStores | ReqIngArray
}

type Login struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Role     string `json:"role"`
}

type ReqIng struct {
	Name         string `bson:"name" json:"name"`
	UnitQuantity int    `bson:"unit_quantity" json:"unit_quantity"`
	Unit         string `bson:"unit" json:"unit"`
}

type ResIng struct {
	ID     bson.ObjectID `bson:"_id,omitempty" json:"vendor_id"`
	Stores []*Store      `bson:"stores" json:"stores"`
}

type AcceptUserOrderReq struct {
	UserID      bson.ObjectID `bson:"_id" json:"user_id"`
	OrderID     bson.ObjectID `bson:"_id" json:"order_id"`
	OrderStatus string        `bson:"order_status" json:"order_status"`
}

type Claims struct {
	UserID  string `json:"user_id"`
	Role    string `json:"role"`
	Name    string `json:"name"`
	Address string `json:"address"`
	jwt.RegisteredClaims
}

type Ingredient struct {
	IngredientID bson.ObjectID `bson:"ingredient_id" json:"ingredient_id"`
	Name         string        `bson:"name" json:"name"`
	UnitQuantity int           `bson:"unit_quantity" json:"unit_quantity"` 
	Unit         string        `bson:"unit" json:"unit"`
	Price        float64       `bson:"price,omitempty" json:"price"`
}

type GeoJSON struct {
	Type        string    `bson:"type" json:"type"`
	Coordinates []float64 `bson:"coordinates" json:"coordinates"`
}

// -----------------------------------------------------------------------

// ------------------------Embedding--------------------------------------

type Order struct {
	ID             bson.ObjectID `bson:"_id,omitempty" json:"order_id"`
	StoreID        bson.ObjectID `bson:"store_id" json:"store_id"`
	DeliveryMethod string        `bson:"delivery_method" json:"delivery_method"`
	OrderStatus    string        `bson:"order_status" json:"order_status"`
	TotalPrice     float64       `bson:"total_price" json:"total_price"`
	Items          []*Item       `bson:"items" json:"items"`
}

type Common struct {
	ID           bson.ObjectID `bson:"_id,omitempty" json:"user_id"`
	Name         string        `bson:"name" json:"name"`
	Address      string        `bson:"address" json:"address"`
	Email        string        `bson:"email" json:"email"`
	PasswordHash string        `bson:"password_hash" json:"password_hash,omitempty"`
	Role         string        `bson:"role" json:"role"`
}

// ----------------------------------------------------------------------
//
// ---------------------------Embedded-Types------------------------------

type Item struct {
	Ingredient `bson:",inline"`
	Quantity   int `bson:"quantity" json:"quantity"`
}

type Admin struct {
	Common      `bson:",inline"`
	Ingredients []*Ingredient `bson:"ingredients" json:"ingredients"`
}

type UserOrder struct {
	Order         `bson:",inline"`
	VendorID      bson.ObjectID `bson:"vendor_id" json:"vendor_id"`
	PaymentStatus string        `bson:"payment_status" json:"payment_status"`
}

type VendorOrder struct {
	Order  `bson:",inline"`
	UserID bson.ObjectID `bson:"user_id" json:"user_id"`
}

// ----------------------------------------------------------------------
//
// -----------------------Composite-and-Embedded-Types-------------------
type User struct {
	Common       `bson:",inline"`
	SavedRecipes []*Recipe    `bson:"saved_recipes" json:"saved_recipes"`
	Carts        []*Cart      `bson:"carts" json:"carts"`
	Orders       []*UserOrder `bson:"orders" json:"orders"`
}

type Vendor struct {
	Common `bson:",inline"`
	Stores []*Store       `bson:"stores" json:"stores"`
	Orders []*VendorOrder `bson:"orders" json:"orders,omitempty"`
}

type Recipe struct {
	ID              bson.ObjectID `bson:"_id" json:"recipe_id"`
	Title           string        `bson:"title" json:"title"`
	Description     string        `bson:"description" json:"description"`
	PreparationTime int           `bson:"preparation_time" json:"preparation_time"`
	ServingSize     int           `bson:"serving_size" json:"serving_size"`
	Items           []*Item       `bson:"items" json:"items"`
}

type Cart struct {
	ID         bson.ObjectID `bson:"_id,omitempty" json:"cart_id"`
	VendorID   bson.ObjectID `bson:"vendor_id" json:"vendor_id"`
	StoreID    bson.ObjectID `bson:"store_id" json:"store_id"`
	TotalPrice float64       `bson:"total_price" json:"total_price"`
	Items      []*Item       `bson:"items" json:"items"`
}

type Store struct {
	ID        bson.ObjectID `bson:"_id,omitempty" json:"store_id"`
	Name      string        `bson:"name" json:"name"`
	StoreType string        `bson:"store_type" json:"store_type"`
	Location  *GeoJSON      `bson:"location" json:"location"`
	Items     []*Item       `bson:"items" json:"items"`
}

type DeleteReq struct {
	UserRole      string          `json:"user_role"`
	UserID        string          `json:"user_id"`
	ContainerName string          `json:"container_name"`
	DeleteItemIDs []bson.ObjectID `json:"delete_items_ids"`
}

// ----------------------------------------------------------------------

type NoItems struct{}

func (n *NoItems) Error() string {
	return "No items found"
}
