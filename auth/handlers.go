package main

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
)

func sendResponse(ctx context.Context, w http.ResponseWriter, httpStatus int, messageMap *map[string]any, source slog.Attr) (err error) {
	ctx, span := Tracer.Start(ctx, "sendReponse")
	defer span.End()

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(httpStatus)

	if err = json.NewEncoder(w).Encode(messageMap); err != nil {
		Logger.ErrorContext(ctx, "Error in encoding the message map", slog.Any("error", err), source)
		return
	}
	return
}

func CreateUser(w http.ResponseWriter, r *http.Request) {
	ctx, span := Tracer.Start(r.Context(), "CreateUser")
	defer span.End()
	source := slog.String("source", "CreateUser")

	sendFailure := func(err string) {
		errorResponseMap := map[string]any{
			"success": false,
			"error":   err,
		}
		if err := sendResponse(ctx, w, http.StatusBadRequest, &errorResponseMap, source); err != nil {
			http.Error(w, "Oops!", http.StatusInternalServerError)
		}
	}

	user := &Common{}
	if err := json.NewDecoder(r.Body).Decode(user); err != nil {
		Logger.ErrorContext(ctx, "Unable to parse the request body to a user struct", slog.Any("error", err), source)
		sendFailure("Error in parsing Request body")
		return
	}

	Logger.InfoContext(ctx, "Validating user struct fields", source)
	switch {
	case user.Name == "":
		sendFailure("Username is empty")
		return

	case user.Email == "":
		sendFailure("Email is empty")
		return

	case user.PasswordHash == "":
		sendFailure("Password is empty")
		return

	case user.Role == "":
		sendFailure("role is empty")
		return
	}
	Logger.InfoContext(ctx, "Validated Successfully", source)

	userID, err := AuthService.CreateUser(ctx, user)
	if err != nil {
		if err := sendResponse(ctx, w, http.StatusInternalServerError,
			&map[string]any{"success": false, "error": "Registration failed"}, source); err != nil {
			http.Error(w, "Oops!", http.StatusInternalServerError)
		}
		return
	}

	okResponseMap := map[string]any{
		"status": true,
		"id":     userID.String(),
	}
	if err := sendResponse(ctx, w, http.StatusCreated, &okResponseMap, source); err != nil {
		http.Error(w, "Oops!", http.StatusInternalServerError)
	}
}

func UserLogin(w http.ResponseWriter, r *http.Request) {
	ctx, span := Tracer.Start(r.Context(), "UserLogin")
	defer span.End()
	source := slog.String("source", "UserLogin")

	sendFailure := func(err string) {
		errorResponseMap := map[string]any{
			"success": false,
			"error":   err,
		}
		if err := sendResponse(ctx, w, http.StatusBadRequest, &errorResponseMap, source); err != nil {
			http.Error(w, "Oops!", http.StatusInternalServerError)
		}
	}

	var req *Login
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		Logger.ErrorContext(ctx, "Unable to parse the request body to a Login struct", slog.Any("error", err), source)
		sendFailure("Error in parsing Request body")
		return
	}

	Logger.InfoContext(ctx, "Validating login struct fields", source)
	switch {
	case req.Email == "":
		sendFailure("Email is empty")
		return

	case req.Password == "":
		sendFailure("Password is empty")
		return

	case req.Role == "":
		sendFailure("Role is empty")
		return
	}
	Logger.InfoContext(ctx, "Validated Successfully", source)

	id, accessToken, refreshToken, err := AuthService.Login(ctx, req)
	if err != nil {
		Logger.ErrorContext(ctx, "Error getting accessToken and refreshToken from auth service", slog.Any("error", err), source)
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:     "refresh_token",
		Value:    refreshToken,
		Path:     "/",
		HttpOnly: true,
		Secure:   false,
		SameSite: http.SameSiteStrictMode,
		MaxAge:   60 * 60 * 24 * 7,
	})

	okResponseMap := map[string]any{
		"_id":          id.String(),
		"access_token": accessToken,
		"token_type":   "Bearer",
		"expires_in":   "900",
	}

	if err := sendResponse(ctx, w, http.StatusOK, &okResponseMap, source); err != nil {
		http.Error(w, "Oops!", http.StatusInternalServerError)
	}
}
