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

	user_in := createUser(t)
	user_in = addRecipe(t, user_in)
	user_out := getUserByID(t, user_in.ID.Hex())
	compareUserStruct(t, user_in, user_out)

	user_out = getUserByEmail(t, user_in.Email)
	compareUserStruct(t, user_in, user_out)

	recipes_out := getUserRecipes(t, user_in.ID.Hex())
	compareUserRecipes(t, user_in.SavedRecipes, recipes_out)

}

func createUser(t *testing.T) *User {
	t.Logf("Testing Create User \n")

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
	user_in.ID = id
	t.Logf("Sucess\n")
	return user_in
}

func addRecipe(t *testing.T, user *User) *User {
	t.Logf("Testing Adding Recipe to a user")
	recipes_in := generateRecipesArray(3)
	err := r.User.CreateUserRecipes(context.TODO(), user.ID.Hex(), recipes_in)
	if err != nil {
		t.Fatalf("%v\n", err)
	}
	t.Logf("Recipes added successfull\n")
	user.SavedRecipes = recipes_in
	return user
}

func getUserByID(t *testing.T, id string) *User {
	t.Logf("Getting the by ID\n")
	user, err := r.User.FindUserByID(context.TODO(), id)
	if err != nil {
		t.Fatalf("%v\n", err)
	}
	t.Logf("Got the user successfully\n")
	return user
}

func getUserByEmail(t *testing.T, email string) *User {
	t.Logf("Getting the by email\n")
	user, err := r.User.FindUserByEmail(context.TODO(), email)
	if err != nil {
		t.Fatalf("%v\n", err)
	}
	t.Logf("Got the user successfully\n")
	return user
}

func getUserRecipes(t *testing.T, id string) []*Recipe {
	t.Logf("Getting the user Recipes\n")
	recipes, err := r.User.FindRecipes(context.TODO(), id)
	if err != nil {
		t.Fatalf("%v\n", err)
	}
	t.Logf("Got the user recipes successfully\n")
	return recipes
}

func compareUserStruct(t *testing.T, user_in, user_out *User) {
	t.Logf("Comparing the two user structs\n")
	if err := checkUserStructs(user_in, user_out); err != nil {
		t.Fatalf("%v\n", err)
	}
	t.Logf("Success the two user structs are the same\n")

}

func compareUserRecipes(t *testing.T, recipes_in, recipes_out []*Recipe) {
	t.Logf("Comparing the two recipe structs\n")
	if err := checkRecipes(recipes_in, recipes_out); err != nil {
		t.Fatalf("%v\n", err)
	}
	t.Logf("Success the two recipes structs are the same\n")

}
