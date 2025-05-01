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

func ATestMain(m *testing.M) {
	var err error

	dbName := os.Getenv("DB_NAME")
	if dbName == "" {
		log.Fatal(errors.New("env varible DB_NAME is empty"))
	}
	otelShutDown, err := initOtelSDK(context.TODO())
	if err != nil {
		log.Fatal(err)
	}
	mongoShutDown, err := initDB(context.TODO())
	if err != nil {
		log.Fatal(err)
	}
	redisShutDown, err := initRedis(context.TODO())
	if err != nil {
		log.Fatal(err)
	}
	if err = InitCachedMongoRepositories(context.TODO(), RedisClient, MongoClient, 15*time.Minute); err != nil {
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
	err = errors.Join(otelShutDown(context.TODO()), err)
	err = errors.Join(mongoShutDown(context.TODO()), err)
	err = errors.Join(redisShutDown(context.TODO()), err)

	if err != nil {
		log.Printf("Error in cleaning up resources -> %v\n", err)
	} else {
		log.Printf("Cleaned up resources successfull\n")
	}

	log.Printf("Exit code -> %d\n", code)
	os.Exit(code)
}

func TestUserRepositoryPositve(t *testing.T) {
	t.Logf("Testing User Repo CRUD\n")

	user_in := createUser(t)
	id := ID{user_in.ID}

	addRecipe(t, user_in)
	user_out := getUserByID(t, id)
	compareUserStruct(t, user_in, user_out)

	addCart(t, user_in)
	user_out = getUserByEmail(t, user_in.Email)
	compareUserStruct(t, user_in, user_out)

	addOrders(t, user_in)
	user_out = getUserByEmail(t, user_in.Email)
	compareUserStruct(t, user_in, user_out)

	recipes_out := getUserRecipes(t, ID{user_in.ID})
	compareUserRecipes(t, user_in.SavedRecipes, recipes_out)

	updateUser(t, user_in)
	user_out = getUserByID(t, ID{user_in.ID})
	compareUserStruct(t, user_in, user_out)

	user_in.SavedRecipes = updateRecipes(t, ID{user_in.ID}, user_in.SavedRecipes)
	user_out = getUserByID(t, ID{user_in.ID})
	compareUserStruct(t, user_in, user_out)

	user_in.SavedRecipes = deleteRecipes(t, ID{user_in.ID}, user_in.SavedRecipes)
	user_out = getUserByID(t, ID{user_in.ID})
	compareUserStruct(t, user_in, user_out)

	deleteUser(t, ID{user_in.ID})
	t.Logf("Tested User Repo CRUD Successfully\n")
}

func createUser(t *testing.T) *User {
	t.Logf("Testing Create User \n")

	user_in := generateUser(3, 5)
	id, err := r.User.CreateUser(context.TODO(), user_in)
	if err != nil {
		t.Fatalf("%v\n", err)
	}

	t.Logf("Id -> %s\n", id.String())
	user_in.ID = id.value
	t.Logf("Sucess\n")
	return user_in
}

func addRecipe(t *testing.T, user *User) *User {
	t.Logf("Testing Adding Recipe to a user")

	recipes_in := generateRecipesArray(4, 3)
	if _, err := r.User.CreateRecipes(context.TODO(), ID{user.ID}, recipes_in); err != nil {
		t.Fatal(err)
	}
	t.Logf("Recipes added successfull\n")
	user.SavedRecipes = append(user.SavedRecipes, recipes_in...)
	return user
}

func addCart(t *testing.T, user *User) *User {
	t.Logf("Testing Adding Cart to a user")

	cart_in := generateCartsArray(4, 3)
	if _, err := r.User.CreateCarts(context.TODO(), ID{user.ID}, cart_in); err != nil {
		t.Fatal(err)
	}
	t.Logf("Cart added successfull\n")
	user.Carts = append(user.Carts, cart_in...)
	return user
}

func addOrders(t *testing.T, user *User) *User {
	t.Logf("Testing Adding Orders to a user")

	orders_in := generateUserOrdersArray(4, 3)
	if _, err := r.User.CreateUserOrders(context.TODO(), ID{user.ID}, orders_in); err != nil {
		t.Fatal(err)
	}
	t.Logf("Orders added successfull\n")
	user.Orders = append(user.Orders, orders_in...)
	return user
}

func getUserByID(t *testing.T, id ID) *User {
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

func getUserRecipes(t *testing.T, id ID) []*Recipe {
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
	if err := checkUserStruct(user_in, user_out); err != nil {
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

func updateUser(t *testing.T, user_in *User) {
	t.Logf("Testing Update user Function")
	password, _ := bcrypt.GenerateFromPassword([]byte("chinchecker"), bcrypt.DefaultCost)

	user_in.Name = generateRandowName()
	user_in.Address = generateRandomAddress()
	user_in.Email = generateRandowEmails()
	user_in.PasswordHash = string(password)

	if err := r.User.UpdateUser(context.TODO(), user_in); err != nil {
		t.Fatalf("%v\n", err)
	}
	t.Logf("Tested Update user Function Success!")
}

func updateRecipes(t *testing.T, id ID, recipes []*Recipe) []*Recipe {
	t.Logf("Testing Update Recipe Function")
	recipes[0].Title = "Min"
	recipes[0].ServingSize = 100
	recipes[0].Description = "Oga boga brute force software developer"
	recipes = append(recipes, generateRecipesArray(1, 3)[0])

	if err := r.User.UpdateRecipes(context.TODO(), id, recipes); err != nil {
		t.Fatal(err)
	}
	t.Logf("Tested Update recipe Function Success!")
	return recipes
}

func deleteRecipes(t *testing.T, id ID, recipes []*Recipe) []*Recipe {
	t.Logf("Testing Delete Recipes Function")
	ids := []*ID{{recipes[0].ID}, {recipes[1].ID}}
	if err := r.User.DeleteRecipes(context.TODO(), id, ids); err != nil {
		t.Fatal(err)
	}

	t.Logf("Tested Delete Recipes Function Success!")
	return recipes[2:]
}

func deleteUser(t *testing.T, id ID) {
	t.Logf("Testing Delete User Function")
	if err := r.User.DeleteUser(context.TODO(), id); err != nil {
		t.Fatal(err)
	}
	t.Logf("Tested Delete User Function Success!")
}
