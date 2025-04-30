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

func (r CachedUserRepository) CreateUser(ctx context.Context, user *User) (userID ID, err error) {
	ctx, span := Tracer.Start(ctx, "CreateUserRedis")
	defer span.End()

	if userID, err = r.userRepo.CreateUser(ctx, user); err != nil {
		return
	}
	user.ID = userID.value
	userData, err := json.Marshal(user)
	if err != nil {
		Logger.ErrorContext(ctx, "Error in Marshalling user struct", slog.Any("error", err), cached_repo)
		return
	}
	err = r.PersistInRedis(ctx, userID, userData)
	return
}

func (r CachedUserRepository) CreateRecipes(ctx context.Context, id ID, recipes []*Recipe) ([]*ID, error) {
	ctx, span := Tracer.Start(ctx, "CreateRecipesRedis")
	defer span.End()

	ids, err := r.userRepo.CreateRecipes(ctx, id, recipes)
	if err != nil {
		return nil, err
	}
	return ids, r.Invalidate(ctx, fmt.Sprintf("user:%s", id.String()), fmt.Sprintf("user:%s:recipes", id.String()))
}

func (r CachedUserRepository) CreateCarts(ctx context.Context, id ID, carts []*Cart) ([]*ID, error) {
	ctx, span := Tracer.Start(ctx, "CreateCartsRedis")
	defer span.End()

	ids, err := r.userRepo.CreateCarts(ctx, id, carts)
	if err != nil {
		return nil, err
	}
	return ids, r.Invalidate(ctx, fmt.Sprintf("user:%s", id.String()), fmt.Sprintf("user:%s:carts", id.String()))
}

func (r CachedUserRepository) CreateUserOrders(ctx context.Context, id ID, orders []*UserOrder) ([]*ID, error) {
	ctx, span := Tracer.Start(ctx, "CreateOrdersRedis")
	defer span.End()

	ids, err := r.userRepo.CreateUserOrders(ctx, id, orders)
	if err != nil {
		return nil, err
	}
	return ids, r.Invalidate(ctx, fmt.Sprintf("user:%s", id.String()), fmt.Sprintf("user:%s:orders", id.String()))
}

func (r CachedUserRepository) FindUserByID(ctx context.Context, id ID) (*User, error) {
	ctx, span := Tracer.Start(ctx, "FindUserByIDRedis")
	defer span.End()

	return nil, nil
}

func (r CachedUserRepository) FindUserByEmail(ctx context.Context, email string) (*User, error) {
	return nil, nil
}

func (r CachedUserRepository) FindRecipes(ctx context.Context, id ID) ([]*Recipe, error) {
	return nil, nil
}

func (r CachedUserRepository) FindCarts(ctx context.Context, id ID) ([]*Cart, error) {
	return nil, nil
}

func (r CachedUserRepository) FindUserOrders(ctx context.Context, id ID) ([]*UserOrder, error) {
	return nil, nil
}

func (r CachedUserRepository) UpdateUser(ctx context.Context, user *User) error {
	ctx, span := Tracer.Start(ctx, "UpdateUserRedis")
	defer span.End()

	if err := r.userRepo.UpdateUser(ctx, user); err != nil {
		return err
	}
	return r.Invalidate(ctx, fmt.Sprintf("user:%s", user.ID.Hex()))
}

func (r CachedUserRepository) UpdateRecipes(ctx context.Context, id ID, recipes []*Recipe) error {
	return nil
}

func (r CachedUserRepository) UpdateCarts(ctx context.Context, id ID, carts []*Cart) error {
	return nil
}

func (r CachedUserRepository) UpdateUserOrders(ctx context.Context, id ID, orders []*UserOrder) error {
	return nil
}

func (r CachedUserRepository) DeleteUser(ctx context.Context, id ID) error {
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

func (r CachedUserRepository) Invalidate(ctx context.Context, keys ...string) error {
	ctx, span := Tracer.Start(ctx, "InvalidateIfExists")
	defer span.End()

	if len(keys) == 0 {
		return fmt.Errorf("keys cannot be empty")
	}

	exists, err := r.redis.Exists(ctx, keys...).Result()
	if err != nil {
		Logger.ErrorContext(ctx, "Error in checking a key existance in redis", slog.Any("key", keys), cached_repo)
		return err
	}

	if exists > 0 {
		Logger.InfoContext(ctx, "Invalidating existing cache", slog.Any("key", keys), cached_repo)
		if err := r.redis.Del(ctx, keys...).Err(); err != nil {
			Logger.ErrorContext(ctx, "Failed to invalidate cache", slog.Any("error", err), cached_repo)
		} else {
			Logger.InfoContext(ctx, "Cache invalidated successfully", slog.Any("key", keys), cached_repo)
		}
	} else {
		Logger.InfoContext(ctx, "No cache found to invalidate", slog.Any("key", keys), cached_repo)
	}

	return nil
}
