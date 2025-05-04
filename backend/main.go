package main

import (
	"context"
	"errors"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"time"

	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
)

func main() {
	log.Printf("Starting the Ordelo go backend\n")
	if err := run(); err != nil {
		log.Fatalf("Error fatal error in server -> \n%v\n", err)
	}
	log.Printf("Sever shutdown successfull with no errors\n")
}

func run() (err error) {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt)
	defer stop()

	log.Printf("Initing resources Otel, Mongo and Redis\n")
	otelShutDown, err := initOtelSDK(ctx)
	if err != nil {
		log.Printf("Error in initing otel -> %v\n", err)
		return
	}

	mongoShutDown, err := initDB(ctx)
	if err != nil {
		log.Printf("Error in initing mongoDB -> %v\n", err)
		return
	}

	redisShutDown, err := initRedis(ctx)
	if err != nil {
		log.Printf("Error in initing redis -> %v\n", err)
		return
	}

	log.Printf("Inited Successfully\n")
	defer func() {
		log.Printf("Cleaning up resources\n")
		err = errors.Join(err, mongoShutDown(context.Background()))
		err = errors.Join(err, redisShutDown(context.Background()))
		err = errors.Join(err, otelShutDown(context.Background()))
	}()

	log.Printf("Initing cached repositories and auth service\n")
	if err = InitCachedMongoRepositories(ctx, RedisClient, MongoClient, 15*time.Minute); err != nil {
		log.Printf("Error in initing cached repositories -> %v\n", err)
		return
	}
	if err = InitAuthService(ctx, Repos, RedisClient, 15*time.Minute, 7*24*time.Hour); err != nil {
		log.Printf("Error in initing auth service -> %v\n", err)
		return
	}

	log.Printf("Inited Successfully\n")

	log.Printf("Starting Server\n")
	port := os.Getenv("PORT")
	if port == "" {
		err = errors.New("env varible PORT is empty")
		return
	}
	srv := &http.Server{
		Addr:         port,
		BaseContext:  func(_ net.Listener) context.Context { return ctx },
		ReadTimeout:  2 * time.Second,
		WriteTimeout: 10 * time.Second,
		Handler:      newHTTPHandler(),
	}

	srvErr := make(chan error, 1)
	go func() {
		srvErr <- srv.ListenAndServe()
	}()
	log.Printf("Server started on port -> %s\n", port)

	select {
	case err = <-srvErr:
		return
	case <-ctx.Done():
		stop()
	}

	err = srv.Shutdown(context.Background())
	return
}

func newHTTPHandler() http.Handler {
	mux := http.NewServeMux()

	handleFunc := func(pattern string, hand http.Handler) {
		handler := otelhttp.WithRouteTag(pattern, hand)
		mux.Handle(pattern, handler)
	}

	mid := AuthService.JWTAuthMiddleware()
	admin := RoleAuthMiddleware("admin")
	vendor := RoleAuthMiddleware("vendor")
	user := RoleAuthMiddleware("user")

	handleFunc("POST /register", http.HandlerFunc(CreateUser))
	handleFunc("POST /login", http.HandlerFunc(UserLogin))

	handleFunc("DELETE /admin/{id}", mid(admin(http.HandlerFunc(DeleteAdmin))))
	handleFunc("DELETE /vendor/{id}", mid(vendor(http.HandlerFunc(DeleteVendor))))
	handleFunc("DELETE /user/{id}", mid(user(http.HandlerFunc(DeleteUser))))

	handler := otelhttp.NewHandler(mux, "/")
	return CORSMiddleware(handler)
}

func CORSMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
		w.Header().Set("Access-Control-Max-Age", "3600")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		next.ServeHTTP(w, r)
	})
}
