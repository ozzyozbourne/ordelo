package main

import (
	"context"
	"errors"
	"log/slog"
	"os"
	"time"

	"github.com/redis/go-redis/v9"
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

func (s *authService) Register(ctx context.Context, user *User) (userID ID, err error) {
	ctx, span := Tracer.Start(ctx, "RegisterUser")
	defer span.End()

	Logger.InfoContext(ctx, "Registering a new user", slog.Any("User", user), auth_source)
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.PasswordHash), bcrypt.DefaultCost)
	if err != nil {
		Logger.ErrorContext(ctx, "Failed to hash password", slog.Any("error", err), auth_source)
		return
	}

	user.PasswordHash = string(hashedPassword)
	switch user.Role {
	case "user":
		if userID, err = s.cachedRepo.User.Create(ctx, user); err != nil {
			return
		}
	case "vender":
		// if userID, err = s.cachedRepo.Vendor.CreateUser(ctx, user); err != nil {
		// 	return
		// }
	case "admin":
		// if userID, err = s.cachedRepo.Vendor.CreateUser(ctx, user); err != nil {
		// 	return
		// }
	default:
		Logger.ErrorContext(ctx, "Invalid role", auth_source)
		err = errors.New("invalid role")
		return
	}

	Logger.InfoContext(ctx, "User registered successfully", slog.String("user_id", userID.value.Hex()), auth_source)
	return
}
