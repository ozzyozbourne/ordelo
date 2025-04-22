package main

import (
	"context"
	"time"

	"github.com/redis/go-redis/v9"
)

type CachedUserRepository struct {
	redis      *redis.Client
	userRepo   UserRepository
	expiration time.Duration
}

type CachedStoreRepository struct {
	redis      *redis.Client
	storeRepo  StoreRepository
	expiration time.Duration
}

type CachedOrderRepository struct {
	redis      *redis.Client
	orderRepo  OrderRepository
	expiration time.Duration
}

type CachedCartRepository struct {
	redis      *redis.Client
	cartRepo   CartRepository
	expiration time.Duration
}

type CachedVendorRepository struct {
	redis      *redis.Client
	vendorRepo VendorRepository
	expiration time.Duration
}

func NewCachedUserRepository(r *redis.Client, user UserRepository, expiration time.Duration) UserRepository {
	return &CachedUserRepository{
		redis:      r,
		userRepo:   user,
		expiration: expiration,
	}
}

func (r CachedUserRepository) CreateUser(c context.Context, user *User) (string, error) {
	return "", nil
}

func (r CachedUserRepository) CreateUserRecipes(c context.Context, id string, recipes []*Recipe) error {
	return nil
}

func (r CachedUserRepository) FindUser(c context.Context, id string) (*User, error) {
	return nil, nil
}

func (r CachedUserRepository) FindUserByEmail(c context.Context, id string) (*User, error) {
	return nil, nil
}

func (r CachedUserRepository) FindRecipes(c context.Context, id string) ([]*Recipe, error) {
	return nil, nil
}

func (r CachedUserRepository) UpdateUser(c context.Context, user *User) error {
	return nil
}

func (r CachedUserRepository) UpdateRecipes(c context.Context, id string, recipes []*Recipe) error {
	return nil
}

func (r CachedUserRepository) DeleteUser(c context.Context, id string) error {
	return nil
}

func (r CachedUserRepository) DeleteRecipes(c context.Context, id string, ids []string) error {
	return nil
}

func NewCachedStoreRepository(r *redis.Client, store StoreRepository, expiration time.Duration) StoreRepository {
	return &CachedStoreRepository{
		redis:      r,
		storeRepo:  store,
		expiration: expiration,
	}
}

func NewCachedOrderRepository(r *redis.Client, order OrderRepository, expiration time.Duration) OrderRepository {
	return &CachedOrderRepository{
		redis:      r,
		orderRepo:  order,
		expiration: expiration,
	}
}

func NewCachedCartRepository(r *redis.Client, cart CartRepository, expiration time.Duration) CartRepository {
	return &CachedCartRepository{
		redis:      r,
		cartRepo:   cart,
		expiration: expiration,
	}
}

func NewCachedVendorRepository(r *redis.Client, vendor VendorRepository, expiration time.Duration) VendorRepository {
	return &CachedVendorRepository{
		redis:      r,
		vendorRepo: vendor,
		expiration: expiration,
	}
}
