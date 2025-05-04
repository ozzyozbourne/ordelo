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
