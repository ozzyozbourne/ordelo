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

// CreateOrder creates a new order
func CreateOrder(w http.ResponseWriter, r *http.Request) {
	var order models.Order

	if err := json.NewDecoder(r.Body).Decode(&order); err != nil {
		sendResponse(w, http.StatusBadRequest, "Invalid request body", "")
		return
	}

	// Validate required fields
	if order.UserID.IsZero() || len(order.Items) == 0 {
		sendResponse(w, http.StatusBadRequest, "User ID and items are required", "")
		return
	}

	// Set ID and default values
	order.ID = bson.NewObjectID()
	if order.OrderStatus == "" {
		order.OrderStatus = "pending"
	}
	if order.PaymentStatus == "" {
		order.PaymentStatus = "pending"
	}

	// Extract store IDs from items (if not provided)
	if len(order.StoreIDs) == 0 {
		storeIDsMap := make(map[string]bool)
		for _, item := range order.Items {
			if !item.StoreID.IsZero() {
				storeIDsMap[item.StoreID.Hex()] = true
			}
		}

		for storeIDHex := range storeIDsMap {
			storeID, err := bson.ObjectIDFromHex(storeIDHex)
			if err == nil {
				order.StoreIDs = append(order.StoreIDs, storeID)
			}
		}
	}

	// Calculate total price
	totalPrice := 0.0
	for _, item := range order.Items {
		totalPrice += item.Price * item.Quantity
	}
	order.TotalPrice = totalPrice

	// Insert into database
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := db.OrdersCollection.InsertOne(ctx, order)
	if err != nil {
		log.Printf("Error creating order: %v\n", err)
		sendResponse(w, http.StatusInternalServerError, "Error creating order", "")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(order)
}

// GetOrder retrieves an order by ID
func GetOrder(w http.ResponseWriter, r *http.Request) {
	// Extract order ID from URL
	pathParts := strings.Split(r.URL.Path, "/")
	orderHex := pathParts[len(pathParts)-1]

	orderId, err := bson.ObjectIDFromHex(orderHex)
	if err != nil {
		sendResponse(w, http.StatusBadRequest, "Invalid order ID format", "")
		return
	}

	// Get order from database
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var order models.Order
	err = db.OrdersCollection.FindOne(ctx, bson.M{"_id": orderId}).Decode(&order)
	if err != nil {
		sendResponse(w, http.StatusNotFound, "Order not found", "")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(order)
}

// UpdateOrder updates an order
func UpdateOrder(w http.ResponseWriter, r *http.Request) {
	// Extract order ID from URL
	pathParts := strings.Split(r.URL.Path, "/")
	orderHex := pathParts[len(pathParts)-1]

	orderId, err := bson.ObjectIDFromHex(orderHex)
	if err != nil {
		sendResponse(w, http.StatusBadRequest, "Invalid order ID format", "")
		return
	}

	// Decode request body
	var updateData models.Order
	if err := json.NewDecoder(r.Body).Decode(&updateData); err != nil {
		sendResponse(w, http.StatusBadRequest, "Invalid request body", "")
		return
	}

	// Build update document
	updateDoc := bson.M{}

	if updateData.OrderStatus != "" {
		updateDoc["order_status"] = updateData.OrderStatus
	}

	if updateData.PaymentStatus != "" {
		updateDoc["payment_status"] = updateData.PaymentStatus
	}

	if updateData.DeliveryMethod != "" {
		updateDoc["delivery_method"] = updateData.DeliveryMethod
	}

	// Only update items if provided
	if len(updateData.Items) > 0 {
		updateDoc["items"] = updateData.Items

		// Recalculate total price
		totalPrice := 0.0
		for _, item := range updateData.Items {
			totalPrice += item.Price * item.Quantity
		}
		updateDoc["total_price"] = totalPrice
	}

	// Only update if there are fields to update
	if len(updateDoc) == 0 {
		sendResponse(w, http.StatusBadRequest, "No valid fields to update", "")
		return
	}

	// Update in database
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	result, err := db.OrdersCollection.UpdateOne(
		ctx,
		bson.M{"_id": orderId},
		bson.M{"$set": updateDoc},
	)

	if err != nil {
		log.Printf("Error updating order: %v\n", err)
		sendResponse(w, http.StatusInternalServerError, "Error updating order", "")
		return
	}

	if result.MatchedCount == 0 {
		sendResponse(w, http.StatusNotFound, "Order not found", "")
		return
	}

	sendResponse(w, http.StatusOK, "Order updated successfully", "")
}

// DeleteOrder deletes an order
func DeleteOrder(w http.ResponseWriter, r *http.Request) {
	// Extract order ID from URL
	pathParts := strings.Split(r.URL.Path, "/")
	orderHex := pathParts[len(pathParts)-1]

	orderId, err := bson.ObjectIDFromHex(orderHex)
	if err != nil {
		sendResponse(w, http.StatusBadRequest, "Invalid order ID format", "")
		return
	}

	// Delete from database
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	result, err := db.OrdersCollection.DeleteOne(ctx, bson.M{"_id": orderId})
	if err != nil {
		log.Printf("Error deleting order: %v\n", err)
		sendResponse(w, http.StatusInternalServerError, "Error deleting order", "")
		return
	}

	if result.DeletedCount == 0 {
		sendResponse(w, http.StatusNotFound, "Order not found", "")
		return
	}

	sendResponse(w, http.StatusOK, "Order deleted successfully", "")
}

// GetUserOrders retrieves all orders for a user
func GetUserOrders(w http.ResponseWriter, r *http.Request) {
	// Extract user ID from URL
	pathParts := strings.Split(r.URL.Path, "/")
	userHex := pathParts[len(pathParts)-2]

	userId, err := bson.ObjectIDFromHex(userHex)
	if err != nil {
		sendResponse(w, http.StatusBadRequest, "Invalid user ID format", "")
		return
	}

	// Get orders from database
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	cursor, err := db.OrdersCollection.Find(ctx, bson.M{"user_id": userId})
	if err != nil {
		log.Printf("Error retrieving user orders: %v\n", err)
		sendResponse(w, http.StatusInternalServerError, "Error retrieving user orders", "")
		return
	}
	defer cursor.Close(ctx)

	var orders []models.Order
	if err = cursor.All(ctx, &orders); err != nil {
		log.Printf("Error decoding user orders: %v\n", err)
		sendResponse(w, http.StatusInternalServerError, "Error decoding user orders", "")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(orders)
}

// GetStoreOrders retrieves all orders for a store
func GetStoreOrders(w http.ResponseWriter, r *http.Request) {
	// Extract store ID from URL
	pathParts := strings.Split(r.URL.Path, "/")
	storeHex := pathParts[len(pathParts)-2]

	storeId, err := bson.ObjectIDFromHex(storeHex)
	if err != nil {
		sendResponse(w, http.StatusBadRequest, "Invalid store ID format", "")
		return
	}

	// Get orders from database
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	cursor, err := db.OrdersCollection.Find(ctx, bson.M{"store_ids": storeId})
	if err != nil {
		log.Printf("Error retrieving store orders: %v\n", err)
		sendResponse(w, http.StatusInternalServerError, "Error retrieving store orders", "")
		return
	}
	defer cursor.Close(ctx)

	var orders []models.Order
	if err = cursor.All(ctx, &orders); err != nil {
		log.Printf("Error decoding store orders: %v\n", err)
		sendResponse(w, http.StatusInternalServerError, "Error decoding store orders", "")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(orders)
}
