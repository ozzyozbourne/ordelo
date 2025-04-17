package main

import (
	"context"
	"log/slog"
	"os"
	"sync"
	"time"

	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

var MongoClient *mongo.Client

type OtelMongoLogger struct {
	logger *slog.Logger
	mu     sync.Mutex
	ctx    context.Context
}

func NewOtelMongoLogger(ctx context.Context) *OtelMongoLogger {
	return &OtelMongoLogger{
		logger: Logger,
		ctx:    ctx,
	}
}

func (l *OtelMongoLogger) Info(level int, message string, keysAndValues ...interface{}) {
	l.mu.Lock()
	defer l.mu.Unlock()
	var logLevel slog.Level

	switch options.LogLevel(level) {
	case options.LogLevelDebug:
		logLevel = slog.LevelDebug
	case options.LogLevelInfo:
		logLevel = slog.LevelInfo
	default:
		logLevel = slog.LevelInfo
	}

	attrs := []slog.Attr{}
	if len(keysAndValues) > 0 && len(keysAndValues)%2 == 0 {
		for i := 0; i < len(keysAndValues); i += 2 {
			key, ok := keysAndValues[i].(string)
			if ok {
				attrs = append(attrs, slog.Any(key, keysAndValues[i+1]))
			}
		}
	}

	attrs = append(attrs, slog.String("source", "mongoDB"))
	l.logger.LogAttrs(l.ctx, logLevel, message, attrs...)
}

func (l *OtelMongoLogger) Error(err error, message string, keysAndValues ...interface{}) {
	l.mu.Lock()
	defer l.mu.Unlock()

	attrs := []slog.Attr{slog.Any("error", err)}
	if len(keysAndValues) > 0 && len(keysAndValues)%2 == 0 {
		for i := 0; i < len(keysAndValues); i += 2 {
			key, ok := keysAndValues[i].(string)
			if ok {
				attrs = append(attrs, slog.Any(key, keysAndValues[i+1]))
			}
		}
	}

	attrs = append(attrs, slog.Any("source", "mongodb"))
	l.logger.LogAttrs(l.ctx, slog.LevelError, message, attrs...)
}

func initDB(ctx context.Context) (shutDown func(ctx context.Context) error, err error) {
	db_uri := os.Getenv("DB_URI")
	Logger.InfoContext(ctx, "Setting up connection to the mongodb", slog.String("URI", db_uri))

	var mongoShutDownFunc func(ctx context.Context) error
	shutDown = func(ctx context.Context) error {
		if mongoShutDownFunc != nil {
			err := mongoShutDownFunc(ctx)
			mongoShutDownFunc = nil
			return err
		}
		return nil
	}

	loggerOptions := options.
		Logger().
		SetSink(NewOtelMongoLogger(ctx)).
		SetComponentLevel(options.LogComponentCommand, options.LogLevelDebug).
		SetComponentLevel(options.LogComponentConnection, options.LogLevelDebug)

	clientOptions := options.
		Client().
		ApplyURI(db_uri).
		SetMinPoolSize(5).
		SetMaxPoolSize(10).
		SetMaxConnIdleTime(5 * time.Minute).
		SetMaxConnecting(25).
		SetLoggerOptions(loggerOptions)

	if MongoClient, err = mongo.Connect(clientOptions); err != nil {
		Logger.ErrorContext(ctx, "Unable to establish connection to mongoDB", err)
		return
	}

	mongoShutDownFunc = MongoClient.Disconnect
	if err = MongoClient.Ping(ctx, nil); err != nil {
		Logger.ErrorContext(ctx, "Disconnecting client since unable to ping MongoDB after connection to check for liveness", err)
		err = shutDown(ctx)
		return
	}

	Logger.InfoContext(ctx, "Connected Successfully to mongoDB", slog.String("Ping", "Success"))
	return
}
