package main

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"go.mongodb.org/mongo-driver/v2/bson"
)

func TestUserCreation(t *testing.T) {
	InitMongoDB()
	defer CloseMongoDB()

	user := User{
		UserName:     "TestUser",
		UserAddress:  "123 Test St",
		Email:        generateRandowEmails(),
		PasswordHash: "hashedpassword",
		SavedRecipes: []bson.ObjectID{},
		Role:         "user",
		CreatedAt:    time.Now(),
	}

	userJson, err := json.Marshal(&user)
	if err != nil {
		t.Fatalf("Unable to marshal user struct %s\n", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, P, bytes.NewBuffer(userJson))
	if err != nil {
		t.Fatalf("Failed to create request: %s\n", err)
	}

	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	res, err := client.Do(req)
	if err != nil {
		t.Fatalf("Error occured %s\n", err)
	}
	defer res.Body.Close()

	if res.StatusCode != http.StatusCreated {
		var errorBody map[string]any
		json.NewDecoder(res.Body).Decode(&errorBody)
		t.Fatalf("Expected status %d, got %d. Response: %v", http.StatusCreated, res.StatusCode, errorBody)

	}

	var response APIReponse
	if err := json.NewDecoder(res.Body).Decode(&response); err != nil {
		t.Fatalf("Failed to parse response body: %v", err)
	}

	t.Logf("Created user -> %+v", response)
	t.Logf("Checking if created user is present in the DB\n")

	var savedInDBUser User
	if err = UsersCollection.FindOne(ctx, bson.M{"email": user.Email}).Decode(&savedInDBUser); err != nil {
		t.Fatalf("Unable to find the DB %s\n", err)
	}

	t.Logf("Fetched from DB -> %+v\n", savedInDBUser)
	assert.Equal(t, savedInDBUser.UserName, user.UserName)
	assert.Equal(t, savedInDBUser.Email, user.Email)
	t.Logf("Sucess\n")
}
