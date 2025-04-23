package main

func isValidRole(role string) bool {
	return role == "admin" || role == "user" || role == "vendor"
}
