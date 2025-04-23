package main

import (
	"context"
	"errors"
	"log"
	"os"
	"sync"
	"testing"
	"time"

	"golang.org/x/crypto/bcrypt"
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
		log.Printf("Waiting for OTEL logs to flush (8 seconds)...")
		time.Sleep(8 * time.Second)
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

	password, _ := bcrypt.GenerateFromPassword([]byte("nOTsOsAFEpaSSwORD"), bcrypt.DefaultCost)
	user_in := &User{
		UserName:     generateRandowName(),
		UserAddress:  generateRandomAddress(),
		Email:        generateRandowEmails(),
		PasswordHash: string(password),
		SavedRecipes: []*Recipe{},
		Role:         "user",
	}

	id, err := r.User.CreateUser(context.TODO(), user_in)
	if err != nil {
		t.Fatalf("%v\n", err)
	}

	t.Logf("Id -> %v\n", id)
	t.Logf("Testing Create User Recipes fn\n")
	user_in.ID = id

	recipes := generateRecipesArray(3)
	err = r.User.CreateUserRecipes(context.TODO(), id.Hex(), recipes)
	if err != nil {
		t.Fatalf("%v\n", err)
	}
	t.Logf("Recipes added successfull\n")

	user_in.SavedRecipes = recipes

	t.Logf("Getting the saved usen\n")
	user_out, err := r.User.FindUser(context.TODO(), id.Hex())
	if err != nil {
		t.Fatalf("%v\n", err)
	}
	t.Logf("Got the user successfully\n")

	t.Logf("Comparing the two user structs\n")
	if err := checkUserStructs(user_in, user_out); err != nil {
		t.Fatalf("%v\n", err)
	}
	t.Logf("Success the two user structs are the same\n")

}
