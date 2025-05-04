package main

import (
	"context"
	"encoding/json"
	"io"
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

func CreateCarts(w http.ResponseWriter, r *http.Request) {
	ctx, span := Tracer.Start(r.Context(), "CreateCarts")
	defer span.End()
	source := slog.String("source", "CreateCarts")

	Logger.InfoContext(ctx, "Creating Carts to be added", source)
	req, err := decodeStruct[RequestCarts](ctx, r.Body, source)
	if err != nil {
		sendFailure(ctx, w, "Error in parsing carts request body", source)
		return
	}
	createCon(ctx, w, r, source, req.Carts)
	Logger.InfoContext(ctx, "Added Carts successfully", source)
}

func CreateUserOrders(w http.ResponseWriter, r *http.Request) {
	ctx, span := Tracer.Start(r.Context(), "CreateUserOrders")
	defer span.End()
	source := slog.String("source", "CreateUserOrders")

	Logger.InfoContext(ctx, "Creating UserOrders to be added", source)
	req, err := decodeStruct[RequestUserOrders](ctx, r.Body, source)
	if err != nil {
		sendFailure(ctx, w, "Error in parsing userOrders request body", source)
		return
	}
	createCon(ctx, w, r, source, req.Orders)
	Logger.InfoContext(ctx, "Added UserOrders successfully", source)

}

func CreateVendorOrders(w http.ResponseWriter, r *http.Request) {
	ctx, span := Tracer.Start(r.Context(), "CreateVendorOrders")
	defer span.End()
	source := slog.String("source", "CreateVendorOrders")

	Logger.InfoContext(ctx, "Creating VendorOrders to be added", source)
	req, err := decodeStruct[RequestVendorOrders](ctx, r.Body, source)
	if err != nil {
		sendFailure(ctx, w, "Error in parsing VendorOrders request body", source)
		return
	}
	createCon(ctx, w, r, source, req.Orders)
	Logger.InfoContext(ctx, "Added VendorOrders successfully", source)

}

func CreateStores(w http.ResponseWriter, r *http.Request) {
	ctx, span := Tracer.Start(r.Context(), "CreateStores")
	defer span.End()
	source := slog.String("source", "CreateStores")

	Logger.InfoContext(ctx, "Creating stores to be added", source)
	req, err := decodeStruct[RequestStores](ctx, r.Body, source)
	if err != nil {
		sendFailure(ctx, w, "Error in parsing Stores request body", source)
		return
	}
	createCon(ctx, w, r, source, req.Stores)
	Logger.InfoContext(ctx, "Added stores successfully", source)

}

func CreateRecipes(w http.ResponseWriter, r *http.Request) {
	ctx, span := Tracer.Start(r.Context(), "CreateRecipes")
	defer span.End()
	source := slog.String("source", "CreateRecipes")

	Logger.InfoContext(ctx, "Creating recipes to be added", source)
	req, err := decodeStruct[RequestRecipes](ctx, r.Body, source)
	if err != nil {
		sendFailure(ctx, w, "Error in parsing recipes request body", source)
		return
	}
	createCon(ctx, w, r, source, req.Recipes)
	Logger.InfoContext(ctx, "Added recipes successfully", source)
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

func createCon[C containers](ctx context.Context, w http.ResponseWriter, r *http.Request, source slog.Attr, con C) {
	var err error
	var ids []*ID

	v, ok := r.Context().Value(userIDKey).(string)
	if !ok {
		Logger.ErrorContext(ctx, "Unable to get the id String fromn context", source)
		sendFailure(ctx, w, "Oops", source)
		return
	}

	id, err := NewID(ctx, v)
	if err != nil {
		sendFailure(ctx, w, err.Error(), source)
		return
	}

	if len(con) == 0 {
		Logger.ErrorContext(ctx, "No items provided", source)
		sendFailure(ctx, w, "No items provided", source)
		return
	}

	switch c := any(con).(type) {
	case []*Cart:
		ids, err = Repos.User.CreateCarts(ctx, id, c)
	case []*Recipe:
		ids, err = Repos.User.CreateRecipes(ctx, id, c)
	case []*UserOrder:
		ids, err = Repos.User.CreateUserOrders(ctx, id, c)
	case []*Store:
		ids, err = Repos.Vendor.CreateStores(ctx, id, c)
	case []*VendorOrder:
		ids, err = Repos.Vendor.CreateVendorOrders(ctx, id, c)
	default:
		Logger.ErrorContext(ctx, "Unable to get the id String fromn context", source)
		sendFailure(ctx, w, "unknown type", source)
		return
	}

	if err != nil {
		Logger.ErrorContext(ctx, "Failed to create containers", slog.Any("error", err), source)
		sendFailure(ctx, w, "Failed to create containers", source)
		return
	}

	idStrings := make([]string, len(ids))
	for i, id := range ids {
		idStrings[i] = id.String()
	}

	okResponseMap := map[string]any{
		"success": true,
		"ids":     idStrings,
	}
	sendResponse(ctx, w, http.StatusCreated, &okResponseMap, source)
}

func decodeStruct[req ComConReq](ctx context.Context, r io.Reader, source slog.Attr) (v *req, err error) {
	Logger.Info("Decode the body to struct", source)
	if err := json.NewDecoder(r).Decode(&v); err != nil {
		Logger.ErrorContext(ctx, "Unable to parse request body", slog.Any("error", err), source)
		return nil, err
	}
	Logger.Info("Decoded Successfully", source)
	return
}
