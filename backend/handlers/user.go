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
	var user models.User

	if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
		sendResponse(w, http.StatusBadRequest, "Invalid request body", nil)
		log.Fatal(err)
	}

	if user.Email == "" || user.PasswordHash == "" || user.UserName == "" {
		sendResponse(w, http.StatusBadRequest, "Email, password and username are required ", nil)
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var existingUser models.User
	if err := db.UsersCollection.FindOne(ctx, bson.M{"email": user.Email}).Decode(&existingUser); err == nil {
		sendResponse(w, http.StatusConflict, "Email already in use", nil)
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.PasswordHash), bcrypt.DefaultCost)
	if err != nil {
		sendResponse(w, http.StatusInternalServerError, "Error processing request", nil)
		return
	}

	user.ID = bson.NewObjectID()
	user.PasswordHash = string(hashedPassword)
	user.CreatedAt = time.Now()
	user.SavedRecipes = []bson.ObjectID{}

	if user.Role == "" {
		user.Role = "user"
	}

	res, err := db.UsersCollection.InsertOne(ctx, user)
	if err != nil {
		log.Fatalf("Error %s in inserting user %+v\n", err, user)
	}
	log.Printf("Insert? -> %t ID -> %+v\n", res.Acknowledged, res.InsertedID)

	user.PasswordHash = ""

	sendResponse(w, http.StatusCreated, "User created successfully", nil)

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

	var userResponse models.User
	if err := db.UsersCollection.FindOne(ctx, bson.M{"_id": id}).Decode(&userResponse); err != nil {
		sendResponse(w, http.StatusNotFound, "User not found", nil)
		return
	}
	userResponse.PasswordHash = ""

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	if err := json.NewEncoder(w).Encode(&userResponse); err != nil {
		log.Fatal(err)
	}
}

// func UpdateUser(w http.ResponseWriter, r *http.Request) {
// 	var user models.User
//
// 	if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
// 		sendResponse(w, http.StatusBadRequest, "Invalid request body", nil)
// 		log.Fatal(err)
// 	}
//
// 	// Parse request body
// 	var updates map[string]interface{}
// 	if err := json.NewDecoder(r.Body).Decode(&updates); err != nil {
// 		sendResponse(w, http.StatusBadRequest, "Invalid request body", nil)
// 		return
// 	}
//
// 	// Remove fields that shouldn't be updated directly
// 	delete(updates, "_id")
// 	delete(updates, "password_hash")
// 	delete(updates, "created_at")
//
// 	// If there are no valid updates, return
// 	if len(updates) == 0 {
// 		sendResponse(w, http.StatusBadRequest, "No valid fields to update", nil)
// 		return
// 	}
//
// 	// Update user
// 	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
// 	defer cancel()
//
// 	result, err := db.UsersCollection.UpdateOne(
// 		ctx,
// 		bson.M{"_id": id},
// 		bson.M{"$set": updates},
// 	)
//
// 	if err != nil {
// 		sendResponse(w, http.StatusInternalServerError, "Error updating user", nil)
// 		return
// 	}
//
// 	if result.MatchedCount == 0 {
// 		sendResponse(w, http.StatusNotFound, "User not found", nil)
// 		return
// 	}
//
// 	// Get updated user
// 	var updatedUser models.User
// 	err = db.UsersCollection.FindOne(ctx, bson.M{"_id": id}).Decode(&updatedUser)
// 	if err != nil {
// 		sendResponse(w, http.StatusInternalServerError, "User updated but could not retrieve updated data", nil)
// 		return
// 	}
//
// 	// Remove password hash from response
// 	updatedUser.PasswordHash = ""
//
// 	sendResponse(w, http.StatusOK, "User updated successfully", updatedUser)
// }
//
// func DeleteUser(w http.ResponseWriter, r *http.Request) {
// 	// Extract user ID from URL path
// 	pathParts := strings.Split(r.URL.Path, "/")
// 	if len(pathParts) < 3 {
// 		sendResponse(w, http.StatusBadRequest, "Invalid user ID", nil)
// 		return
// 	}
// 	idStr := pathParts[len(pathParts)-1]
//
// 	// Convert string ID to ObjectID
// 	id, err := bson.ObjectIDFromHex(idStr)
// 	if err != nil {
// 		sendResponse(w, http.StatusBadRequest, "Invalid user ID format", nil)
// 		return
// 	}
//
// 	// Check authorization (only the user themselves or an admin can delete user account)
// 	requestUserID, err := GetUserIDFromContext(r.Context())
// 	if err != nil || (requestUserID != id && r.Context().Value(RoleKey) != "admin") {
// 		sendResponse(w, http.StatusForbidden, "Access denied", nil)
// 		return
// 	}
//
// 	// Delete user
// 	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
// 	defer cancel()
//
// 	result, err := db.UsersCollection.DeleteOne(ctx, bson.M{"_id": id})
// 	if err != nil {
// 		sendResponse(w, http.StatusInternalServerError, "Error deleting user", nil)
// 		return
// 	}
//
// 	if result.DeletedCount == 0 {
// 		sendResponse(w, http.StatusNotFound, "User not found", nil)
// 		return
// 	}
//
// 	sendResponse(w, http.StatusOK, "User deleted successfully", nil)
// }
