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

// CreateList creates a new shopping list
func CreateList(w http.ResponseWriter, r *http.Request) {
	var list models.List

	if err := json.NewDecoder(r.Body).Decode(&list); err != nil {
		sendResponse(w, http.StatusBadRequest, "Invalid request body", "")
		return
	}

	// Validate required fields
	if list.UserID.IsZero() {
		sendResponse(w, http.StatusBadRequest, "User ID is required", "")
		return
	}

	// Set ID
	list.ID = bson.NewObjectID()

	// Ensure item IDs are set
	for i := range list.Items {
		if list.Items[i].IngredientID.IsZero() {
			list.Items[i].IngredientID = bson.NewObjectID()
		}
	}

	// Insert into database
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := db.ListsCollection.InsertOne(ctx, list)
	if err != nil {
		log.Printf("Error creating list: %v\n", err)
		sendResponse(w, http.StatusInternalServerError, "Error creating list", "")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(list)
}

// GetList retrieves a shopping list by ID
func GetList(w http.ResponseWriter, r *http.Request) {
	// Extract list ID from URL
	pathParts := strings.Split(r.URL.Path, "/")
	listHex := pathParts[len(pathParts)-1]

	listId, err := bson.ObjectIDFromHex(listHex)
	if err != nil {
		sendResponse(w, http.StatusBadRequest, "Invalid list ID format", "")
		return
	}

	// Get list from database
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var list models.List
	err = db.ListsCollection.FindOne(ctx, bson.M{"_id": listId}).Decode(&list)
	if err != nil {
		sendResponse(w, http.StatusNotFound, "List not found", "")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(list)
}

// UpdateList updates a shopping list
func UpdateList(w http.ResponseWriter, r *http.Request) {
	// Extract list ID from URL
	pathParts := strings.Split(r.URL.Path, "/")
	listHex := pathParts[len(pathParts)-1]

	listId, err := bson.ObjectIDFromHex(listHex)
	if err != nil {
		sendResponse(w, http.StatusBadRequest, "Invalid list ID format", "")
		return
	}

	// Decode request body
	var updateData models.List
	if err := json.NewDecoder(r.Body).Decode(&updateData); err != nil {
		sendResponse(w, http.StatusBadRequest, "Invalid request body", "")
		return
	}

	// Build update document
	updateDoc := bson.M{}

	// Only update items array if provided
	if len(updateData.Items) > 0 {
		// Ensure item IDs are set
		for i := range updateData.Items {
			if updateData.Items[i].IngredientID.IsZero() {
				updateData.Items[i].IngredientID = bson.NewObjectID()
			}
		}
		updateDoc["items"] = updateData.Items
	}

	// Only update if there are fields to update
	if len(updateDoc) == 0 {
		sendResponse(w, http.StatusBadRequest, "No valid fields to update", "")
		return
	}

	// Update in database
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	result, err := db.ListsCollection.UpdateOne(
		ctx,
		bson.M{"_id": listId},
		bson.M{"$set": updateDoc},
	)

	if err != nil {
		log.Printf("Error updating list: %v\n", err)
		sendResponse(w, http.StatusInternalServerError, "Error updating list", "")
		return
	}

	if result.MatchedCount == 0 {
		sendResponse(w, http.StatusNotFound, "List not found", "")
		return
	}

	sendResponse(w, http.StatusOK, "List updated successfully", "")
}

// DeleteList deletes a shopping list
func DeleteList(w http.ResponseWriter, r *http.Request) {
	// Extract list ID from URL
	pathParts := strings.Split(r.URL.Path, "/")
	listHex := pathParts[len(pathParts)-1]

	listId, err := bson.ObjectIDFromHex(listHex)
	if err != nil {
		sendResponse(w, http.StatusBadRequest, "Invalid list ID format", "")
		return
	}

	// Delete from database
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	result, err := db.ListsCollection.DeleteOne(ctx, bson.M{"_id": listId})
	if err != nil {
		log.Printf("Error deleting list: %v\n", err)
		sendResponse(w, http.StatusInternalServerError, "Error deleting list", "")
		return
	}

	if result.DeletedCount == 0 {
		sendResponse(w, http.StatusNotFound, "List not found", "")
		return
	}

	sendResponse(w, http.StatusOK, "List deleted successfully", "")
}

// GetUserLists retrieves all shopping lists for a user
func GetUserLists(w http.ResponseWriter, r *http.Request) {
	// Extract user ID from URL
	pathParts := strings.Split(r.URL.Path, "/")
	userHex := pathParts[len(pathParts)-2]

	userId, err := bson.ObjectIDFromHex(userHex)
	if err != nil {
		sendResponse(w, http.StatusBadRequest, "Invalid user ID format", "")
		return
	}

	// Get lists from database
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	cursor, err := db.ListsCollection.Find(ctx, bson.M{"user_id": userId})
	if err != nil {
		log.Printf("Error retrieving user lists: %v\n", err)
		sendResponse(w, http.StatusInternalServerError, "Error retrieving user lists", "")
		return
	}
	defer cursor.Close(ctx)

	var lists []models.List
	if err = cursor.All(ctx, &lists); err != nil {
		log.Printf("Error decoding user lists: %v\n", err)
		sendResponse(w, http.StatusInternalServerError, "Error decoding user lists", "")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(lists)
}
