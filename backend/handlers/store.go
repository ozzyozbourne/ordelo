package handlers

import (
	"context"
	"encoding/json"
	"go.mongodb.org/mongo-driver/v2/bson"
	"log"
	"net/http"
	"ordelo/db"
	"ordelo/models"
	"strconv"
	"strings"
	"time"
)

// CreateStore creates a new store
func CreateStore(w http.ResponseWriter, r *http.Request) {
	var store models.Store

	if err := json.NewDecoder(r.Body).Decode(&store); err != nil {
		sendResponse(w, http.StatusBadRequest, "Invalid request body", "")
		return
	}

	// Validate required fields
	if store.Name == "" || store.StoreType == "" {
		sendResponse(w, http.StatusBadRequest, "Name and store type are required", "")
		return
	}

	// Validate location field
	if store.Location.Type == "" || len(store.Location.Coordinates) != 2 {
		sendResponse(w, http.StatusBadRequest, "Valid GeoJSON location is required", "")
		return
	}

	// Set ID
	store.ID = bson.NewObjectID()

	// Ensure inventory item IDs are set
	for i := range store.Inventory {
		if store.Inventory[i].IngredientID.IsZero() {
			store.Inventory[i].IngredientID = bson.NewObjectID()
		}
	}

	// Insert into database
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := db.StoresCollection.InsertOne(ctx, store)
	if err != nil {
		log.Printf("Error creating store: %v\n", err)
		sendResponse(w, http.StatusInternalServerError, "Error creating store", "")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(store)
}

// GetStore retrieves a store by ID
func GetStore(w http.ResponseWriter, r *http.Request) {
	// Extract store ID from URL
	pathParts := strings.Split(r.URL.Path, "/")
	storeHex := pathParts[len(pathParts)-1]

	storeId, err := bson.ObjectIDFromHex(storeHex)
	if err != nil {
		sendResponse(w, http.StatusBadRequest, "Invalid store ID format", "")
		return
	}

	// Get store from database
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var store models.Store
	err = db.StoresCollection.FindOne(ctx, bson.M{"_id": storeId}).Decode(&store)
	if err != nil {
		sendResponse(w, http.StatusNotFound, "Store not found", "")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(store)
}

// UpdateStore updates a store
func UpdateStore(w http.ResponseWriter, r *http.Request) {
	// Extract store ID from URL
	pathParts := strings.Split(r.URL.Path, "/")
	storeHex := pathParts[len(pathParts)-1]

	storeId, err := bson.ObjectIDFromHex(storeHex)
	if err != nil {
		sendResponse(w, http.StatusBadRequest, "Invalid store ID format", "")
		return
	}

	// Decode request body
	var updateData models.Store
	if err := json.NewDecoder(r.Body).Decode(&updateData); err != nil {
		sendResponse(w, http.StatusBadRequest, "Invalid request body", "")
		return
	}

	// Build update document
	updateDoc := bson.M{}

	if updateData.Name != "" {
		updateDoc["name"] = updateData.Name
	}

	if updateData.StoreType != "" {
		updateDoc["store_type"] = updateData.StoreType
	}

	// Only update location if both type and coordinates are provided
	if updateData.Location.Type != "" && len(updateData.Location.Coordinates) == 2 {
		updateDoc["location"] = updateData.Location
	}

	// Update operating hours if provided
	if updateData.OperatingHours.OpenTime != "" && updateData.OperatingHours.CloseTime != "" {
		updateDoc["operating_hours"] = updateData.OperatingHours
	}

	// Only update inventory if provided
	if len(updateData.Inventory) > 0 {
		// Ensure inventory item IDs are set
		for i := range updateData.Inventory {
			if updateData.Inventory[i].IngredientID.IsZero() {
				updateData.Inventory[i].IngredientID = bson.NewObjectID()
			}
		}
		updateDoc["inventory"] = updateData.Inventory
	}

	// Only update if there are fields to update
	if len(updateDoc) == 0 {
		sendResponse(w, http.StatusBadRequest, "No valid fields to update", "")
		return
	}

	// Update in database
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	result, err := db.StoresCollection.UpdateOne(
		ctx,
		bson.M{"_id": storeId},
		bson.M{"$set": updateDoc},
	)

	if err != nil {
		log.Printf("Error updating store: %v\n", err)
		sendResponse(w, http.StatusInternalServerError, "Error updating store", "")
		return
	}

	if result.MatchedCount == 0 {
		sendResponse(w, http.StatusNotFound, "Store not found", "")
		return
	}

	sendResponse(w, http.StatusOK, "Store updated successfully", "")
}

// DeleteStore deletes a store
func DeleteStore(w http.ResponseWriter, r *http.Request) {
	// Extract store ID from URL
	pathParts := strings.Split(r.URL.Path, "/")
	storeHex := pathParts[len(pathParts)-1]

	storeId, err := bson.ObjectIDFromHex(storeHex)
	if err != nil {
		sendResponse(w, http.StatusBadRequest, "Invalid store ID format", "")
		return
	}

	// Delete from database
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	result, err := db.StoresCollection.DeleteOne(ctx, bson.M{"_id": storeId})
	if err != nil {
		log.Printf("Error deleting store: %v\n", err)
		sendResponse(w, http.StatusInternalServerError, "Error deleting store", "")
		return
	}

	if result.DeletedCount == 0 {
		sendResponse(w, http.StatusNotFound, "Store not found", "")
		return
	}

	sendResponse(w, http.StatusOK, "Store deleted successfully", "")
}

// GetNearbyStores retrieves stores near a location
func GetNearbyStores(w http.ResponseWriter, r *http.Request) {
	// Parse longitude, latitude, and max distance from query parameters
	longitudeStr := r.URL.Query().Get("lon")
	latitudeStr := r.URL.Query().Get("lat")
	maxDistanceStr := r.URL.Query().Get("maxDistance")

	if longitudeStr == "" || latitudeStr == "" {
		sendResponse(w, http.StatusBadRequest, "Longitude and latitude are required", "")
		return
	}

	longitude, err := strconv.ParseFloat(longitudeStr, 64)
	if err != nil {
		sendResponse(w, http.StatusBadRequest, "Invalid longitude format", "")
		return
	}

	latitude, err := strconv.ParseFloat(latitudeStr, 64)
	if err != nil {
		sendResponse(w, http.StatusBadRequest, "Invalid latitude format", "")
		return
	}

	// Default max distance to 10km if not provided
	maxDistance := 10000.0
	if maxDistanceStr != "" {
		if parsedDist, err := strconv.ParseFloat(maxDistanceStr, 64); err == nil && parsedDist > 0 {
			maxDistance = parsedDist
		}
	}

	// Create geospatial query
	query := bson.M{
		"location": bson.M{
			"$near": bson.M{
				"$geometry": bson.M{
					"type":        "Point",
					"coordinates": []float64{longitude, latitude},
				},
				"$maxDistance": maxDistance,
			},
		},
	}

	// Execute query
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	cursor, err := db.StoresCollection.Find(ctx, query)
	if err != nil {
		log.Printf("Error retrieving nearby stores: %v\n", err)
		sendResponse(w, http.StatusInternalServerError, "Error retrieving nearby stores", "")
		return
	}
	defer cursor.Close(ctx)

	var stores []models.Store
	if err = cursor.All(ctx, &stores); err != nil {
		log.Printf("Error decoding stores: %v\n", err)
		sendResponse(w, http.StatusInternalServerError, "Error decoding stores", "")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(stores)
}
