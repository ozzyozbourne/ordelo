package main

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
)

func sendResponse(ctx context.Context, w http.ResponseWriter, httpStatus int, messageMap *map[string]any, source slog.Attr) {
	ctx, span := Tracer.Start(ctx, "sendReponse")
	defer span.End()

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(httpStatus)

	if err := json.NewEncoder(w).Encode(messageMap); err != nil {
		Logger.ErrorContext(ctx, "Error in encoding the message map", slog.Any("error", err), source)
		http.Error(w, "Oops!", http.StatusInternalServerError)
		return
	}
}

func CreateUser(w http.ResponseWriter, r *http.Request) {
	ctx, span := Tracer.Start(r.Context(), "CreateUser")
	defer span.End()
	source := slog.String("source", "CreateUser")

	user := &Common{}
	if err := json.NewDecoder(r.Body).Decode(user); err != nil {
		Logger.ErrorContext(ctx, "Unable to parse the request body to a user struct", slog.Any("error", err), source)
		sendFailure(ctx, w, "Error in parsing Request body", source)
		return
	}

	Logger.InfoContext(ctx, "Validating user struct fields", source)
	switch {
	case user.Name == "":
		sendFailure(ctx, w, "Username is empty", source)
		return

	case user.Email == "":
		sendFailure(ctx, w, "Email is empty", source)
		return

	case user.PasswordHash == "":
		sendFailure(ctx, w, "Password is empty", source)
		return

	case user.Role == "":
		sendFailure(ctx, w, "role is empty", source)
		return
	}
	Logger.InfoContext(ctx, "Validated Successfully", source)

	userID, err := AuthService.CreateUser(ctx, user)
	if err != nil {
		sendResponse(ctx, w, http.StatusInternalServerError, &map[string]any{"success": false, "error": "Registration failed"}, source)
		return
	}

	okResponseMap := map[string]any{
		"status": true,
		"id":     userID.String(),
	}
	sendResponse(ctx, w, http.StatusCreated, &okResponseMap, source)
}

func UserLogin(w http.ResponseWriter, r *http.Request) {
	ctx, span := Tracer.Start(r.Context(), "UserLogin")
	defer span.End()
	source := slog.String("source", "UserLogin")

	var req *Login
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		Logger.ErrorContext(ctx, "Unable to parse the request body to a Login struct", slog.Any("error", err), source)
		sendFailure(ctx, w, "Error in parsing Request body", source)
		return
	}

	Logger.InfoContext(ctx, "Validating login struct fields", source)
	switch {
	case req.Email == "":
		sendFailure(ctx, w, "Email is empty", source)
		return

	case req.Password == "":
		sendFailure(ctx, w, "Password is empty", source)
		return

	case req.Role == "":
		sendFailure(ctx, w, "Role is empty", source)
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
		"role":         req.Role,
		"access_token": accessToken,
		"token_type":   "Bearer",
		"expires_in":   "900",
	}

	sendResponse(ctx, w, http.StatusOK, &okResponseMap, source)
}

func DeleteAdmin(w http.ResponseWriter, r *http.Request) {
	ctx, span := Tracer.Start(r.Context(), "DeleteAdmin")
	defer span.End()
	source := slog.String("source", "DeleteAdmin")

	id, err := NewID(ctx, r.PathValue("id"))
	if err != nil {
		Logger.Error("Unable to convert id req to ID", slog.Any("error", err), source)
		sendFailure(ctx, w, "Invalid id", source)
		return
	}

	if err = Repos.Admin.Delete(ctx, id); err != nil {
		sendFailure(ctx, w, err.Error(), source)
		return
	}
	sendResponse(ctx, w, http.StatusOK, &map[string]any{"success": true, "message": "Admin deleted successfully"}, source)

}

func DeleteVendor(w http.ResponseWriter, r *http.Request) {
	ctx, span := Tracer.Start(r.Context(), "DeleteVendor")
	defer span.End()
	source := slog.String("source", "DeleteVendor")

	id, err := NewID(ctx, r.PathValue("id"))
	if err != nil {
		Logger.Error("Unable to convert id req to ID", slog.Any("error", err), source)
		sendFailure(ctx, w, "Invalid id", source)
		return
	}

	if err = Repos.Vendor.DeleteVendor(ctx, id); err != nil {
		sendFailure(ctx, w, err.Error(), source)
		return
	}
	sendResponse(ctx, w, http.StatusOK, &map[string]any{"success": true, "message": "Vendor deleted successfully"}, source)

}

func DeleteUser(w http.ResponseWriter, r *http.Request) {
	ctx, span := Tracer.Start(r.Context(), "DeleteUser")
	defer span.End()
	source := slog.String("source", "DeleteUser")

	id, err := NewID(ctx, r.PathValue("id"))
	if err != nil {
		Logger.Error("Unable to convert id req to ID", slog.Any("error", err), source)
		sendFailure(ctx, w, "Invalid id", source)
		return
	}

	if err = Repos.User.DeleteUser(ctx, id); err != nil {
		sendFailure(ctx, w, err.Error(), source)
		return
	}
	sendResponse(ctx, w, http.StatusOK, &map[string]any{"success": true, "message": "User deleted successfully"}, source)
}

func sendFailure(ctx context.Context, w http.ResponseWriter, err string, source slog.Attr) {
	ctx, span := Tracer.Start(ctx, "SendFailure")
	defer span.End()

	errorResponseMap := map[string]any{
		"success": false,
		"error":   err,
	}
	sendResponse(ctx, w, http.StatusBadRequest, &errorResponseMap, source)
}
