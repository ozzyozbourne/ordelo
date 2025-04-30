package main

import (
	"context"
	"errors"
	"log/slog"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
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

func (s *authService) Register(ctx context.Context, com *Common) (id ID, err error) {
	ctx, span := Tracer.Start(ctx, "RegisterUser")
	defer span.End()

	Logger.InfoContext(ctx, "Registering a new user", slog.Any("user", *com), slog.String("role", com.Role), auth_source)
	if err = isValidRole(com.Role); err != nil {
		return
	}
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(com.PasswordHash), bcrypt.DefaultCost)
	if err != nil {
		Logger.ErrorContext(ctx, "Failed to hash password", slog.Any("error", err), auth_source)
		return
	}

	com.PasswordHash = string(hashedPassword)
	switch com.Role {
	case "user":
		if id, err = Repos.User.CreateUser(ctx, &User{Common: *com}); err != nil {
			Logger.ErrorContext(ctx, "Failed to create user", slog.Any("error", err), auth_source)
			return
		}
	case "vendor":
		if id, err = Repos.Vendor.CreateVendor(ctx, &Vendor{Common: *com}); err != nil {
			Logger.ErrorContext(ctx, "Failed to create vendor", slog.Any("error", err), auth_source)
			return
		}
	default:
		if id, err = Repos.Admin.CreateAdmin(ctx, &Admin{Common: *com}); err != nil {
			Logger.ErrorContext(ctx, "Failed to create admin", slog.Any("error", err), auth_source)
			return
		}
	}

	Logger.InfoContext(ctx, "User registered successfully", slog.String("user_id", id.String()),
		slog.String("role", com.Role), auth_source)
	return
}

func (s *authService) Login(ctx context.Context, email, password, role string) (accessToken string, refreshToken string, err error) {
	ctx, span := Tracer.Start(ctx, "AuthService.Login")
	defer span.End()

	Logger.InfoContext(ctx, "User login attempt", slog.String("email", email), slog.String("role", role), auth_source)
	if err = isValidRole(role); err != nil {
		Logger.ErrorContext(ctx, "Invalid role", slog.String("role", role), slog.String("email", email), auth_source)
		return
	}

	var com *Common
	switch role {
	case "user":
		var user *User
		if user, err = Repos.User.FindUserByEmail(ctx, email); err != nil {
			return
		}
		com = &user.Common
	case "vendor":
		var user *Vendor
		if user, err = Repos.Vendor.FindVendorByEmail(ctx, email); err != nil {
			return
		}
		com = &user.Common
	default:
		var user *Admin
		if user, err = Repos.Admin.FindAdminByEmail(ctx, email); err != nil {
			return
		}
		com = &user.Common
	}

	if err = bcrypt.CompareHashAndPassword([]byte(com.PasswordHash), []byte(password)); err != nil {
		Logger.ErrorContext(ctx, "Invalid password", slog.Any("error", err), auth_source)
		err = errors.New("invalid credentials")
		return
	}

	if accessToken, err = s.GenerateAccessToken(ctx, com.ID.Hex(), com.Role); err != nil {
		return
	}
	if refreshToken, err = s.GenerateRefreshToken(ctx, com.ID.Hex()); err != nil {
		return
	}

	Logger.InfoContext(ctx, "User login successful", slog.String("user_id", com.ID.Hex()), auth_source)
	return
}

func (s *authService) GenerateAccessToken(ctx context.Context, userID, role string) (string, error) {
	ctx, span := Tracer.Start(ctx, "AuthService.GenerateAccessToken")
	defer span.End()

	now := time.Now()
	claims := &Claims{
		UserID: userID,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(now.Add(s.accessExpiry)),
			IssuedAt:  jwt.NewNumericDate(now),
			NotBefore: jwt.NewNumericDate(now),
			Issuer:    "app-auth-service",
			Subject:   userID,
		},
	}
}

func (s *authService) GenerateRefreshToken(ctx context.Context, userID string) (string, error) {
	ctx, span := Tracer.Start(ctx, "AuthService.GenerateRefreshToken")
	defer span.End()
}
