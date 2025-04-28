package main

import (
	"context"
	"encoding/json"
	"fmt"
	"testing"
)

type userResult interface {
	*User | []*Recipe
}

func TestUserCachedRepositoryPositve(t *testing.T) {
	t.Logf("Testing Cached User repo CRUD\n")

	in := createCachedUser(t)
	out := getFromRedis[*User](t, context.TODO(), fmt.Sprintf("%s:%s", "user", in.ID.Hex()))
	compareUserStruct(t, in, out)

	t.Logf("Tested Success!\n")
}

func createCachedUser(t *testing.T) *User {
	t.Logf("Testing to see if on creating a new user its added to the cache\n")
	user_in := generateUser(4, 3)

	id, err := Repos.User.Create(context.TODO(), user_in)
	if err != nil {
		t.Fatal(err)
	}

	user_in.ID = id.value
	t.Logf("The new user is successfully added to the redis cache\n")
	return user_in
}

func getFromRedis[T userResult](t *testing.T, ctx context.Context, key string) T {
	t.Logf("Key -> %s\n", key)
	response := RedisClient.Get(ctx, key)
	data, err := response.Result()
	if err != nil {
		t.Fatal(err)
	}
	// t.Logf("%s\n", data)
	var res T
	if err := json.Unmarshal([]byte(data), &res); err != nil {
		t.Fatal(err)
	}
	return res
}
