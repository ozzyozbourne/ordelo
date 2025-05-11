#!/bin/bash

# use this for running the back end test framework
set -xe
 
export SPOONACULAR_API_KEY="<enter-value>"

# Backend server properties
export PORT=":8080"
export JWT_SECRET=""
export REFRESH_SECRET=""

# MongoDB
export DB_URI="<enter-value>"
export DB_NAME="ordelo_test"

# Redis
export RD_PORT="localhost:6379"
export RD_PASSWORD="myStrongPassword"

# honeycomb Observabilty
export HONEYCOMB_API_HTTP_ENDPOINT="api.honeycomb.io:443"
export HONEYCOMB_API_GRPC_ENDPOINT="api.honeycomb.io"
export OTEL_SERVICE_NAME="ordelo_test"
export HONEYCOMB_API_KEY="<enter-value>"

# LGTM Observability
export LGTM_HTTP_ENDPOINT="localhost:4318"
export LGTM_GRPC_ENDPOINT="localhost:4317"

# DONT PUSH UDATES TO THIS FILE 
git update-index --assume-unchanged env_test.sh

set +xe
