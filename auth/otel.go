package main

import (
	"context"
	"errors"
	"log/slog"
	"os"
	"time"

	"go.opentelemetry.io/contrib/bridges/otelslog"
	"go.opentelemetry.io/contrib/instrumentation/runtime"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/exporters/otlp/otlplog/otlploghttp"
	"go.opentelemetry.io/otel/exporters/otlp/otlpmetric/otlpmetrichttp"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp"
	"go.opentelemetry.io/otel/log/global"
	"go.opentelemetry.io/otel/propagation"
	"go.opentelemetry.io/otel/sdk/log"
	"go.opentelemetry.io/otel/sdk/metric"
	"go.opentelemetry.io/otel/sdk/resource"
	"go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.26.0"
)

var (
	schema = os.Getenv("OTEL_SERVICE_NAME")
	Tracer = otel.Tracer(schema)
	Logger = otelslog.NewLogger(schema)
)

func setupOtelSDK(ctx context.Context) (shutdown func(context.Context) error, err error) {
	var shutDownFuncs []func(context.Context) error

	shutdown = func(ctx context.Context) error {
		var err error
		for _, fn := range shutDownFuncs {
			err = errors.Join(err, fn(ctx))
		}
		shutDownFuncs = nil
		return err
	}

	handleErr := func(inErr error) {
		err = errors.Join(inErr, shutdown(ctx))
	}

	res, err := resource.New(ctx,
		resource.WithAttributes(
			semconv.ServiceName(schema),
			semconv.ServiceVersion("1.0.0"),
		),
	)

	if err != nil {
		handleErr(err)
		return
	}

	prop := propagation.NewCompositeTextMapPropagator(propagation.TraceContext{}, propagation.Baggage{})
	otel.SetTextMapPropagator(prop)
	// ---------- Trace Exporters ----------

	// 1. LGTM Trace Exporter
	lgtmTraceExporter, err := otlptrace.New(ctx, otlptracehttp.NewClient(
		otlptracehttp.WithEndpoint(os.Getenv("LGTM_HTTP_ENDPOINT")),
		otlptracehttp.WithInsecure(),
	))
	if err != nil {
		handleErr(err)
		return
	}
	shutDownFuncs = append(shutDownFuncs, lgtmTraceExporter.Shutdown)

	// 2. Honeycomb Trace Exporter
	honeycombTraceExporter, err := otlptrace.New(ctx, otlptracehttp.NewClient(
		otlptracehttp.WithEndpoint(os.Getenv("HONEYCOMB_API_ENDPOINT")),
		otlptracehttp.WithHeaders(map[string]string{
			"x-honeycomb-team": os.Getenv("HONEYCOMB_API_KEY"),
		}),
	))
	if err != nil {
		handleErr(err)
		return
	}
	shutDownFuncs = append(shutDownFuncs, honeycombTraceExporter.Shutdown)

	traceProvider := trace.NewTracerProvider(
		trace.WithResource(res),
		trace.WithBatcher(lgtmTraceExporter),
		trace.WithBatcher(honeycombTraceExporter))

	otel.SetTracerProvider(traceProvider)

	// ---------- Metric Exporters ----------

	// 1. LGTM Metric Exporter
	lgtmMetricExporter, err := otlpmetrichttp.New(ctx,
		otlpmetrichttp.WithEndpoint(os.Getenv("LGTM_HTTP_ENDPOINT")),
		otlpmetrichttp.WithInsecure(),
	)
	if err != nil {
		handleErr(err)
		return
	}
	// 2. Honeycomb Metric Exporter
	honeycombMetricExporter, err := otlpmetrichttp.New(ctx,
		otlpmetrichttp.WithEndpoint(os.Getenv("HONEYCOMB_API_ENDPOINT")),
		otlpmetrichttp.WithHeaders(map[string]string{
			"x-honeycomb-team": os.Getenv("HONEYCOMB_API_KEY"),
		}),
	)
	if err != nil {
		handleErr(err)
		return
	}

	meterProvider := metric.NewMeterProvider(metric.WithResource(res),
		metric.WithReader(metric.NewPeriodicReader(lgtmMetricExporter)),
		metric.WithReader(metric.NewPeriodicReader(honeycombMetricExporter)),
	)
	shutDownFuncs = append(shutDownFuncs, meterProvider.Shutdown)
	otel.SetMeterProvider(meterProvider)

	// ---------- Log Exporters ----------

	// 1. LGTM Log Exporter
	lgtmLogExporter, err := otlploghttp.New(ctx,
		otlploghttp.WithEndpoint(os.Getenv("LGTM_HTTP_ENDPOINT")),
		otlploghttp.WithInsecure(),
	)
	if err != nil {
		handleErr(err)
		return
	}
	// 2. Honeycomb Log Exporter
	honeycombLogExporter, err := otlploghttp.New(ctx,
		otlploghttp.WithEndpoint(os.Getenv("HONEYCOMB_API_ENDPOINT")),
		otlploghttp.WithHeaders(map[string]string{
			"x-honeycomb-team": os.Getenv("HONEYCOMB_API_KEY"),
		}),
	)
	if err != nil {
		handleErr(err)
		return
	}

	loggerProvider := log.NewLoggerProvider(log.WithResource(res),
		log.WithProcessor(log.NewBatchProcessor(lgtmLogExporter)),
		log.WithProcessor(log.NewBatchProcessor(honeycombLogExporter)),
	)
	shutDownFuncs = append(shutDownFuncs, loggerProvider.Shutdown)
	global.SetLoggerProvider(loggerProvider)

	err = runtime.Start(runtime.WithMinimumReadMemStatsInterval(time.Second))
	if err != nil {
		Logger.ErrorContext(ctx, "otel runtime instrumentation failed:", slog.Any("error", err))
	}
	return
}
