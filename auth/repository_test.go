package main

import (
	"context"
	"errors"
	"log"
	"os"
	"sync"
	"testing"
	"time"
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

	var wg sync.WaitGroup
	wg.Add(1)
	go func() {
		defer wg.Done()
		log.Printf("Waiting for OTEL logs to flush (6 seconds)...")
		time.Sleep(6 * time.Second)
		log.Printf("Done waiting for OTEL logs")
	}()

	log.Printf("Waiting for background tasks to complete...")
	wg.Wait()
	log.Printf("All background tasks completed")

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
	t.Logf("Testing User repos CRUD\n")
	t.Logf("Testing Create User fn\n")

	user := User{
		UserName:     "TestUser",
		UserAddress:  "123 Test St",
		Email:        generateRandowEmails(),
		PasswordHash: "hashedpassword",
		SavedRecipes: []*Recipe{},
		Role:         "user",
	}

	id, err := r.User.CreateUser(context.TODO(), &user)
	if err != nil {
		t.Fatalf("%v\n", err)
	}

	t.Logf("Id -> %v\n", id)
	t.Logf("Testing Create User Recipes fn\n")

	recipes := generateRecipesArray(3)
	err = r.User.CreateUserRecipes(context.TODO(), id.Hex(), recipes)
	if err != nil {
		t.Fatalf("%v\n", err)
	}
	t.Logf("Recipes added successfull\n")

}
