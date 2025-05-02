package main

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"strings"
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

func (s *authService) CreateUser(ctx context.Context, com *Common) (id ID, err error) {
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

func (s *authService) Login(ctx context.Context, login *Login) (accessToken string, refreshToken string, err error) {
	ctx, span := Tracer.Start(ctx, "AuthService.Login")
	defer span.End()

	Logger.InfoContext(ctx, "User login attempt", slog.String("email", login.Email),
		slog.String("role", login.Role), auth_source)
	if err = isValidRole(login.Role); err != nil {
		Logger.ErrorContext(ctx, "Invalid role", slog.String("role", login.Role),
			slog.String("email", login.Email), auth_source)
		return
	}

	Logger.InfoContext(ctx, "Checking in db", slog.String("email", login.Email),
		slog.String("role", login.Role), auth_source)

	var com *Common
	switch login.Role {
	case "user":
		var user *User
		if user, err = Repos.User.FindUserByEmail(ctx, login.Email); err != nil {
			return
		}
		com = &user.Common
	case "vendor":
		var user *Vendor
		if user, err = Repos.Vendor.FindVendorByEmail(ctx, login.Email); err != nil {
			return
		}
		com = &user.Common
	default:
		var user *Admin
		if user, err = Repos.Admin.FindAdminByEmail(ctx, login.Email); err != nil {
			return
		}
		com = &user.Common
	}

	Logger.InfoContext(ctx, "Found in the db in db", slog.String("email", login.Email),
		slog.String("role", login.Role), auth_source)

	if err = bcrypt.CompareHashAndPassword([]byte(com.PasswordHash), []byte(login.Password)); err != nil {
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

func (s *authService) GenerateAccessToken(ctx context.Context, userID, role string) (token string, err error) {
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

	if token, err = jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString(s.jwtSecret); err != nil {
		Logger.ErrorContext(ctx, "Failed to generate access token", slog.Any("error", err), auth_source)
		return
	}
	Logger.InfoContext(ctx, "Access token generated", slog.String("userID", userID), slog.String("token", token), auth_source)
	return
}

func (s *authService) GenerateRefreshToken(ctx context.Context, userID string) (token string, err error) {
	ctx, span := Tracer.Start(ctx, "AuthService.GenerateRefreshToken")
	defer span.End()

	refreshClaims := &Claims{
		UserID: userID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(s.refreshExpiry)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "app-auth-service",
			Subject:   userID,
		},
	}

	if token, err = jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims).SignedString(s.refreshSecret); err != nil {
		Logger.ErrorContext(ctx, "Failed to generate refresh token", slog.Any("error", err), auth_source)
		return
	}

	Logger.InfoContext(ctx, "Storing the refresh token in redis", slog.String("token", token), auth_source)
	if err = s.redisClient.Set(ctx, fmt.Sprintf("refresh_token:%s", userID), token, s.refreshExpiry).Err(); err != nil {
		Logger.ErrorContext(ctx, "Failed to store refresh token", slog.Any("error", err), auth_source)
		return
	}

	Logger.InfoContext(ctx, "Refresh token successfully generated and stored in redis", slog.String("userID", userID), auth_source)
	return
}

func (s *authService) RefreshToken(ctx context.Context, refreshToken string) (string, error) {
	ctx, span := Tracer.Start(ctx, "AuthService.RefreshToken")
	defer span.End()

	token, err := jwt.ParseWithClaims(refreshToken, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return s.refreshSecret, nil
	})

	if err != nil {
		Logger.ErrorContext(ctx, "Failed to parse refresh token", slog.Any("error", err), auth_source)
		return "", errors.New("invalid refresh token")
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		Logger.ErrorContext(ctx, "Invalid refresh token claims", slog.Any("error", err), auth_source)
		return "", errors.New("invalid refresh token")
	}

	storedToken, err := s.redisClient.Get(ctx, fmt.Sprintf("refresh_token:%s", claims.UserID)).Result()
	if err != nil || storedToken != refreshToken {
		Logger.ErrorContext(ctx, "Refresh token not found or doesn't match", slog.Any("error", err), auth_source)
		return "", errors.New("invalid refresh token")
	}

	id, err := NewID(ctx, claims.UserID)
	if err != nil {
		return "", err
	}

	var com *Common
	switch claims.Role {
	case "user":
		var user *User
		if user, err = Repos.User.FindUserByID(ctx, id); err != nil {
			return "", err
		}
		com = &user.Common
	case "vendor":
		var user *Vendor
		if user, err = Repos.Vendor.FindVendorByID(ctx, id); err != nil {
			return "", err
		}
		com = &user.Common
	default:
		var user *Admin
		if user, err = Repos.Admin.FindAdminByID(ctx, id); err != nil {
			return "", err
		}
		com = &user.Common
	}

	accessToken, err := s.GenerateAccessToken(ctx, claims.UserID, com.Role)
	if err != nil {
		return "", err
	}

	Logger.InfoContext(ctx, "Token refreshed successfully", slog.String("user_id", claims.UserID), auth_source)
	return accessToken, nil
}

func (s *authService) Logout(ctx context.Context, userID string) (err error) {
	ctx, span := Tracer.Start(ctx, "AuthService.Logout")
	defer span.End()

	if err = s.redisClient.Del(ctx, fmt.Sprintf("refresh_token:%s", userID)).Err(); err != nil {
		Logger.ErrorContext(ctx, "Failed to delete refresh token", slog.Any("error", err), auth_source)
		return
	}
	Logger.InfoContext(ctx, "User logged out successfully", slog.String("user_id", userID), auth_source)
	return
}

func JWTAuthMiddleware(jwtSecret []byte) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				http.Error(w, "Authorization header missing", http.StatusUnauthorized)
				return
			}

			if !strings.HasPrefix(authHeader, "Bearer ") {
				http.Error(w, "Invalid authorization format", http.StatusUnauthorized)
				return
			}

			tokenString := strings.TrimPrefix(authHeader, "Bearer ")
			token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {

				if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
					return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
				}
				return jwtSecret, nil
			})

			if err != nil {
				http.Error(w, "Invalid token", http.StatusUnauthorized)
				return
			}

			type contextKey string
			const userIDKey contextKey = "userID"
			const userRoleKey contextKey = "userRole"

			if claims, ok := token.Claims.(*Claims); ok && token.Valid {
				ctx := context.WithValue(r.Context(), userIDKey, claims.UserID)
				ctx = context.WithValue(ctx, userRoleKey, claims.Role)

				next.ServeHTTP(w, r.WithContext(ctx))
			} else {
				http.Error(w, "Invalid token claims", http.StatusUnauthorized)
			}
		})
	}
}

func RoleAuthMiddleware(allowedRoles ...string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			role, ok := r.Context().Value("userRole").(string)
			if !ok {
				http.Error(w, "Unauthorized - missing role claim", http.StatusUnauthorized)
				return
			}

			roleAllowed := false
			for _, allowedRole := range allowedRoles {
				if role == allowedRole {
					roleAllowed = true
					break
				}
			}

			if !roleAllowed {
				http.Error(w, "Forbidden - insufficient permissions", http.StatusForbidden)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}
