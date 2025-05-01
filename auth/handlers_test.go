package main

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"testing"
	"time"
)

const LOCAL_URL = "http://localhost:8080/register"

func TestCreateUser(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	com := generateCommon("user")
	data, err := json.Marshal(com)
	if err != nil {
		t.Fatal(err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, LOCAL_URL, bytes.NewBuffer(data))
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

	if res.StatusCode != http.StatusCreated {
		t.Fatalf("Expected status %d, got %d. Response: %v", http.StatusCreated, res.StatusCode, response)
	}

	t.Logf("Successful response: %v", response)
}
