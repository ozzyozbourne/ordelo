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

func (r CachedUserRepository) CreateRecipes(ctx context.Context, id ID, recipes []*Recipe) ([]*ID, error) {
	ctx, span := Tracer.Start(ctx, "CreateRecipesRedis")
	defer span.End()

	ukey, rkey, _, _ := getCacheKeys(id)
	if err := r.Invalidate(ctx, ukey, rkey); err != nil {
		Logger.ErrorContext(ctx, "Error in Invalidating user cache", slog.Any("error", err), cached_repo)
	}
	return r.userRepo.CreateRecipes(ctx, id, recipes)
}

func (r CachedUserRepository) CreateCarts(ctx context.Context, id ID, carts []*Cart) ([]*ID, error) {
	ctx, span := Tracer.Start(ctx, "CreateCartsRedis")
	defer span.End()

	ukey, _, ckey, _ := getCacheKeys(id)
	if err := r.Invalidate(ctx, ukey, ckey); err != nil {
		Logger.ErrorContext(ctx, "Error in Invalidating user cache", slog.Any("error", err), cached_repo)
	}
	return r.userRepo.CreateCarts(ctx, id, carts)
}

func (r CachedUserRepository) CreateUserOrders(ctx context.Context, id ID, orders []*UserOrder) ([]*ID, error) {
	ctx, span := Tracer.Start(ctx, "CreateOrdersRedis")
	defer span.End()

	ukey, _, _, okey := getCacheKeys(id)
	if err := r.Invalidate(ctx, ukey, okey); err != nil {
		Logger.ErrorContext(ctx, "Error in Invalidating user cache", slog.Any("error", err), cached_repo)
	}
	return r.userRepo.CreateUserOrders(ctx, id, orders)
}

func (r CachedUserRepository) FindUserByID(ctx context.Context, id ID) (user *User, err error) {
	ctx, span := Tracer.Start(ctx, "FindUserByIDRedis")
	defer span.End()
	uKey, _, _, _ := getCacheKeys(id)

	userData, err := r.redis.Get(ctx, uKey).Bytes()
	if err == nil {
		Logger.InfoContext(ctx, "Found in redis", slog.String("userId", id.String()), cached_repo)

		if err := json.Unmarshal(userData, &user); err != nil {
			Logger.ErrorContext(ctx, "Error unmarshaling cached user data fetching from DB",
				slog.Any("error", err), cached_repo)
		} else {
			Logger.InfoContext(ctx, "unmarshalled successfully", cached_repo)
			return user, nil
		}
	}

	Logger.InfoContext(ctx, "Fetching from DB since error in redis", slog.Any("error", err), cached_repo)
	if user, err = r.userRepo.FindUserByID(ctx, id); err != nil {
		return
	}

	Logger.InfoContext(ctx, "Fetched Successfully from DB, Persisting in redis", cached_repo)
	if userData, err = json.Marshal(user); err != nil {
		Logger.ErrorContext(ctx, "Error marshaling user for cache", slog.Any("error", err), cached_repo)
		return user, nil
	}

	if err := r.PersistInRedis(ctx, uKey, userData); err != nil {
		Logger.ErrorContext(ctx, "Error caching user in Redis", slog.Any("error", err), cached_repo)
	}

	return user, nil
}

func (r CachedUserRepository) FindUserByEmail(ctx context.Context, email string) (*User, error) {
	return r.userRepo.FindUserByEmail(ctx, email)
}

func (r CachedUserRepository) FindRecipes(ctx context.Context, id ID) (recipes []*Recipe, err error) {
	ctx, span := Tracer.Start(ctx, "FindRecipesRedis")
	defer span.End()

	_, rKey, _, _ := getCacheKeys(id)
	recipesData, err := r.redis.Get(ctx, rKey).Bytes()
	if err == nil {
		Logger.InfoContext(ctx, "Recipes found in redis", slog.String("userId", id.String()), cached_repo)

		if err := json.Unmarshal(recipesData, &recipes); err != nil {
			Logger.ErrorContext(ctx, "Error unmarshaling cached recipes data, fetching from DB",
				slog.Any("error", err), cached_repo)
		} else {
			Logger.InfoContext(ctx, "Recipes unmarshalled successfully", cached_repo)
			return recipes, nil
		}
	}

	Logger.InfoContext(ctx, "Fetching recipes from DB", slog.Any("error", err), cached_repo)
	if recipes, err = r.userRepo.FindRecipes(ctx, id); err != nil {
		return
	}

	Logger.InfoContext(ctx, "Fetched recipes successfully from DB, persisting in redis", cached_repo)
	if recipesData, err = json.Marshal(recipes); err != nil {
		Logger.ErrorContext(ctx, "Error marshaling recipes for cache", slog.Any("error", err), cached_repo)
		return recipes, nil
	}

	if err := r.PersistInRedis(ctx, rKey, recipesData); err != nil {
		Logger.ErrorContext(ctx, "Error caching recipes in Redis", slog.Any("error", err), cached_repo)
	}

	return recipes, nil
}

func (r CachedUserRepository) FindCarts(ctx context.Context, id ID) (carts []*Cart, err error) {
	ctx, span := Tracer.Start(ctx, "FindCartsRedis")
	defer span.End()

	_, _, cKey, _ := getCacheKeys(id)
	cartsData, err := r.redis.Get(ctx, cKey).Bytes()
	if err == nil {
		Logger.InfoContext(ctx, "Carts found in redis", slog.String("userId", id.String()), cached_repo)

		if err := json.Unmarshal(cartsData, &carts); err != nil {
			Logger.ErrorContext(ctx, "Error unmarshaling cached carts data, fetching from DB",
				slog.Any("error", err), cached_repo)
		} else {
			Logger.InfoContext(ctx, "Carts unmarshalled successfully", cached_repo)
			return carts, nil
		}
	}

	Logger.InfoContext(ctx, "Fetching carts from DB", slog.Any("error", err), cached_repo)
	if carts, err = r.userRepo.FindCarts(ctx, id); err != nil {
		return
	}

	Logger.InfoContext(ctx, "Fetched carts successfully from DB, persisting in redis", cached_repo)
	if cartsData, err = json.Marshal(carts); err != nil {
		Logger.ErrorContext(ctx, "Error marshaling carts for cache", slog.Any("error", err), cached_repo)
		return carts, nil
	}

	if err := r.PersistInRedis(ctx, cKey, cartsData); err != nil {
		Logger.ErrorContext(ctx, "Error caching carts in Redis", slog.Any("error", err), cached_repo)
	}

	return carts, nil
}

func (r CachedUserRepository) FindUserOrders(ctx context.Context, id ID) (orders []*UserOrder, err error) {
	ctx, span := Tracer.Start(ctx, "FindUserOrdersRedis")
	defer span.End()

	_, _, _, oKey := getCacheKeys(id)
	ordersData, err := r.redis.Get(ctx, oKey).Bytes()
	if err == nil {
		Logger.InfoContext(ctx, "Orders found in redis", slog.String("userId", id.String()), cached_repo)

		if err := json.Unmarshal(ordersData, &orders); err != nil {
			Logger.ErrorContext(ctx, "Error unmarshaling cached orders data, fetching from DB",
				slog.Any("error", err), cached_repo)
		} else {
			Logger.InfoContext(ctx, "Orders unmarshalled successfully", cached_repo)
			return orders, nil
		}
	}

	Logger.InfoContext(ctx, "Fetching orders from DB", slog.Any("error", err), cached_repo)
	if orders, err = r.userRepo.FindUserOrders(ctx, id); err != nil {
		return
	}

	Logger.InfoContext(ctx, "Fetched orders successfully from DB, persisting in redis", cached_repo)
	if ordersData, err = json.Marshal(orders); err != nil {
		Logger.ErrorContext(ctx, "Error marshaling orders for cache", slog.Any("error", err), cached_repo)
		return orders, nil
	}

	if err := r.PersistInRedis(ctx, oKey, ordersData); err != nil {
		Logger.ErrorContext(ctx, "Error caching orders in Redis", slog.Any("error", err), cached_repo)
	}

	return orders, nil
}

func (r CachedUserRepository) UpdateUser(ctx context.Context, user *Common) error {
	ctx, span := Tracer.Start(ctx, "UpdateUserRedis")
	defer span.End()

	ukey, _, _, _ := getCacheKeys(ID{user.ID})
	if err := r.Invalidate(ctx, ukey); err != nil {
		Logger.ErrorContext(ctx, "Error in Invalidating user cache", slog.Any("error", err), cached_repo)
	}
	return r.userRepo.UpdateUser(ctx, user)
}

func (r CachedUserRepository) UpdateRecipes(ctx context.Context, id ID, recipes []*Recipe) error {
	ctx, span := Tracer.Start(ctx, "UpdateRecipesRedis")
	defer span.End()

	ukey, rkey, _, _ := getCacheKeys(id)
	if err := r.Invalidate(ctx, ukey, rkey); err != nil {
		Logger.ErrorContext(ctx, "Error in Invalidating user cache", slog.Any("error", err), cached_repo)
	}
	return r.userRepo.UpdateRecipes(ctx, id, recipes)
}

func (r CachedUserRepository) UpdateCarts(ctx context.Context, id ID, carts []*Cart) error {
	ctx, span := Tracer.Start(ctx, "UpdateCartRedis")
	defer span.End()

	ukey, _, ckey, _ := getCacheKeys(id)
	if err := r.Invalidate(ctx, ukey, ckey); err != nil {
		Logger.ErrorContext(ctx, "Error in Invalidating user cache", slog.Any("error", err), cached_repo)
	}
	return r.userRepo.UpdateCarts(ctx, id, carts)
}

func (r CachedUserRepository) UpdateUserOrders(ctx context.Context, id ID, orders []*UserOrder) error {
	ctx, span := Tracer.Start(ctx, "UpdateUserOrdersRedis")
	defer span.End()

	ukey, _, _, okey := getCacheKeys(id)
	if err := r.Invalidate(ctx, ukey, okey); err != nil {
		Logger.ErrorContext(ctx, "Error in Invalidating user cache", slog.Any("error", err), cached_repo)
	}
	return r.userRepo.UpdateUserOrders(ctx, id, orders)
}

func (r CachedUserRepository) DeleteUser(ctx context.Context, id ID) error {
	ctx, span := Tracer.Start(ctx, "DeleteUserRedis")
	defer span.End()

	ukey, rkey, ckey, okey := getCacheKeys(id)
	if err := r.Invalidate(ctx, ukey, rkey, ckey, okey); err != nil {
		Logger.ErrorContext(ctx, "Error in Invalidating user cache", slog.Any("error", err), cached_repo)
	}
	return r.userRepo.DeleteUser(ctx, id)
}

func (r CachedUserRepository) DeleteRecipes(ctx context.Context, id ID, ids []*ID) error {
	ctx, span := Tracer.Start(ctx, "DeleteRecipesRedis")
	defer span.End()

	ukey, rkey, _, _ := getCacheKeys(id)
	if err := r.Invalidate(ctx, ukey, rkey); err != nil {
		Logger.ErrorContext(ctx, "Error in Invalidating user cache", slog.Any("error", err), cached_repo)
	}
	return r.userRepo.DeleteRecipes(ctx, id, ids)
}

func (r CachedUserRepository) DeleteCarts(ctx context.Context, id ID, ids []*ID) error {
	ctx, span := Tracer.Start(ctx, "DeleteCartsRedis")
	defer span.End()

	ukey, _, ckey, _ := getCacheKeys(id)
	if err := r.Invalidate(ctx, ukey, ckey); err != nil {
		Logger.ErrorContext(ctx, "Error in Invalidating user cache", slog.Any("error", err), cached_repo)
	}
	return r.userRepo.DeleteCarts(ctx, id, ids)
}

func (r CachedUserRepository) DeleteRecipeItems(ctx context.Context, docId, recipeId ID, items []bson.ObjectID) error {
	ctx, span := Tracer.Start(ctx, "DeleteRecipeItemsRedis")
	defer span.End()

	ukey, rkey, _, _ := getCacheKeys(docId)
	if err := r.Invalidate(ctx, ukey, rkey); err != nil {
		Logger.ErrorContext(ctx, "Error in Invalidating user cache", slog.Any("error", err), cached_repo)
	}
	return r.userRepo.DeleteRecipeItems(ctx, docId, recipeId, items)
}

func (r CachedUserRepository) DeleteCartItems(ctx context.Context, docId, cartId ID, items []bson.ObjectID) error {
	ctx, span := Tracer.Start(ctx, "DeleteCartItemsRedis")
	defer span.End()

	ukey, _, ckey, _ := getCacheKeys(docId)
	if err := r.Invalidate(ctx, ukey, ckey); err != nil {
		Logger.ErrorContext(ctx, "Error in Invalidating user cache", slog.Any("error", err), cached_repo)
	}
	return r.userRepo.DeleteCartItems(ctx, docId, cartId, items)
}

func (r CachedUserRepository) DeleteUserOrders(ctx context.Context, id ID, ids []*ID) error {
	ctx, span := Tracer.Start(ctx, "DeleteUserOrdersRedis")
	defer span.End()

	ukey, _, _, okey := getCacheKeys(id)
	if err := r.Invalidate(ctx, ukey, okey); err != nil {
		Logger.ErrorContext(ctx, "Error in Invalidating user cache", slog.Any("error", err), cached_repo)
	}
	return r.userRepo.DeleteUserOrders(ctx, id, ids)
}

func (r CachedUserRepository) PersistInRedis(ctx context.Context, userID string, userData []byte) error {
	ctx, span := Tracer.Start(ctx, "PersistInRedis")
	defer span.End()

	Logger.InfoContext(ctx, "Persisting user in redis", slog.Any("userId", userID), cached_repo)
	result := r.redis.Set(ctx, userID, userData, r.expiration)
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
