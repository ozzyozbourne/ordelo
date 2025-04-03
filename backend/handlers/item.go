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

// CreateItem creates a new item
func CreateItem(w http.ResponseWriter, r *http.Request) {
	var item models.Item

	if err := json.NewDecoder(r.Body).Decode(&item); err != nil {
		sendResponse(w, http.StatusBadRequest, "Invalid request body", "")
		return
	}

	// Validate required fields
	if item.IngredientName == "" {
		sendResponse(w, http.StatusBadRequest, "Ingredient name is required", "")
		return
	}

	// Set ID
	item.ID = bson.NewObjectID()

	// Insert into database
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := db.ItemsCollection.InsertOne(ctx, item)
	if err != nil {
		log.Printf("Error creating item: %v\n", err)
		sendResponse(w, http.StatusInternalServerError, "Error creating item", "")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(item)
}

// GetItem retrieves an item by ID
func GetItem(w http.ResponseWriter, r *http.Request) {
	// Extract item ID from URL
	pathParts := strings.Split(r.URL.Path, "/")
	itemHex := pathParts[len(pathParts)-1]

	itemId, err := bson.ObjectIDFromHex(itemHex)
	if err != nil {
		sendResponse(w, http.StatusBadRequest, "Invalid item ID format", "")
		return
	}

	// Get item from database
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var item models.Item
	err = db.ItemsCollection.FindOne(ctx, bson.M{"_id": itemId}).Decode(&item)
	if err != nil {
		sendResponse(w, http.StatusNotFound, "Item not found", "")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(item)
}

// UpdateItem updates an item
func UpdateItem(w http.ResponseWriter, r *http.Request) {
	// Extract item ID from URL
	pathParts := strings.Split(r.URL.Path, "/")
	itemHex := pathParts[len(pathParts)-1]

	itemId, err := bson.ObjectIDFromHex(itemHex)
	if err != nil {
		sendResponse(w, http.StatusBadRequest, "Invalid item ID format", "")
		return
	}

	// Decode request body
	var updateData models.Item
	if err := json.NewDecoder(r.Body).Decode(&updateData); err != nil {
		sendResponse(w, http.StatusBadRequest, "Invalid request body", "")
		return
	}

	// Build update document
	updateDoc := bson.M{}

	if updateData.IngredientName != "" {
		updateDoc["ingredient_name"] = updateData.IngredientName
	}

	if updateData.MeasurementUnit != 0 {
		updateDoc["measurement_unit"] = updateData.MeasurementUnit
	}

	// Only update if there are fields to update
	if len(updateDoc) == 0 {
		sendResponse(w, http.StatusBadRequest, "No valid fields to update", "")
		return
	}

	// Update in database
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	result, err := db.ItemsCollection.UpdateOne(
		ctx,
		bson.M{"_id": itemId},
		bson.M{"$set": updateDoc},
	)

	if err != nil {
		log.Printf("Error updating item: %v\n", err)
		sendResponse(w, http.StatusInternalServerError, "Error updating item", "")
		return
	}

	if result.MatchedCount == 0 {
		sendResponse(w, http.StatusNotFound, "Item not found", "")
		return
	}

	sendResponse(w, http.StatusOK, "Item updated successfully", "")
}

// DeleteItem deletes an item
func DeleteItem(w http.ResponseWriter, r *http.Request) {
	// Extract item ID from URL
	pathParts := strings.Split(r.URL.Path, "/")
	itemHex := pathParts[len(pathParts)-1]

	itemId, err := bson.ObjectIDFromHex(itemHex)
	if err != nil {
		sendResponse(w, http.StatusBadRequest, "Invalid item ID format", "")
		return
	}

	// Delete from database
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	result, err := db.ItemsCollection.DeleteOne(ctx, bson.M{"_id": itemId})
	if err != nil {
		log.Printf("Error deleting item: %v\n", err)
		sendResponse(w, http.StatusInternalServerError, "Error deleting item", "")
		return
	}

	if result.DeletedCount == 0 {
		sendResponse(w, http.StatusNotFound, "Item not found", "")
		return
	}

	sendResponse(w, http.StatusOK, "Item deleted successfully", "")
}

// GetItems retrieves all items
func GetItems(w http.ResponseWriter, r *http.Request) {
	// Parse query parameters for filtering
	query := bson.M{}

	// Example: ?name=flour
	if name := r.URL.Query().Get("name"); name != "" {
		query["ingredient_name"] = bson.M{"$regex": name, "$options": "i"}
	}

	// Get items from database
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	cursor, err := db.ItemsCollection.Find(ctx, query)
	if err != nil {
		log.Printf("Error retrieving items: %v\n", err)
		sendResponse(w, http.StatusInternalServerError, "Error retrieving items", "")
		return
	}
	defer cursor.Close(ctx)

	var items []models.Item
	if err = cursor.All(ctx, &items); err != nil {
		log.Printf("Error decoding items: %v\n", err)
		sendResponse(w, http.StatusInternalServerError, "Error decoding items", "")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(items)
}
