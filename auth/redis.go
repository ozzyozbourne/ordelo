package main

import (
	"context"
	"errors"
	"log/slog"
	"os"

	"github.com/redis/go-redis/extra/redisotel/v9"
	"github.com/redis/go-redis/v9"
)

var (
	RedisClient  *redis.Client
	redis_source = slog.Any("source", "redis-cache")
)

func initRedis(ctx context.Context) (shutdown func(ctx context.Context) error, err error) {
	addr, password, db := os.Getenv("RD_PORT"), os.Getenv("RD_PASSWORD"), 0
	Logger.
		InfoContext(
			ctx,
			"Setting up redis with Opentelemetry",
			slog.String("Addr", addr),
			slog.String("Password", password),
			slog.Int("DB", 0),
			redis_source,
		)

	var redisShutDownFunc func() error
	shutdown = func(ctx context.Context) error {
		if redisShutDownFunc != nil {
			err := redisShutDownFunc()
			redisShutDownFunc = nil
			return err
		}
		return nil
	}

	RedisClient = redis.NewClient(&redis.Options{
		Addr:     addr,
		Password: password,
		DB:       db,
	})
	if RedisClient == nil {
		Logger.ErrorContext(ctx, "New client function returned nil", slog.String("error", "client returned nil"), redis_source)
		err = errors.New("New client function returned nil")
		return
	}

	redisShutDownFunc = RedisClient.Close
	if err = redisotel.InstrumentTracing(RedisClient); err != nil {
		Logger.ErrorContext(ctx, "Closing redis client since failed to instrument Redis tracing", slog.Any("error", err), redis_source)
		err = shutdown(ctx)
		return
	}

	if err = redisotel.InstrumentMetrics(RedisClient); err != nil {
		Logger.ErrorContext(ctx, "Closing redis client since failed to instrument Redis metrics", slog.Any("error", err), redis_source)
		err = shutdown(ctx)
		return
	}

	if err = RedisClient.Ping(ctx).Err(); err != nil {
		Logger.ErrorContext(ctx, "Redis ping test failed", slog.Any("error", err), redis_source)
		err = shutdown(ctx)
		return
	}

	Logger.InfoContext(ctx, "Connected Successfully to Redis", slog.String("Ping", "Success"), redis_source)
	return
}
