package handlers

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"ordelo/db"
	"ordelo/models"
	"strings"
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
	"golang.org/x/crypto/bcrypt"
)

func CreateUser(w http.ResponseWriter, r *http.Request) {
	sendResponse := func(status int, message, userId string) {
		createdUser := &models.UserRes{
			Message: message,
			UserId:  userId,
		}

		w.WriteHeader(status)
		w.Header().Set("Content-Type", "application/json")

		if err := json.NewEncoder(w).Encode(createdUser); err != nil {
			log.Printf("Error in encode created user response %v\n", err)
		}
	}

	var createUser models.User
	var checkIfPersisted models.User

	if err := json.NewDecoder(r.Body).Decode(&createUser); err != nil {
		sendResponse(http.StatusBadRequest, "Invalid request body", "")
		log.Printf("Error in decoding the response body %v\n", err)
		return
	}
	//Fields verification
	switch {
	case createUser.Email == "":
		sendResponse(http.StatusBadRequest, "Email is empty", "")
		return
	case createUser.PasswordHash == "":
		sendResponse(http.StatusBadRequest, "Password is empty", "")
		return
	case createUser.UserName == "":
		sendResponse(http.StatusBadRequest, "Username is empty", "")
		return
	case createUser.Role == "":
		sendResponse(http.StatusBadRequest, "role is empty", "")
		return
	default:
	}

	log.Printf("Checking if user already present\n")
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := db.UsersCollection.FindOne(ctx, bson.M{"email": createUser.Email}).Decode(&checkIfPersisted); err == nil {
		sendResponse(http.StatusConflict, "Email already in use", "")
		return
	}

	log.Printf("Fresh user persisting in DB\n")
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(createUser.PasswordHash), bcrypt.DefaultCost)
	if err != nil {
		sendResponse(http.StatusInternalServerError, "Error in encrypting password", "")
		return
	}

	//adding messing feilds
	createUser.ID = bson.NewObjectID()
	createUser.PasswordHash = string(hashedPassword)
	createUser.CreatedAt = time.Now()
	createUser.SavedRecipes = []bson.ObjectID{}

	log.Printf("Persisting to DB user %+v\n", createUser)
	res, err := db.UsersCollection.InsertOne(ctx, createUser)
	if err != nil {
		log.Fatalf("Error %s in persisting user %+v\n", err, createUser)
	}
	log.Printf("Is Persisted? -> %t ID -> %+v\n", res.Acknowledged, res.InsertedID)

	createUser.PasswordHash = ""
	sendResponse(http.StatusCreated, "User created successfully", "")
}

func GetUser(w http.ResponseWriter, r *http.Request) {
	pathParts := strings.Split(r.URL.Path, "/")
	userHex := pathParts[len(pathParts)-1]

	log.Printf("Fetched userID in hex -> %s\n", userHex)

	id, err := bson.ObjectIDFromHex(userHex)
	if err != nil {
		log.Fatalf("Unable to get the object hex from string -> %s error -> %v\n", userHex, err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	log.Printf("The user id to search is -> %s\n", id.String())

	var userResponse models.User
	if err := db.UsersCollection.FindOne(ctx, bson.M{"_id": id}).Decode(&userResponse); err != nil {
		sendResponse(w, http.StatusNotFound, "User not found", "")
		return
	}
	userResponse.PasswordHash = ""

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	if err := json.NewEncoder(w).Encode(&userResponse); err != nil {
		log.Fatal(err)
	}

	log.Printf("User with id %s is present in db\n", id.String())
}

func UpdateUser(w http.ResponseWriter, r *http.Request) {

	pathParts := strings.Split(r.URL.Path, "/")
	userHex := pathParts[len(pathParts)-1]
	log.Printf("User id in hex -> %s\n", userHex)

	id, err := bson.ObjectIDFromHex(userHex)
	if err != nil {
		log.Printf("User to transform to bsom object id error -> %v\n", err)
		sendResponse(w, http.StatusBadRequest, "Invalid user ID format", "")
		return
	}

	var updateData models.User
	if err := json.NewDecoder(r.Body).Decode(&updateData); err != nil {
		log.Printf("Unable to decode the respony body to user struct error -> %v\n", err)
		sendResponse(w, http.StatusBadRequest, "Invalid request body", "")
		return
	}

	updateDoc := bson.M{}

	if updateData.UserName != "" {
		updateDoc["user_name"] = updateData.UserName
	}

	if updateData.UserAddress != "" {
		updateDoc["user_address"] = updateData.UserAddress
	}

	if updateData.Email != "" {
		updateDoc["email"] = updateData.Email
	}

	if updateData.Role != "" {
		updateDoc["role"] = updateData.Role
	}

	if len(updateDoc) == 0 {
		log.Printf("No fields to update the updatedata struct is empty check the response body\n")
		sendResponse(w, http.StatusBadRequest, "No valid fields to update", "")
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	result, err := db.UsersCollection.UpdateOne(
		ctx,
		bson.M{"_id": id},
		bson.M{"$set": updateDoc},
	)

	if err != nil {
		log.Printf("Error updating user: %v\n", err)
		sendResponse(w, http.StatusInternalServerError, "Error updating user", "")
		return
	}

	if result.MatchedCount == 0 {
		sendResponse(w, http.StatusNotFound, "User not found", "")
		return
	}

	sendResponse(w, http.StatusOK, "User updated successfully", "")
}

// DeleteUser deletes a user
func DeleteUser(w http.ResponseWriter, r *http.Request) {
	// Extract user ID from URL
	pathParts := strings.Split(r.URL.Path, "/")
	userHex := pathParts[len(pathParts)-1]

	id, err := bson.ObjectIDFromHex(userHex)
	if err != nil {
		sendResponse(w, http.StatusBadRequest, "Invalid user ID format", "")
		return
	}

	// Delete from database
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	result, err := db.UsersCollection.DeleteOne(ctx, bson.M{"_id": id})

	if err != nil {
		log.Printf("Error deleting user: %v\n", err)
		sendResponse(w, http.StatusInternalServerError, "Error deleting user", "")
		return
	}

	if result.DeletedCount == 0 {
		sendResponse(w, http.StatusNotFound, "User not found", "")
		return
	}

	sendResponse(w, http.StatusOK, "User deleted successfully", "")
}

// SaveRecipe adds a recipe to a user's saved recipes
func SaveRecipe(w http.ResponseWriter, r *http.Request) {
	// Extract user ID and recipe ID from URL
	pathParts := strings.Split(r.URL.Path, "/")
	recipeHex := pathParts[len(pathParts)-1]
	userHex := pathParts[len(pathParts)-3]

	userId, err := bson.ObjectIDFromHex(userHex)
	if err != nil {
		sendResponse(w, http.StatusBadRequest, "Invalid user ID format", "")
		return
	}

	recipeId, err := bson.ObjectIDFromHex(recipeHex)
	if err != nil {
		sendResponse(w, http.StatusBadRequest, "Invalid recipe ID format", "")
		return
	}

	// Verify recipe exists
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var recipe models.Recipe
	err = db.RecipesCollection.FindOne(ctx, bson.M{"_id": recipeId}).Decode(&recipe)
	if err != nil {
		sendResponse(w, http.StatusNotFound, "Recipe not found", "")
		return
	}

	// Add recipe to user's saved recipes
	result, err := db.UsersCollection.UpdateOne(
		ctx,
		bson.M{"_id": userId},
		bson.M{"$addToSet": bson.M{"saved_recipes": recipeId}},
	)

	if err != nil {
		log.Printf("Error saving recipe: %v\n", err)
		sendResponse(w, http.StatusInternalServerError, "Error saving recipe", "")
		return
	}

	if result.MatchedCount == 0 {
		sendResponse(w, http.StatusNotFound, "User not found", "")
		return
	}

	sendResponse(w, http.StatusOK, "Recipe saved successfully", "")
}

// UnsaveRecipe removes a recipe from a user's saved recipes
func UnsaveRecipe(w http.ResponseWriter, r *http.Request) {
	// Extract user ID and recipe ID from URL
	pathParts := strings.Split(r.URL.Path, "/")
	recipeHex := pathParts[len(pathParts)-1]
	userHex := pathParts[len(pathParts)-3]

	userId, err := bson.ObjectIDFromHex(userHex)
	if err != nil {
		sendResponse(w, http.StatusBadRequest, "Invalid user ID format", "")
		return
	}

	recipeId, err := bson.ObjectIDFromHex(recipeHex)
	if err != nil {
		sendResponse(w, http.StatusBadRequest, "Invalid recipe ID format", "")
		return
	}

	// Remove recipe from user's saved recipes
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	result, err := db.UsersCollection.UpdateOne(
		ctx,
		bson.M{"_id": userId},
		bson.M{"$pull": bson.M{"saved_recipes": recipeId}},
	)

	if err != nil {
		log.Printf("Error removing saved recipe: %v\n", err)
		sendResponse(w, http.StatusInternalServerError, "Error removing saved recipe", "")
		return
	}

	if result.MatchedCount == 0 {
		sendResponse(w, http.StatusNotFound, "User not found", "")
		return
	}

	sendResponse(w, http.StatusOK, "Recipe removed from saved recipes", "")
}

// GetUserRecipes retrieves all saved recipes for a user
func GetUserRecipes(w http.ResponseWriter, r *http.Request) {
	// Extract user ID from URL
	pathParts := strings.Split(r.URL.Path, "/")
	userHex := pathParts[len(pathParts)-2]

	userId, err := bson.ObjectIDFromHex(userHex)
	if err != nil {
		sendResponse(w, http.StatusBadRequest, "Invalid user ID format", "")
		return
	}

	// Get user to retrieve saved recipe IDs
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var user models.User
	err = db.UsersCollection.FindOne(ctx, bson.M{"_id": userId}).Decode(&user)
	if err != nil {
		sendResponse(w, http.StatusNotFound, "User not found", "")
		return
	}

	// Return empty array if no saved recipes
	if len(user.SavedRecipes) == 0 {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode([]models.Recipe{})
		return
	}

	// Retrieve all recipes by IDs
	cursor, err := db.RecipesCollection.Find(ctx, bson.M{"_id": bson.M{"$in": user.SavedRecipes}})
	if err != nil {
		log.Printf("Error retrieving saved recipes: %v\n", err)
		sendResponse(w, http.StatusInternalServerError, "Error retrieving saved recipes", "")
		return
	}
	defer cursor.Close(ctx)

	var recipes []models.Recipe
	if err = cursor.All(ctx, &recipes); err != nil {
		log.Printf("Error decoding saved recipes: %v\n", err)
		sendResponse(w, http.StatusInternalServerError, "Error decoding saved recipes", "")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(recipes)
}
