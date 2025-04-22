package main

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
)

func sendResponse(ctx context.Context, w http.ResponseWriter, httpStatus int, messageMap map[string]any, source slog.Attr) (err error) {
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
	ctx, span := Tracer.Start(r.Context(), "Create User Handler")
	defer span.End()
	source := slog.String("source", "HttpCreateUser")

	sendFailure := func(err string) {
		errorResponseMap := map[string]any{
			"success": false,
			"error":   err,
		}
		if err := sendResponse(ctx, w, http.StatusBadRequest, errorResponseMap, source); err != nil {
			http.Error(w, "Oops!", http.StatusInternalServerError)
		}
	}

	var user User
	if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
		Logger.ErrorContext(ctx, "Unable to parse the request body to a user struct", slog.Any("error", err), source)
		sendFailure("Error in parsing Request body")
	}

	Logger.InfoContext(ctx, "Validating user struct fields", source)
	switch {
	case user.UserName == "":
		sendFailure("Username is empty")
		return
	case user.Email == "":
		sendFailure("Email is empty")
		return
	case user.PasswordHash == "":
		sendFailure("Password is empty")
		return
	case user.UserAddress == "":
		sendFailure("Address is empty")
		return
	case user.Role == "":
		sendFailure("role is empty")
		return
	default:
	}
	Logger.InfoContext(ctx, "Validated Successfully", source)

	if err := sendResponse(ctx, w, http.StatusOK, "", source); err != nil {
		http.Error(w, "Oops!", http.StatusInternalServerError)
	}
}
