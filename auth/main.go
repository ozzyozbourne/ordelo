package main

import (
	"context"
	"errors"
	"log"
	"os"
	"os/signal"
)

func main() {
	if err := run(); err != nil {
		log.Fatalf("Error fatal error in server startup -> \n%v\n", err)
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

	select {
	case <-ctx.Done():
		stop()
	}

	return
}
