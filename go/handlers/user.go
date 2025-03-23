package handlers

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"ordelo/models"
	"time"
)

func CreateUser(w http.ResponseWriter, r *http.Request) {
	var user models.User

	if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
		sendResponse(w, http.StatusBadRequest, "Invalid request body", nil)
		log.Fatal(err)
	}

	if user.Email == "" || user.PasswordHash == "" || user.UserName == "" {
		sendResponse(w, http.StatusBadRequest, "Email, password and username are required ", nil)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	var existingUser User
	err := 

}

func GetUser(w http.ResponseWriter, r *http.Request) {

}

func UpdateUser(w http.ResponseWriter, r *http.Request) {

}

func DeleteUser(w http.ResponseWriter, r *http.Request) {

}
