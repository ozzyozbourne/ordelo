package main

import (
	"context"
	"errors"
	"log"
	"testing"
)

func TestMain(m *testing.M) {
	var err error

	otelShutDown, err := initOtelSDK(context.TODO())
	if err != nil {
		log.Fatal(err)
	}
	mongoShutDown, err := initDB(context.TODO())
	if err != nil {
		log.Fatal(err)
	}
	if err = initRepositories(); err != nil {
		return
	}

	defer func() {
		log.Printf("Cleaning up\n")
		if otelShutDown != nil {
			err = errors.Join(otelShutDown(context.TODO()))
		}
		if mongoShutDown != nil {
			err = errors.Join(mongoShutDown(context.TODO()))
		}
		if err != nil {
			log.Fatal(err)
		}
		log.Printf("Clean up Successfull\n")

	}()
	code := m.Run()
	log.Printf("Exit code -> %d\n", code)
}

func TestUserRepository(t *testing.T) {
	t.Logf("Testing the create user func")

	user := User{
		UserName:     "TestUser",
		UserAddress:  "123 Test St",
		Email:        generateRandowEmails(),
		PasswordHash: "hashedpassword",
		SavedRecipes: []Recipe{},
		Role:         "user",
	}

	Repos.User.CreateUser(context.TODO(), &user)
}
