#!/bin/bash

set -xe
 
export SPOONACULAR_API_KEY="<enter-value>"

# Backend server port 
export PORT="8080"

# MongoDB
export DB_URI="<enter-value>"
export DB_NAME="test"

# Redis
export RD_PORT="localhost:6379"
export RD_PASSWORD="myStrongPassword"

# honeycomb Observabilty
export HONEYCOMB_API_HTTP_ENDPOINT="api.honeycomb.io:443"
export HONEYCOMB_API_GRPC_ENDPOINT="api.honeycomb.io"
export OTEL_SERVICE_NAME="ordelo"
export HONEYCOMB_API_KEY="<enter-value>"

# LGTM Observability
export LGTM_HTTP_ENDPOINT="localhost:4318"
export LGTM_GRPC_ENDPOINT="localhost:4317"

export OTEL_METRIC_EXPORT_INTERVAL="5000"

# DONT PUSH UDATES TO THIS FILE 
git update-index --assume-unchanged env.sh

set +xe
