package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"time"

	"github.com/redis/go-redis/v9"
	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
)

type CachedUserRepository struct {
	redis      *redis.Client
	userRepo   UserRepository
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

func (r CachedUserRepository) CreateUser(ctx context.Context, user *User) (userID bson.ObjectID, err error) {
	ctx, span := Tracer.Start(ctx, "CreateUser Redis")
	defer span.End()

	if userID, err = r.userRepo.CreateUser(ctx, user); err != nil {
		return
	}

	Logger.InfoContext(ctx, "Persisting user in redis", slog.Any("user", user), redis_source)
	user.ID = userID

	userData, err := json.Marshal(user)
	if err != nil {
		Logger.ErrorContext(ctx, "Error in marshing the persisted user struct", slog.Any("user", user), redis_source)
		return
	}

	result := r.redis.Set(ctx, fmt.Sprintf("user:%s", userID.Hex()), userData, r.expiration)
	if result.Err() != nil {
		Logger.ErrorContext(ctx, "Unable to persist in Redis", slog.Any("error", err), slog.Any("Redis result", result), redis_source)
		err = result.Err()
		return
	}

	Logger.InfoContext(ctx, "Persisted Successfully", redis_source)
	return
}

func (r CachedUserRepository) CreateUserRecipes(ctx context.Context, id string, recipes []*Recipe) error {
	return nil
}

func (r CachedUserRepository) FindUserByID(ctx context.Context, id string) (*User, error) {
	return nil, nil
}

func (r CachedUserRepository) FindUserByEmail(ctx context.Context, id string) (*User, error) {
	return nil, nil
}

func (r CachedUserRepository) FindRecipes(ctx context.Context, id string) ([]*Recipe, error) {
	return nil, nil
}

func (r CachedUserRepository) UpdateUser(ctx context.Context, user *User) error {
	return nil
}

func (r CachedUserRepository) UpdateRecipes(ctx context.Context, id string, recipes []*Recipe) error {
	return nil
}

func (r CachedUserRepository) DeleteUser(ctx context.Context, id string) error {
	return nil
}

func (r CachedUserRepository) DeleteRecipes(ctx context.Context, id string, ids []string) error {
	return nil
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
