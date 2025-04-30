package main

import (
	"context"
	"errors"
	"log/slog"
	"os"
	"time"

	"github.com/redis/go-redis/v9"
	"go.mongodb.org/mongo-driver/v2/bson"
	"golang.org/x/crypto/bcrypt"
)

var (
	AuthService *authService
	auth_source = slog.String("source", "auth-service")
)

type authService struct {
	cachedRepo    *Repositories
	redisClient   *redis.Client
	accessExpiry  time.Duration
	refreshExpiry time.Duration
	jwtSecret     []byte
	refreshSecret []byte
}

func InitAuthService(ctx context.Context, cachedRepo *Repositories, redisClient *redis.Client,
	accessExpiry, refreshExpiry time.Duration) error {
	_, span := Tracer.Start(ctx, "initAuthService")
	defer span.End()

	jwt_secret, refresh_secret := os.Getenv("JWT_SECRET"), os.Getenv("REFRESH_SECRET")
	if jwt_secret == "" {
		return errors.New("env variable JWT_SECRET is empty")
	}
	if refresh_secret == "" {
		return errors.New("env variable REFRESH_SECRET is empty")
	}

	AuthService = &authService{
		cachedRepo,
		redisClient,
		accessExpiry,
		refreshExpiry,
		[]byte(jwt_secret),
		[]byte(refresh_secret),
	}
	return nil
}

func (s *authService) Register(ctx context.Context, username, email, password, address string, role string) (ID, error) {
	ctx, span := Tracer.Start(ctx, "RegisterUser")
	defer span.End()

	Logger.InfoContext(ctx, "Registering a new user", slog.String("email",email), slog.String("role", role), auth_source)

	if !isValidRole(role) {
		return ID{bson.NilObjectID}, errors.New("invalid role")
	}
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.PasswordHash), bcrypt.DefaultCost)
	if err != nil {
		Logger.ErrorContext(ctx, "Failed to hash password", slog.Any("error", err), auth_source)
		return ID{bson.NilObjectID}, err
	}

	user.PasswordHash = string(hashedPassword)

	Logger.InfoContext(ctx, "User registered successfully", slog.String("user_id", userID.value.Hex()), auth_source)
	return , nil
}
