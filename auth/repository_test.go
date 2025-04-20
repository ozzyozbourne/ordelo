package main

import (
	"context"
	"testing"
)

func TestUserRepository(t *testing.T) {

	otelShutDown, err := initOtelSDK(context.TODO())
	if err != nil {
		t.Fatal(err)
	}
	defer otelShutDown(context.TODO())

	mongoShutDown, err := initDB(context.TODO())
	if err != nil {
		t.Fatal(err)
	}
	defer mongoShutDown(context.TODO())

	user := User{
		UserName:     "TestUser",
		UserAddress:  "123 Test St",
		Email:        generateRandowEmails(),
		PasswordHash: "hashedpassword",
		SavedRecipes: []Recipe{},
		Role:         "user",
	}
	if err := initRepositories(); err != nil {
		t.Fatal(err)
	}

	Repos.User.CreateUser(context.TODO(), &user)
}
