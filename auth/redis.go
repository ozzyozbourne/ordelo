package main

import (
	"context"
	"errors"
	"fmt"
	"log/slog"

	"github.com/redis/go-redis/extra/redisotel/v9"
	"github.com/redis/go-redis/v9"
)

var Client *redis.Client

func initRedis(ctx context.Context, addr string, password string, db int) (shutdown func(ctx context.Context) error, err error) {
	conValues := fmt.Sprintf("Addr: %s, Password: %s, DB: %d", addr, password, db)
	Logger.InfoContext(ctx, "Setting up redis with Opentelemetry", slog.Any("Options", conValues))

	var redisShutDownFunc func() error
	shutdown = func(ctx context.Context) error {
		if redisShutDownFunc != nil {
			err := redisShutDownFunc()
			redisShutDownFunc = nil
			return err
		}
		return nil
	}

	Client = redis.NewClient(&redis.Options{
		Addr:     addr,
		Password: password,
		DB:       db,
	})
	if Client == nil {
		Logger.ErrorContext(ctx, "New client function returned nil", slog.Any("error", "client return nil"))
		err = errors.New("New client function returned nil")
		return
	}

	redisShutDownFunc = Client.Close
	if err = redisotel.InstrumentTracing(Client); err != nil {
		Logger.ErrorContext(ctx, "Closing redis client since failed to instrument Redis tracing", slog.Any("error", err))
		err = shutdown(ctx)
		return
	}

	if err = redisotel.InstrumentMetrics(Client); err != nil {
		Logger.ErrorContext(ctx, "Closing redis client since failed to instrument Redis metrics", slog.Any("error", err))
		err = shutdown(ctx)
		return
	}

	if err = Client.Ping(ctx).Err(); err != nil {
		Logger.ErrorContext(ctx, "Redis ping test failed", slog.Any("error", err))
		err = shutdown(ctx)
		return
	}

	Logger.InfoContext(ctx, "Connected Successfully to Redis", slog.String("Ping", "Success"))
	return
}
