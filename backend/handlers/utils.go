package handlers

import (
	"encoding/json"
	"log"
	"net/http"
)

type APIReponse struct {
	Status  int    `json:"status"`
	Message string `json:"message"`
	Data    any    `json:"data,omnitempty"`
}

func sendResponse(w http.ResponseWriter, statusCode int, message string, data any) {
	reponse := &APIReponse{
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
