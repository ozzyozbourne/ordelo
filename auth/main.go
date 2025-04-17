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

	mongoShutDown, err := initDB(ctx)
	if err != nil {
		return
	}

	redisShutDown, err := initRedis(ctx)
	if err != nil {
		return
	}

	defer func() {
		log.Printf("Cleaning up resources\n")
		err = errors.Join(err, mongoShutDown(context.Background()))
		err = errors.Join(err, redisShutDown(context.Background()))
		err = errors.Join(err, otelShutDown(context.Background()))
	}()

	select {
	case <-ctx.Done():
		stop()
	}

	return
}
