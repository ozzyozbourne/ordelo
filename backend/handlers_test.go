package main

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"testing"
	"time"
)

const LOCAL_URL = "http://localhost:8080/"

func TestReqIngredients(t *testing.T) {
	res := generateIngredientsArray(3)
	var req struct {
		Ingredients []*Ingredient `json:"ingredients"`
	}

	req.Ingredients = res

	s, err := json.Marshal(req)
	if err != nil {
		t.Fatal(err)
	}
	t.Logf("Ingredients -> \n%s\n", string(s))
}

func TestReqStores(t *testing.T) {
	res := generateStoresArray(1, 1)
	var req struct {
		Stores []*Store `json:"stores"`
	}

	req.Stores = res

	s, err := json.Marshal(req)
	if err != nil {
		t.Fatal(err)
	}
	t.Logf("Request -> \n%s\n", string(s))
}

func TestReqUserOrders(t *testing.T) {
	res := generateUserOrdersArray(1, 1)
	var req struct {
		Orders []*UserOrder `json:"orders"`
	}

	req.Orders = res

	s, err := json.Marshal(req)
	if err != nil {
		t.Fatal(err)
	}
	t.Logf("Orders -> \n%s\n", string(s))
}

func TestReqRecipes(t *testing.T) {
	res := generateRecipesArray(1, 1)
	var req struct {
		Recipes []*Recipe `json:"recipes"`
	}

	req.Recipes = res

	s, err := json.Marshal(req)
	if err != nil {
		t.Fatal(err)
	}
	t.Logf("Recipes -> \n%s\n", string(s))
}

func TestReqCarts(t *testing.T) {
	res := generateCartsArray(1, 1)
	var req struct {
		Carts []*Cart `json:"carts"`
	}

	req.Carts = res

	s, err := json.Marshal(req)
	if err != nil {
		t.Fatal(err)
	}
	t.Logf("Carts -> \n%s\n", string(s))
}

func TestReqCompare(t *testing.T) {
	res := generateReqIngArray(3, 4)
	var req struct {
		Compare []*ReqIng `json:"compare"`
	}

	req.Compare = res

	s, err := json.Marshal(req)
	if err != nil {
		t.Fatal(err)
	}
	t.Logf("ReqIng Comparison-> \n%s\n", string(s))
}

func ATestCreateUser(t *testing.T) {
	loginUserFromAPI(t, createUserFromAPI(t))
}

func createUserFromAPI(t *testing.T) *Common {
	com := generateCommon("user")
	data, err := json.Marshal(com)
	if err != nil {
		t.Fatal(err)
	}
	dispatch(t, data, http.StatusCreated, http.MethodPost, "register")
	return &com
}

func loginUserFromAPI(t *testing.T, com *Common) {
	login := &Login{
		Email:    com.Email,
		Password: com.PasswordHash,
		Role:     com.Role,
	}
	data, err := json.Marshal(login)
	if err != nil {
		t.Fatal(err)
	}
	t.Logf("User -> %s\n", data)
	dispatch(t, data, http.StatusOK, http.MethodPost, "login")
}

func dispatch(t *testing.T, data []byte, status int, httpMethod, endpoint string) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	endpoint = LOCAL_URL + endpoint
	t.Logf("Hitting endpoint -> %s\n", endpoint)

	req, err := http.NewRequestWithContext(ctx, httpMethod, endpoint, bytes.NewBuffer(data))
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	res, err := client.Do(req)
	if err != nil {
		t.Fatal(err)
	}
	defer res.Body.Close()

	var response map[string]any
	if err := json.NewDecoder(res.Body).Decode(&response); err != nil {
		t.Fatalf("Failed to parse response body: %v", err)
	}

	if res.StatusCode != status {
		t.Fatalf("Expected status %d, got %d. Response: %v", status, res.StatusCode, response)
	}
	t.Logf("Successful response: %v", response)
}
