package main

import (
	"context"
	"errors"
	"fmt"
	"log"
	"os"
	"sync"
	"testing"
	"time"
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

func TestUserCreate(t *testing.T) {
	in := generateUser(3, 5)
	id, err := r.User.CreateUser(context.TODO(), in)
	if err != nil {
		t.Fatal(err)
	}
	in.ID = id.value

	out, err := r.User.FindUserByID(context.TODO(), id)
	if err != nil {
		t.Fatal(err)
	}
	if err := checkUserStruct(in, out); err != nil {
		t.Fatal(err)
	}
}

func TestVendorCreate(t *testing.T) {
	in := generateVendor(3, 5)
	id, err := r.Vendor.CreateVendor(context.TODO(), in)
	if err != nil {
		t.Fatal(err)
	}
	in.ID = id.value

	out, err := r.Vendor.FindVendorByID(context.TODO(), id)
	if err != nil {
		t.Fatal(err)
	}
	if err := checkVendorStruct(in, out); err != nil {
		t.Fatal(err)
	}
}

func TestAdminCreate(t *testing.T) {
	in := generateAdmin(3)
	id, err := r.Admin.CreateAdmin(context.TODO(), in)
	if err != nil {
		t.Fatal(err)
	}
	in.ID = id.value

	out, err := r.Admin.FindAdminByID(context.TODO(), id)
	if err != nil {
		t.Fatal(err)
	}
	if err := checkAdminStruct(in, out); err != nil {
		t.Fatal(err)
	}
}

func TestUserDelete(t *testing.T) {
	in := generateUser(3, 5)
	id, err := r.User.CreateUser(context.TODO(), in)
	if err != nil {
		t.Fatal(err)
	}
	in.ID = id.value

	err = r.User.DeleteUser(context.TODO(), id)
	if err != nil {
		t.Fatal(err)
	}
	if _, err := r.User.FindUserByID(context.TODO(), ID{in.ID}); err == nil {
		t.Fatal(err)
	}
}

func TestVendorDelete(t *testing.T) {
	in := generateVendor(3, 5)
	id, err := r.Vendor.CreateVendor(context.TODO(), in)
	if err != nil {
		t.Fatal(err)
	}
	in.ID = id.value

	err = r.Vendor.DeleteVendor(context.TODO(), id)
	if err != nil {
		t.Fatal(err)
	}
	if _, err := r.Vendor.FindVendorByID(context.TODO(), ID{in.ID}); err == nil {
		t.Fatal(err)
	}
}

func TestAdminDelete(t *testing.T) {
	in := generateAdmin(3)
	id, err := r.Admin.CreateAdmin(context.TODO(), in)
	if err != nil {
		t.Fatal(err)
	}
	in.ID = id.value
	err = r.Admin.Delete(context.TODO(), id)
	if err != nil {
		t.Fatal(err)
	}
	if _, err := r.Admin.FindAdminByID(context.TODO(), ID{in.ID}); err == nil {
		t.Fatal(err)
	}
}

func checkRecipeStruct(in, out *Recipe) error {
	if in.Title != out.Title {
		return fmt.Errorf("Title mismatch: got %s, want %s", out.Title, in.Title)
	}

	if in.Description != out.Description {
		return fmt.Errorf("Description mismatch: got %s, want %s", out.Description, in.Description)
	}

	if in.PreparationTime != out.PreparationTime {
		return fmt.Errorf("PreparationTime mismatch: got %d, want %d", out.PreparationTime, in.PreparationTime)
	}

	if in.ServingSize != out.ServingSize {
		return fmt.Errorf("ServingSize mismatch: got %d, want %d", out.ServingSize, in.ServingSize)
	}

	if len(in.Items) != len(out.Items) {
		return fmt.Errorf("Items length mismatch: got %d, want %d", len(out.Items), len(in.Items))
	}

	for i := range in.Items {
		inItem := in.Items[i]
		outItem := out.Items[i]

		if inItem.Name != outItem.Name {
			return fmt.Errorf("Item[%d] Name mismatch: got %s, want %s", i, outItem.Name, inItem.Name)
		}
		if inItem.Quantity != outItem.Quantity {
			return fmt.Errorf("Item[%d] Quantity mismatch: got %d, want %d", i, outItem.Quantity, inItem.Quantity)
		}
		if inItem.Unit != outItem.Unit {
			return fmt.Errorf("Item[%d] Unit mismatch: got %s, want %s", i, outItem.Unit, inItem.Unit)
		}
	}

	return nil
}

func TestGenerateAndSaveRecipe(t *testing.T) {
	ctx := context.TODO()

	// Step 1: Generate a dummy user (you need user to save recipe)
	user := generateUser(3, 5)
	userID, err := r.User.CreateUser(ctx, user)
	if err != nil {
		t.Fatalf("Failed to create user: %v", err)
	}
	user.ID = userID.value

	// Step 2: Generate single recipe (1 recipe with 5 items)
	recipes := generateRecipesArray(1, 5)
	recipe := recipes[0]

	// Step 3: Save recipe to user saved recipes
	ids, err := r.User.CreateRecipes(ctx, userID, []*Recipe{recipe})
	if err != nil {
		t.Fatalf("Failed to save recipe: %v", err)
	}

	// Step 4: Assign generated ID to recipe for validation
	recipe.ID = ids[0].value

	// Step 5: Fetch saved recipes back
	savedRecipes, err := r.User.FindRecipes(ctx, userID)
	if err != nil {
		t.Fatalf("Failed to fetch saved recipes: %v", err)
	}

	// Step 6: Ensure at least 1 recipe is saved
	if len(savedRecipes) == 0 {
		t.Fatal("No recipes found in saved recipes")
	}

	// Step 7: Validate the recipe (only the first recipe)
	savedRecipe := savedRecipes[0]

	if err := checkRecipeStruct(recipe, savedRecipe); err != nil {
		t.Fatalf("Recipe fetched does not match saved recipe: %v", err)
	}

	t.Log("Recipe saved and fetched successfully match")
}
