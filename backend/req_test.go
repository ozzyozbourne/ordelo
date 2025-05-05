package main

import (
	"encoding/json"
	"testing"
)

func TestReq1(t *testing.T) {
	res := generateIngredientsArray(3)
	var req struct {
		Ingredients []*Ingredient `json:"ingredients"`
	}

	req.Ingredients = res

	s, err := json.Marshal(req)
	if err != nil {
		t.Fatal(err)
	}
	t.Logf("Request -> \n%s\n", string(s))

}

func TestReq2(t *testing.T) {
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

func TestReq3(t *testing.T) {
	res := generateUserOrdersArray(1, 1)
	var req struct {
		Orders []*UserOrder `json:"orders"`
	}

	req.Orders = res

	s, err := json.Marshal(req)
	if err != nil {
		t.Fatal(err)
	}
	t.Logf("Request -> \n%s\n", string(s))

}
