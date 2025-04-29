package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"time"

	"github.com/redis/go-redis/v9"
	"go.mongodb.org/mongo-driver/v2/mongo"
)

type CachedUserRepository struct {
	redis      *redis.Client
	userRepo   UserRepository
	expiration time.Duration
}

var cached_repo = slog.String("source", "cached_repo")

func InitCachedMongoRepositories(ctx context.Context, redisClient *redis.Client, mongoClient *mongo.Client, cacheTTL time.Duration) error {
	ctx, span := Tracer.Start(ctx, "InitCachedMongoRepositories")
	defer span.End()

	mongoRepos, err := initMongoRepositories(mongoClient)
	if err != nil {
		Logger.ErrorContext(ctx, "Unable to init Repos", slog.Any("error", err), cached_repo)
		return err
	}
	mongoRepos.User = &CachedUserRepository{
		redis:      redisClient,
		userRepo:   mongoRepos.User,
		expiration: cacheTTL,
	}

	Repos = mongoRepos
	return nil
}

func (r CachedUserRepository) Create(ctx context.Context, user *User) (userID ID, err error) {
	ctx, span := Tracer.Start(ctx, "CreateUserRedis")
	defer span.End()

	return
}

func (r CachedUserRepository) CreateRecipes(ctx context.Context, id ID, recipes []*Recipe) error {
	ctx, span := Tracer.Start(ctx, "CreateRecipesRedis")
	defer span.End()

	return nil
}

func (r CachedUserRepository) CreateCarts(ctx context.Context, id ID, carts []*Cart) error {
	ctx, span := Tracer.Start(ctx, "CreateCartsRedis")
	defer span.End()

	return nil
}

func (r CachedUserRepository) CreateOrders(ctx context.Context, id ID, orders []*UserOrder) error {
	ctx, span := Tracer.Start(ctx, "CreateOrdersRedis")
	defer span.End()

	return nil
}

func (r CachedUserRepository) FindByID(ctx context.Context, id ID) (*User, error) {
	return nil, nil
}

func (r CachedUserRepository) FindByEmail(ctx context.Context, email string) (*User, error) {
	return nil, nil
}

func (r CachedUserRepository) FindRecipes(ctx context.Context, id ID) ([]*Recipe, error) {
	return nil, nil
}

func (r CachedUserRepository) FindCarts(ctx context.Context, id ID) ([]*Cart, error) {
	return nil, nil
}

func (r CachedUserRepository) FindOrders(ctx context.Context, id ID) ([]*UserOrder, error) {
	return nil, nil
}

func (r CachedUserRepository) Update(ctx context.Context, user *User) error {
	return nil
}

func (r CachedUserRepository) UpdateRecipes(ctx context.Context, id ID, recipes []*Recipe) error {
	return nil
}

func (r CachedUserRepository) UpdateCarts(ctx context.Context, id ID, carts []*Cart) error {
	return nil
}

func (r CachedUserRepository) UpdateOrders(ctx context.Context, id ID, orders []*UserOrder) error {
	return nil
}

func (r CachedUserRepository) Delete(ctx context.Context, id ID) error {
	return nil
}

func (r CachedUserRepository) DeleteRecipes(ctx context.Context, id ID, ids []*ID) error {
	return nil
}

func (r CachedUserRepository) DeleteCarts(ctx context.Context, id ID, ids []*ID) error {
	return nil
}

func (r CachedUserRepository) PersistInRedis(ctx context.Context, userID ID, userData []byte) error {
	Logger.InfoContext(ctx, "Persisting user in redis", slog.Any("userId", userID.String()), cached_repo)

	result := r.redis.Set(ctx, fmt.Sprintf("user:%s", userID.String()), userData, r.expiration)
	if result.Err() != nil {
		Logger.ErrorContext(ctx, "Unable to persist in Redis", slog.Any("error", result.Err()),
			slog.Any("Redis result", result), cached_repo)
		return result.Err()
	}

	Logger.InfoContext(ctx, "Persisted Successfully", cached_repo)
	return nil
}

func (r CachedUserRepository) InvalidateIfExists(ctx context.Context, key string) error {
	ctx, span := Tracer.Start(ctx, "InvalidateIfExists")
	defer span.End()

	exists, err := r.redis.Exists(ctx, key).Result()
	if err != nil {
		Logger.ErrorContext(ctx, "Error in checking a key existance in redis", slog.String("key", key), cached_repo)
		return err
	}

	if exists > 0 {
		Logger.InfoContext(ctx, "Invalidating existing cache", slog.String("key", key), cached_repo)
		if err := r.redis.Del(ctx, key).Err(); err != nil {
			Logger.ErrorContext(ctx, "Failed to invalidate cache", slog.Any("error", err), cached_repo)
		} else {
			Logger.InfoContext(ctx, "Cache invalidated successfully", slog.String("key", key), cached_repo)
		}
	} else {
		Logger.InfoContext(ctx, "No cache found to invalidate", slog.String("key", key), cached_repo)
	}

	return nil
}
