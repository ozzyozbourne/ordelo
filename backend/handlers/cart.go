package handlers

import (
	"context"
	"encoding/json"
	"go.mongodb.org/mongo-driver/v2/bson"
	"log"
	"net/http"
	"ordelo/db"
	"ordelo/models"
	"strings"
	"time"
)

// CreateCart creates a new cart
func CreateCart(w http.ResponseWriter, r *http.Request) {
	var cart models.Cart

	if err := json.NewDecoder(r.Body).Decode(&cart); err != nil {
		sendResponse(w, http.StatusBadRequest, "Invalid request body", "")
		return
	}

	// Validate required fields
	if cart.UserID.IsZero() || cart.StoreID.IsZero() {
		sendResponse(w, http.StatusBadRequest, "User ID and Store ID are required", "")
		return
	}

	// Set ID and default status
	cart.ID = bson.NewObjectID()
	if cart.CartStatus == "" {
		cart.CartStatus = "draft"
	}

	// Calculate total price
	totalPrice := 0.0

	// Verify store exists and get item prices
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var store models.Store
	err := db.StoresCollection.FindOne(ctx, bson.M{"_id": cart.StoreID}).Decode(&store)
	if err != nil {
		sendResponse(w, http.StatusNotFound, "Store not found", "")
		return
	}

	// Create inventory map for quick lookup
	inventoryMap := make(map[string]models.InventoryItem)
	for _, item := range store.Inventory {
		inventoryMap[item.IngredientID.Hex()] = item
	}

	// Update prices and calculate total
	for i, item := range cart.Items {
		if inventoryItem, exists := inventoryMap[item.IngredientID.Hex()]; exists {
			// Add store price to cart item
			totalPrice += inventoryItem.Price * item.Quantity
		} else {
			// If item not found in store, set status to "unavailable"
			cart.Items[i].Status = "unavailable"
		}
	}

	cart.TotalPrice = totalPrice

	// Insert into database
	_, err = db.CartsCollection.InsertOne(ctx, cart)
	if err != nil {
		log.Printf("Error creating cart: %v\n", err)
		sendResponse(w, http.StatusInternalServerError, "Error creating cart", "")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(cart)
}

// GetCart retrieves a cart by ID
func GetCart(w http.ResponseWriter, r *http.Request) {
	// Extract cart ID from URL
	pathParts := strings.Split(r.URL.Path, "/")
	cartHex := pathParts[len(pathParts)-1]

	cartId, err := bson.ObjectIDFromHex(cartHex)
	if err != nil {
		sendResponse(w, http.StatusBadRequest, "Invalid cart ID format", "")
		return
	}

	// Get cart from database
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var cart models.Cart
	err = db.CartsCollection.FindOne(ctx, bson.M{"_id": cartId}).Decode(&cart)
	if err != nil {
		sendResponse(w, http.StatusNotFound, "Cart not found", "")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(cart)
}

// UpdateCart updates a cart
func UpdateCart(w http.ResponseWriter, r *http.Request) {
	// Extract cart ID from URL
	pathParts := strings.Split(r.URL.Path, "/")
	cartHex := pathParts[len(pathParts)-1]

	cartId, err := bson.ObjectIDFromHex(cartHex)
	if err != nil {
		sendResponse(w, http.StatusBadRequest, "Invalid cart ID format", "")
		return
	}

	// Get existing cart
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var existingCart models.Cart
	err = db.CartsCollection.FindOne(ctx, bson.M{"_id": cartId}).Decode(&existingCart)
	if err != nil {
		sendResponse(w, http.StatusNotFound, "Cart not found", "")
		return
	}

	// Decode request body
	var updateData models.Cart
	if err := json.NewDecoder(r.Body).Decode(&updateData); err != nil {
		sendResponse(w, http.StatusBadRequest, "Invalid request body", "")
		return
	}

	// Build update document
	updateDoc := bson.M{}

	// Update cart status if provided
	if updateData.CartStatus != "" {
		updateDoc["cart_status"] = updateData.CartStatus
	}

	// Only update items if provided
	if len(updateData.Items) > 0 {
		updateDoc["items"] = updateData.Items

		// Recalculate total price
		var store models.Store
		err := db.StoresCollection.FindOne(ctx, bson.M{"_id": existingCart.StoreID}).Decode(&store)
		if err == nil {
			// Create inventory map for quick lookup
			inventoryMap := make(map[string]models.InventoryItem)
			for _, item := range store.Inventory {
				inventoryMap[item.IngredientID.Hex()] = item
			}

			// Calculate new total price
			totalPrice := 0.0
			for _, item := range updateData.Items {
				if inventoryItem, exists := inventoryMap[item.IngredientID.Hex()]; exists {
					totalPrice += inventoryItem.Price * item.Quantity
				}
			}

			updateDoc["total_price"] = totalPrice
		}
	}

	// Only update if there are fields to update
	if len(updateDoc) == 0 {
		sendResponse(w, http.StatusBadRequest, "No valid fields to update", "")
		return
	}

	// Update in database
	result, err := db.CartsCollection.UpdateOne(
		ctx,
		bson.M{"_id": cartId},
		bson.M{"$set": updateDoc},
	)

	if err != nil {
		log.Printf("Error updating cart: %v\n", err)
		sendResponse(w, http.StatusInternalServerError, "Error updating cart", "")
		return
	}

	if result.MatchedCount == 0 {
		sendResponse(w, http.StatusNotFound, "Cart not found", "")
		return
	}

	sendResponse(w, http.StatusOK, "Cart updated successfully", "")
}

// DeleteCart deletes a cart
func DeleteCart(w http.ResponseWriter, r *http.Request) {
	// Extract cart ID from URL
	pathParts := strings.Split(r.URL.Path, "/")
	cartHex := pathParts[len(pathParts)-1]

	cartId, err := bson.ObjectIDFromHex(cartHex)
	if err != nil {
		sendResponse(w, http.StatusBadRequest, "Invalid cart ID format", "")
		return
	}

	// Delete from database
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	result, err := db.CartsCollection.DeleteOne(ctx, bson.M{"_id": cartId})
	if err != nil {
		log.Printf("Error deleting cart: %v\n", err)
		sendResponse(w, http.StatusInternalServerError, "Error deleting cart", "")
		return
	}

	if result.DeletedCount == 0 {
		sendResponse(w, http.StatusNotFound, "Cart not found", "")
		return
	}

	sendResponse(w, http.StatusOK, "Cart deleted successfully", "")
}

// GetUserCarts retrieves all carts for a user
func GetUserCarts(w http.ResponseWriter, r *http.Request) {
	// Extract user ID from URL
	pathParts := strings.Split(r.URL.Path, "/")
	userHex := pathParts[len(pathParts)-2]

	userId, err := bson.ObjectIDFromHex(userHex)
	if err != nil {
		sendResponse(w, http.StatusBadRequest, "Invalid user ID format", "")
		return
	}

	// Get carts from database
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	cursor, err := db.CartsCollection.Find(ctx, bson.M{"user_id": userId})
	if err != nil {
		log.Printf("Error retrieving user carts: %v\n", err)
		sendResponse(w, http.StatusInternalServerError, "Error retrieving user carts", "")
		return
	}
	defer cursor.Close(ctx)

	var carts []models.Cart
	if err = cursor.All(ctx, &carts); err != nil {
		log.Printf("Error decoding user carts: %v\n", err)
		sendResponse(w, http.StatusInternalServerError, "Error decoding user carts", "")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(carts)
}
