package main

import "net/http"

func CreateUser(w http.ResponseWriter, r *http.Request) {
	ctx, span := Tracer.Start(r.Context(), "Create User Handler")
	defer span.End()

}
