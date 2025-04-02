package handlers

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"ordelo/db"
	"ordelo/models"
	"strconv"
	"strings"
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

// CreateRecipe creates a new recipe
func CreateRecipe(w http.ResponseWriter, r *http.Request) {
	var recipe models.Recipe
	if err := json.NewDecoder(r.Body).Decode(&recipe); err != nil {
		sendResponse(w, http.StatusBadRequest, "Invalid request body", "")
		return
	}

	// Validate required fields
	if recipe.Title == "" || len(recipe.Ingredients) == 0 || recipe.Description == "" {
		sendResponse(w, http.StatusBadRequest, "Title, ingredients, and description are required", "")
		return
	}

	// Set ID
	recipe.ID = bson.NewObjectID()

	// Generate IDs for ingredients if not provided
	for i := range recipe.Ingredients {
		if recipe.Ingredients[i].IngredientID.IsZero() {
			recipe.Ingredients[i].IngredientID = bson.NewObjectID()
		}
	}

	// Insert into database
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err := db.RecipesCollection.InsertOne(ctx, recipe)
	if err != nil {
		log.Printf("Error creating recipe: %v\n", err)
		sendResponse(w, http.StatusInternalServerError, "Error creating recipe", "")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(recipe)
}

// GetRecipe retrieves a recipe by ID
func GetRecipe(w http.ResponseWriter, r *http.Request) {
	// Extract recipe ID from URL
	pathParts := strings.Split(r.URL.Path, "/")
	recipeHex := pathParts[len(pathParts)-1]

	recipeId, err := bson.ObjectIDFromHex(recipeHex)
	if err != nil {
		sendResponse(w, http.StatusBadRequest, "Invalid recipe ID format", "")
		return
	}

	// Get recipe from database
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var recipe models.Recipe
	err = db.RecipesCollection.FindOne(ctx, bson.M{"_id": recipeId}).Decode(&recipe)
	if err != nil {
		sendResponse(w, http.StatusNotFound, "Recipe not found", "")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(recipe)
}

// UpdateRecipe updates a recipe
func UpdateRecipe(w http.ResponseWriter, r *http.Request) {
	// Extract recipe ID from URL
	pathParts := strings.Split(r.URL.Path, "/")
	recipeHex := pathParts[len(pathParts)-1]

	recipeId, err := bson.ObjectIDFromHex(recipeHex)
	if err != nil {
		sendResponse(w, http.StatusBadRequest, "Invalid recipe ID format", "")
		return
	}

	// Decode request body
	var updateData models.Recipe
	if err := json.NewDecoder(r.Body).Decode(&updateData); err != nil {
		sendResponse(w, http.StatusBadRequest, "Invalid request body", "")
		return
	}

	// Build update document
	updateDoc := bson.M{}

	if updateData.Title != "" {
		updateDoc["title"] = updateData.Title
	}

	if updateData.Description != "" {
		updateDoc["description"] = updateData.Description
	}

	if updateData.PreparationTime != 0 {
		updateDoc["preparation_time"] = updateData.PreparationTime
	}

	if updateData.ServingSize != 0 {
		updateDoc["serving_size"] = updateData.ServingSize
	}

	// Handle ingredients update (replace entire array)
	if len(updateData.Ingredients) > 0 {
		// Generate IDs for ingredients if not provided
		for i := range updateData.Ingredients {
			if updateData.Ingredients[i].IngredientID.IsZero() {
				updateData.Ingredients[i].IngredientID = bson.NewObjectID()
			}
		}
		updateDoc["ingredients"] = updateData.Ingredients
	}

	// Only update if there are fields to update
	if len(updateDoc) == 0 {
		sendResponse(w, http.StatusBadRequest, "No valid fields to update", "")
		return
	}

	// Update in database
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	result, err := db.RecipesCollection.UpdateOne(
		ctx,
		bson.M{"_id": recipeId},
		bson.M{"$set": updateDoc},
	)

	if err != nil {
		log.Printf("Error updating recipe: %v\n", err)
		sendResponse(w, http.StatusInternalServerError, "Error updating recipe", "")
		return
	}

	if result.MatchedCount == 0 {
		sendResponse(w, http.StatusNotFound, "Recipe not found", "")
		return
	}

	sendResponse(w, http.StatusOK, "Recipe updated successfully", "")
}

// DeleteRecipe deletes a recipe
func DeleteRecipe(w http.ResponseWriter, r *http.Request) {
	// Extract recipe ID from URL
	pathParts := strings.Split(r.URL.Path, "/")
	recipeHex := pathParts[len(pathParts)-1]

	recipeId, err := bson.ObjectIDFromHex(recipeHex)
	if err != nil {
		sendResponse(w, http.StatusBadRequest, "Invalid recipe ID format", "")
		return
	}

	// Delete from database
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	result, err := db.RecipesCollection.DeleteOne(ctx, bson.M{"_id": recipeId})
	if err != nil {
		log.Printf("Error deleting recipe: %v\n", err)
		sendResponse(w, http.StatusInternalServerError, "Error deleting recipe", "")
		return
	}

	if result.DeletedCount == 0 {
		sendResponse(w, http.StatusNotFound, "Recipe not found", "")
		return
	}

	sendResponse(w, http.StatusOK, "Recipe deleted successfully", "")
}

// GetAllRecipes retrieves all recipes with optional filtering
func GetAllRecipes(w http.ResponseWriter, r *http.Request) {
	// Parse query parameters for filtering
	query := bson.M{}

	// Example: ?user_id=5f5e...
	if userIdStr := r.URL.Query().Get("user_id"); userIdStr != "" {
		userId, err := bson.ObjectIDFromHex(userIdStr)
		if err == nil {
			query["user_id"] = userId
		}
	}

	// Example: ?title=pasta
	if title := r.URL.Query().Get("title"); title != "" {
		query["title"] = bson.M{"$regex": title, "$options": "i"}
	}

	// Set up options for pagination
	limit := 10
	if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
		if parsedLimit, err := strconv.Atoi(limitStr); err == nil && parsedLimit > 0 {
			limit = parsedLimit
		}
	}

	skip := 0
	if skipStr := r.URL.Query().Get("skip"); skipStr != "" {
		if parsedSkip, err := strconv.Atoi(skipStr); err == nil && parsedSkip >= 0 {
			skip = parsedSkip
		}
	}

	findOptions := options.Find().
		SetLimit(int64(limit)).
		SetSkip(int64(skip)).
		SetSort(bson.M{"title": 1})

	// Execute query
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	cursor, err := db.RecipesCollection.Find(ctx, query, findOptions)
	if err != nil {
		log.Printf("Error retrieving recipes: %v\n", err)
		sendResponse(w, http.StatusInternalServerError, "Error retrieving recipes", "")
		return
	}
	defer cursor.Close(ctx)

	var recipes []models.Recipe
	if err = cursor.All(ctx, &recipes); err != nil {
		log.Printf("Error decoding recipes: %v\n", err)
		sendResponse(w, http.StatusInternalServerError, "Error decoding recipes", "")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(recipes)
}
