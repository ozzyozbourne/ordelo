package main

import (
	"context"
	"encoding/json"
	"errors"
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

	return r.userRepo.CreateUser(ctx, user)
}

func (r CachedUserRepository) CreateRecipes(ctx context.Context, id ID, recipes []*Recipe) (ids []*ID, err error) {
	ctx, span := Tracer.Start(ctx, "CreateRecipesRedis")
	defer span.End()

	ukey, rkey, _, _ := getCacheKeys(id)
	if err = r.Invalidate(ctx, ukey, rkey); err != nil {
		Logger.ErrorContext(ctx, "Error in Invalidating user cache", slog.Any("error", err), cached_repo)
	}

	ids, err_mongo := r.userRepo.CreateRecipes(ctx, id, recipes)
	err = errors.Join(err, err_mongo)
	return
}

func (r CachedUserRepository) CreateCarts(ctx context.Context, id ID, carts []*Cart) (ids []*ID, err error) {
	ctx, span := Tracer.Start(ctx, "CreateCartsRedis")
	defer span.End()

	ukey, _, ckey, _ := getCacheKeys(id)
	if err = r.Invalidate(ctx, ukey, ckey); err != nil {
		Logger.ErrorContext(ctx, "Error in Invalidating user cache", slog.Any("error", err), cached_repo)
	}

	ids, err_mongo := r.userRepo.CreateCarts(ctx, id, carts)
	err = errors.Join(err, err_mongo)
	return
}

func (r CachedUserRepository) CreateUserOrders(ctx context.Context, id ID, orders []*UserOrder) (ids []*ID, err error) {
	ctx, span := Tracer.Start(ctx, "CreateOrdersRedis")
	defer span.End()

	ukey, _, _, okey := getCacheKeys(id)
	if err = r.Invalidate(ctx, ukey, okey); err != nil {
		Logger.ErrorContext(ctx, "Error in Invalidating user cache", slog.Any("error", err), cached_repo)
	}

	ids, err_mongo := r.userRepo.CreateUserOrders(ctx, id, orders)
	err = errors.Join(err, err_mongo)
	return
}

func (r CachedUserRepository) FindUserByID(ctx context.Context, id ID) (*User, error) {
	ctx, span := Tracer.Start(ctx, "FindUserByIDRedis")
	defer span.End()

	return nil, nil
}

func (r CachedUserRepository) FindUserByEmail(ctx context.Context, email string) (*User, error) {
	return r.userRepo.FindUserByEmail(ctx, email)
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

func (r CachedUserRepository) UpdateUser(ctx context.Context, user *Common) (err error) {
	ctx, span := Tracer.Start(ctx, "UpdateUserRedis")
	defer span.End()

	ukey, _, _, _ := getCacheKeys(ID{user.ID})
	if err = r.Invalidate(ctx, ukey); err != nil {
		Logger.ErrorContext(ctx, "Error in Invalidating user cache", slog.Any("error", err), cached_repo)
	}
	err = errors.Join(err, r.userRepo.UpdateUser(ctx, user))
	return
}

func (r CachedUserRepository) UpdateRecipes(ctx context.Context, id ID, recipes []*Recipe) (err error) {
	ctx, span := Tracer.Start(ctx, "UpdateRecipesRedis")
	defer span.End()

	ukey, rkey, _, _ := getCacheKeys(id)
	if err = r.Invalidate(ctx, ukey, rkey); err != nil {
		Logger.ErrorContext(ctx, "Error in Invalidating user cache", slog.Any("error", err), cached_repo)
	}
	err = errors.Join(err, r.userRepo.UpdateRecipes(ctx, id, recipes))
	return
}

func (r CachedUserRepository) UpdateCarts(ctx context.Context, id ID, carts []*Cart) (err error) {
	ctx, span := Tracer.Start(ctx, "UpdateCartRedis")
	defer span.End()

	ukey, _, ckey, _ := getCacheKeys(id)
	if err = r.Invalidate(ctx, ukey, ckey); err != nil {
		Logger.ErrorContext(ctx, "Error in Invalidating user cache", slog.Any("error", err), cached_repo)
	}
	err = errors.Join(err, r.userRepo.UpdateCarts(ctx, id, carts))
	return
}

func (r CachedUserRepository) UpdateUserOrders(ctx context.Context, id ID, orders []*UserOrder) (err error) {
	ctx, span := Tracer.Start(ctx, "UpdateUserOrdersRedis")
	defer span.End()

	ukey, _, _, okey := getCacheKeys(id)
	if err = r.Invalidate(ctx, ukey, okey); err != nil {
		Logger.ErrorContext(ctx, "Error in Invalidating user cache", slog.Any("error", err), cached_repo)
	}
	err = errors.Join(err, r.userRepo.UpdateUserOrders(ctx, id, orders))
	return
}

func (r CachedUserRepository) DeleteUser(ctx context.Context, id ID) (err error) {
	ctx, span := Tracer.Start(ctx, "DeleteUserRedis")
	defer span.End()

	ukey, rkey, ckey, okey := getCacheKeys(id)
	if err = r.Invalidate(ctx, ukey, rkey, ckey, okey); err != nil {
		Logger.ErrorContext(ctx, "Error in Invalidating user cache", slog.Any("error", err), cached_repo)
	}
	err = errors.Join(err, r.userRepo.DeleteUser(ctx, id))
	return
}

func (r CachedUserRepository) DeleteRecipes(ctx context.Context, id ID, ids []*ID) (err error) {
	ctx, span := Tracer.Start(ctx, "DeleteRecipesRedis")
	defer span.End()

	ukey, rkey, _, _ := getCacheKeys(id)
	if err = r.Invalidate(ctx, ukey, rkey); err != nil {
		Logger.ErrorContext(ctx, "Error in Invalidating user cache", slog.Any("error", err), cached_repo)
	}
	err = errors.Join(err, r.userRepo.DeleteRecipes(ctx, id, ids))
	return
}

func (r CachedUserRepository) DeleteCarts(ctx context.Context, id ID, ids []*ID) (err error) {
	ctx, span := Tracer.Start(ctx, "DeleteCartsRedis")
	defer span.End()

	ukey, _, ckey, _ := getCacheKeys(id)
	if err = r.Invalidate(ctx, ukey, ckey); err != nil {
		Logger.ErrorContext(ctx, "Error in Invalidating user cache", slog.Any("error", err), cached_repo)
	}
	err = errors.Join(err, r.userRepo.DeleteCarts(ctx, id, ids))
	return
}

func (r CachedUserRepository) DeleteUserOrders(ctx context.Context, id ID, ids []*ID) (err error) {
	ctx, span := Tracer.Start(ctx, "DeleteUserOrdersRedis")
	defer span.End()

	ukey, _, _, okey := getCacheKeys(id)
	if err = r.Invalidate(ctx, ukey, okey); err != nil {
		Logger.ErrorContext(ctx, "Error in Invalidating user cache", slog.Any("error", err), cached_repo)
	}
	err = errors.Join(err, r.userRepo.DeleteUserOrders(ctx, id, ids))
	return
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

func getCacheKeys(id ID) (user, recipes, carts, orders string) {
	user = fmt.Sprintf("user:%s", id.String())
	recipes = fmt.Sprintf("user:%s:recipes", id.String())

	orders = fmt.Sprintf("user:%s:orders", id.String())
	carts = fmt.Sprintf("user:%s:carts", id.String())
	return
}
