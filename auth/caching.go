package main

import (
	"context"
	"log/Slog"
	"time"

	"github.com/redis/go-redis/v9"
	"go.mongodb.org/mongo-driver/v2/mongo"
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

func InitCachedMongoRepositories(ctx context.Context, redisClient *redis.Client, mongoClient *mongo.Client, cacheTTL time.Duration) error {
	mongoRepos, err := initMongoRepositories(mongoClient)
	if err != nil {
		Logger.ErrorContext(ctx, "Unable to init Repos", slog.Any("error", err), slog.String("source", "repos"))
		return err
	}

	mongoRepos.User = NewCachedUserRepository(redisClient, mongoRepos.User, cacheTTL)
	mongoRepos.Store = NewCachedOrderRepository(redisClient, mongoRepos.Store, cacheTTL)
	mongoRepos.Order = NewCachedOrderRepository(redisClient, mongoRepos.Order, cacheTTL)
	mongoRepos.Cart = NewCachedCartRepository(redisClient, mongoRepos.Cart, cacheTTL)
	mongoRepos.Vendor = NewCachedVendorRepository(redisClient, mongoRepos.Vendor, cacheTTL)

	Repos = mongoRepos
	return nil
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
