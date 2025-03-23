package handlers

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"ordelo/db"
	"ordelo/models"
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

}

func UpdateUser(w http.ResponseWriter, r *http.Request) {

}

func DeleteUser(w http.ResponseWriter, r *http.Request) {

}
