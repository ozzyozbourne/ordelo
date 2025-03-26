package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"ordelo/models"
)

func sendResponse(w http.ResponseWriter, statusCode int, message string, data any) {
	reponse := &models.APIReponse{
		Status:  statusCode,
		Message: message,
		Data:    data,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)

	if err := json.NewEncoder(w).Encode(reponse); err != nil {
		log.Fatal(err)
	}
}
