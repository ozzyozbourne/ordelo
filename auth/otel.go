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
	"go.opentelemetry.io/otel/exporters/otlp/otlplog/otlploggrpc"
	"go.opentelemetry.io/otel/exporters/otlp/otlpmetric/otlpmetricgrpc"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc"
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

func initOtelSDK(ctx context.Context) (shutdown func(context.Context) error, err error) {
	if schema == "" {
		err = errors.New("Env variable OTEL_SERVICE_NAME is empty!")
		return
	}

	lgtm_grpc_endpoint, honeycomb_grpc_endpoint, honeycomb_api_key :=
		os.Getenv("LGTM_GRPC_ENDPOINT"), os.Getenv("HONEYCOMB_API_GRPC_ENDPOINT"), os.Getenv("HONEYCOMB_API_KEY")
	if lgtm_grpc_endpoint == "" {
		err = errors.New("Env variable LGTM_GRPC_ENDPOINT is empty!")
		return
	}
	if honeycomb_grpc_endpoint == "" {
		err = errors.New("Env variable HONEYCOMB_API_GRPC_ENDPOINT is empty!")
		return
	}
	if honeycomb_api_key == "" {
		err = errors.New("Env variable HONEYCOMB_API_KEY is empty!")
		return
	}

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
	lgtmTraceExporter, err := otlptrace.New(ctx, otlptracegrpc.NewClient(
		otlptracegrpc.WithEndpoint(lgtm_grpc_endpoint),
		otlptracegrpc.WithInsecure(),
	))
	if err != nil {
		handleErr(err)
		return
	}
	shutDownFuncs = append(shutDownFuncs, lgtmTraceExporter.Shutdown)

	// 2. Honeycomb Trace Exporter
	honeycombTraceExporter, err := otlptrace.New(ctx, otlptracegrpc.NewClient(
		otlptracegrpc.WithEndpoint(honeycomb_grpc_endpoint),
		otlptracegrpc.WithHeaders(map[string]string{
			"x-honeycomb-team": honeycomb_api_key,
		}),
	))
	if err != nil {
		handleErr(err)
		return
	}
	shutDownFuncs = append(shutDownFuncs, honeycombTraceExporter.Shutdown)

	traceProvider := trace.NewTracerProvider(
		trace.WithResource(res),
		trace.WithBatcher(lgtmTraceExporter, trace.WithBatchTimeout(5*time.Second)),
		trace.WithBatcher(honeycombTraceExporter, trace.WithBatchTimeout(5*time.Second)))

	otel.SetTracerProvider(traceProvider)

	// ---------- Metric Exporters ----------

	// 1. LGTM Metric Exporter
	lgtmMetricExporter, err := otlpmetricgrpc.New(ctx,
		otlpmetricgrpc.WithEndpoint(lgtm_grpc_endpoint),
		otlpmetricgrpc.WithInsecure(),
	)
	if err != nil {
		handleErr(err)
		return
	}
	// 2. Honeycomb Metric Exporter
	honeycombMetricExporter, err := otlpmetricgrpc.New(ctx,
		otlpmetricgrpc.WithEndpoint(honeycomb_grpc_endpoint),
		otlpmetricgrpc.WithHeaders(map[string]string{
			"x-honeycomb-team": honeycomb_api_key,
		}),
	)
	if err != nil {
		handleErr(err)
		return
	}

	meterProvider := metric.NewMeterProvider(metric.WithResource(res),
		metric.WithReader(metric.NewPeriodicReader(lgtmMetricExporter, metric.WithInterval(5*time.Second))),
		metric.WithReader(metric.NewPeriodicReader(honeycombMetricExporter, metric.WithInterval(5*time.Second))),
	)
	shutDownFuncs = append(shutDownFuncs, meterProvider.Shutdown)
	otel.SetMeterProvider(meterProvider)

	// ---------- Log Exporters ----------

	// 1. LGTM Log Exporter
	lgtmLogExporter, err := otlploggrpc.New(ctx,
		otlploggrpc.WithEndpoint(lgtm_grpc_endpoint),
		otlploggrpc.WithInsecure(),
	)
	if err != nil {
		handleErr(err)
		return
	}
	// 2. Honeycomb Log Exporter
	honeycombLogExporter, err := otlploggrpc.New(ctx,
		otlploggrpc.WithEndpoint(honeycomb_grpc_endpoint),
		otlploggrpc.WithHeaders(map[string]string{
			"x-honeycomb-team": honeycomb_api_key,
		}),
	)
	if err != nil {
		handleErr(err)
		return
	}

	loggerProvider := log.NewLoggerProvider(log.WithResource(res),
		log.WithProcessor(log.NewBatchProcessor(lgtmLogExporter, log.WithExportInterval(5*time.Second))),
		log.WithProcessor(log.NewBatchProcessor(honeycombLogExporter, log.WithExportInterval(5*time.Second))),
	)
	shutDownFuncs = append(shutDownFuncs, loggerProvider.Shutdown)
	global.SetLoggerProvider(loggerProvider)

	if err = runtime.Start(runtime.WithMinimumReadMemStatsInterval(time.Second)); err != nil {
		Logger.ErrorContext(ctx, "otel runtime instrumentation failed:", slog.Any("error", err))
	}
	return
}
