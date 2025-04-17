package main

import (
	"context"
	"errors"
	"log"
	"os"
	"os/signal"
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
		return
	}

	mongoShutDown, err := initDB(ctx, os.Getenv("DB_URI"))
	if err != nil {
		return
	}

	redisShutDown, err := initRedis(ctx, os.Getenv("RD_PORT"), os.Getenv("RD_PASSWORD"), 0)
	if err != nil {
		return
	}

	defer func() {
		log.Printf("Cleaning up resources\n")
		err = errors.Join(err, otelShutDown(ctx))
		err = errors.Join(err, mongoShutDown(ctx))
		err = errors.Join(err, redisShutDown(ctx))
	}()

	select {
	case <-ctx.Done():
		stop()
	}

	return
}
