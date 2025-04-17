package main

import (
	"context"
	"fmt"
	"log/slog"

	"github.com/redis/go-redis/extra/redisotel/v9"
	"github.com/redis/go-redis/v9"
)

func initRedis(ctx context.Context, addr string, password string, db int) (client *redis.Client, err error) {
	conValues := fmt.Sprintf("Addr: %s, Password: %s, DB: %d", addr, password, db)
	Logger.InfoContext(ctx, "Setting up redis with Opentelemetry", slog.Any("Options", conValues))

	client = redis.NewClient(&redis.Options{
		Addr:     addr,
		Password: password,
		DB:       db,
	})

	if err = redisotel.InstrumentTracing(client); err != nil {
		Logger.ErrorContext(ctx, "Closing redis client since failed to instrument Redis tracing", slog.Any("error", err))
		return nil, client.Close()
	}

	if err = redisotel.InstrumentMetrics(client); err != nil {
		Logger.ErrorContext(ctx, "Closing redis client since failed to instrument Redis metrics", slog.Any("error", err))
		return nil, client.Close()
	}

	if err = client.Ping(ctx).Err(); err != nil {
		Logger.ErrorContext(ctx, "Redis ping test failed", slog.Any("error", err))
		return nil, client.Close()
	}

	Logger.InfoContext(ctx, "Connected Successfully to Redis", slog.String("Ping", "Success"))
	return
}
