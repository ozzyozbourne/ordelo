package main

import (
	"context"
	"errors"
	"log"
	"os"
	"os/signal"
)

func main() {
	log.Printf("Running the app\n")
	log.Printf("%s\n%s\n%s\n", os.Getenv("HONEYCOMB_API_ENDPOINT"), os.Getenv("OTEL_SERVICE_NAME"), os.Getenv("HONEYCOMB_API_KEY"))
	if err := run(); err != nil {
		log.Fatalln(err)
	}
}

func run() (err error) {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt)
	defer stop()

	otelShutDown, err := setupOtelSDK(ctx)
	if err != nil {
		return
	}
	defer func() {
		err = errors.Join(err, otelShutDown(context.Background()))
	}()

	Logger.InfoContext(ctx, "Operation completed")

	select {
	case <-ctx.Done():
		log.Printf("recieved ctrl-c\n")
		stop()
	}

	return
}
