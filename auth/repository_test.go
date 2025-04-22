package main

import (
	"context"
	"errors"
	"log"
	"os"
	"testing"
)

var r *Repositories

func TestMain(m *testing.M) {
	var err error

	dbName := os.Getenv("DB_NAME")
	if dbName == "" {
		log.Fatal(errors.New("Env varible DB_NAME is empty!"))
	}
	otelShutDown, err := initOtelSDK(context.TODO())
	if err != nil {
		log.Fatal(err)
	}
	mongoShutDown, err := initDB(context.TODO())
	if err != nil {
		log.Fatal(err)
	}
	if r, err = initMongoRepositories(MongoClient); err != nil {
		log.Fatal(err)
	}

	code := m.Run()

	log.Printf("Cleaning up\n")
	err = errors.Join(otelShutDown(context.TODO()))
	err = errors.Join(mongoShutDown(context.TODO()))

	if err != nil {
		log.Printf("Error in cleaning up resources -> %v\n", err)
	} else {
		log.Printf("Cleaned up resources successfull\n")
	}

	log.Printf("Exit code -> %d\n", code)
	os.Exit(code)
}

func TestUserRepository(t *testing.T) {
	t.Logf("Testing User repos CRUD")

	user := User{
		UserName:     "TestUser",
		UserAddress:  "123 Test St",
		Email:        generateRandowEmails(),
		PasswordHash: "hashedpassword",
		SavedRecipes: []*Recipe{},
		Role:         "user",
	}
	r.User.CreateUser(context.TODO(), &user)
}
