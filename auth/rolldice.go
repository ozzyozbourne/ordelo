package main

import (
	"fmt"
	"io"
	"log/slog"
	"math/rand"
	"net/http"
	"strconv"
)

func rolldice(w http.ResponseWriter, r *http.Request) {
	ctx, span := Tracer.Start(r.Context(), "roll")
	defer span.End()

	roll := 1 + rand.Intn(6)

	Logger.InfoContext(ctx, fmt.Sprintf("Rolled a dice: %d\n"), roll)

	res := strconv.Itoa(roll) + "\n"
	if _, err := io.WriteString(w, res); err != nil {
		Logger.ErrorContext(ctx, "Write Failed: %v\n", slog.Any("error", err))
	}
}
