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

func InitCachedMongoRepositories(ctx context.Context, redisClient *redis.Client, mongoClient *mongo.Client, cacheTTL time.Duration) error {
	ctx, span := Tracer.Start(ctx, "InitCachedMongoRepositories")
	defer span.End()

	mongoRepos, err := initMongoRepositories(mongoClient)
	if err != nil {
		Logger.ErrorContext(ctx, "Unable to init Repos", slog.Any("error", err), slog.String("source", "repos"))
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

	if userID, err = r.userRepo.Create(ctx, user); err != nil {
		return
	}

	Logger.InfoContext(ctx, "Persisting user in redis", slog.Any("userId", userID.String()), redis_source)
	user.ID = userID.value

	userData, err := json.Marshal(user)
	if err != nil {
		Logger.ErrorContext(ctx, "Error in marshing the persisted user struct", slog.Any("userId", userID.String()), redis_source)
		return
	}

	result := r.redis.Set(ctx, fmt.Sprintf("user:%s", userID.String()), userData, r.expiration)
	if result.Err() != nil {
		Logger.ErrorContext(ctx, "Unable to persist in Redis", slog.Any("error", err), slog.Any("Redis result", result), redis_source)
		err = result.Err()
		return
	}

	Logger.InfoContext(ctx, "Persisted Successfully", redis_source)
	return
}

func (r CachedUserRepository) CreateRecipes(ctx context.Context, id ID, recipes []*Recipe) error {
	return nil
}

func (r CachedUserRepository) CreateCarts(ctx context.Context, id ID, carts []*Cart) error {
	return nil
}

func (r CachedUserRepository) CreateOrders(ctx context.Context, id ID, orders []*UserOrder) error {
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
