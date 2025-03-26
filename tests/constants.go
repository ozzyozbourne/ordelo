package main

import (
	"os"
)

var (
	C  = os.Getenv("DB_URI")
	DB = os.Getenv("DB_NAME")
	P  = "http://localhost:8080/user"
)
