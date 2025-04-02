package handlers

import (
	"context"
	"encoding/json"
	"go.mongodb.org/mongo-driver/v2/bson"
	"log"
	"net/http"
	"ordelo/db"
	"ordelo/models"
	"strings"
	"time"
)

// CreateVendor creates a new vendor
func CreateVendor(w http.ResponseWriter, r *http.Request) {
	var vendor models.Vendor

	if err := json.NewDecoder(r.Body).Decode(&vendor); err != nil {
		sendResponse(w, http.StatusBadRequest, "Invalid request body", "")
		return
	}

	// Validate required fields
	if vendor.UserID.IsZero() || vendor.StoreID.IsZero() {
		sendResponse(w, http.StatusBadRequest, "User ID and Store ID are required", "")
		return
	}

	// Verify user and store exist
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var user models.User
	err := db.UsersCollection.FindOne(ctx, bson.M{"_id": vendor.UserID}).Decode(&user)
	if err != nil {
		sendResponse(w, http.StatusNotFound, "User not found", "")
		return
	}

	var store models.Store
	err = db.StoresCollection.FindOne(ctx, bson.M{"_id": vendor.StoreID}).Decode(&store)
	if err != nil {
		sendResponse(w, http.StatusNotFound, "Store not found", "")
		return
	}

	// Set ID
	vendor.ID = bson.NewObjectID()

	// Insert into database
	_, err = db.VendorsCollection.InsertOne(ctx, vendor)
	if err != nil {
		log.Printf("Error creating vendor: %v\n", err)
		sendResponse(w, http.StatusInternalServerError, "Error creating vendor", "")
		return
	}

	// Update user role if not already 'vendor'
	if user.Role != "vendor" {
		_, err = db.UsersCollection.UpdateOne(
			ctx,
			bson.M{"_id": vendor.UserID},
			bson.M{"$set": bson.M{"role": "vendor"}},
		)
		if err != nil {
			log.Printf("Error updating user role: %v\n", err)
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(vendor)
}

// GetVendor retrieves a vendor by ID
func GetVendor(w http.ResponseWriter, r *http.Request) {
	// Extract vendor ID from URL
	pathParts := strings.Split(r.URL.Path, "/")
	vendorHex := pathParts[len(pathParts)-1]

	vendorId, err := bson.ObjectIDFromHex(vendorHex)
	if err != nil {
		sendResponse(w, http.StatusBadRequest, "Invalid vendor ID format", "")
		return
	}

	// Get vendor from database
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var vendor models.Vendor
	err = db.VendorsCollection.FindOne(ctx, bson.M{"_id": vendorId}).Decode(&vendor)
	if err != nil {
		sendResponse(w, http.StatusNotFound, "Vendor not found", "")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(vendor)
}

// UpdateVendor updates a vendor
func UpdateVendor(w http.ResponseWriter, r *http.Request) {
	// Extract vendor ID from URL
	pathParts := strings.Split(r.URL.Path, "/")
	vendorHex := pathParts[len(pathParts)-1]

	vendorId, err := bson.ObjectIDFromHex(vendorHex)
	if err != nil {
		sendResponse(w, http.StatusBadRequest, "Invalid vendor ID format", "")
		return
	}

	// Decode request body
	var updateData models.Vendor
	if err := json.NewDecoder(r.Body).Decode(&updateData); err != nil {
		sendResponse(w, http.StatusBadRequest, "Invalid request body", "")
		return
	}

	// Build update document
	updateDoc := bson.M{}

	if !updateData.StoreID.IsZero() {
		updateDoc["store_id"] = updateData.StoreID
	}

	// Only update if there are fields to update
	if len(updateDoc) == 0 {
		sendResponse(w, http.StatusBadRequest, "No valid fields to update", "")
		return
	}

	// Update in database
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	result, err := db.VendorsCollection.UpdateOne(
		ctx,
		bson.M{"_id": vendorId},
		bson.M{"$set": updateDoc},
	)

	if err != nil {
		log.Printf("Error updating vendor: %v\n", err)
		sendResponse(w, http.StatusInternalServerError, "Error updating vendor", "")
		return
	}

	if result.MatchedCount == 0 {
		sendResponse(w, http.StatusNotFound, "Vendor not found", "")
		return
	}

	sendResponse(w, http.StatusOK, "Vendor updated successfully", "")
}

// DeleteVendor deletes a vendor
func DeleteVendor(w http.ResponseWriter, r *http.Request) {
	// Extract vendor ID from URL
	pathParts := strings.Split(r.URL.Path, "/")
	vendorHex := pathParts[len(pathParts)-1]

	vendorId, err := bson.ObjectIDFromHex(vendorHex)
	if err != nil {
		sendResponse(w, http.StatusBadRequest, "Invalid vendor ID format", "")
		return
	}

	// Delete from database
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	result, err := db.VendorsCollection.DeleteOne(ctx, bson.M{"_id": vendorId})
	if err != nil {
		log.Printf("Error deleting vendor: %v\n", err)
		sendResponse(w, http.StatusInternalServerError, "Error deleting vendor", "")
		return
	}

	if result.DeletedCount == 0 {
		sendResponse(w, http.StatusNotFound, "Vendor not found", "")
		return
	}

	sendResponse(w, http.StatusOK, "Vendor deleted successfully", "")
}

// GetVendors retrieves all vendors
func GetVendors(w http.ResponseWriter, r *http.Request) {
	// Get vendors from database
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	cursor, err := db.VendorsCollection.Find(ctx, bson.M{})
	if err != nil {
		log.Printf("Error retrieving vendors: %v\n", err)
		sendResponse(w, http.StatusInternalServerError, "Error retrieving vendors", "")
		return
	}
	defer cursor.Close(ctx)

	var vendors []models.Vendor
	if err = cursor.All(ctx, &vendors); err != nil {
		log.Printf("Error decoding vendors: %v\n", err)
		sendResponse(w, http.StatusInternalServerError, "Error decoding vendors", "")
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(vendors)
}
