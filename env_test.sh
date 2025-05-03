#!/bin/bash

set -xe
 
export SPOONACULAR_API_KEY="<enter-value>"

# Backend server properties
export PORT=":8080"
export JWT_SECRET="be08da515525c856782bfc6a79938fb91bdc64edd3b36384dde7866ee1a3b6cb"
export REFRESH_SECRET="93bf1b85167a8eb555c875142bc873d0bb54d8bbe89236b31a23f6f54dbddc53
"

# MongoDB
export DB_URI="mongodb+srv://shah_441:syQZIFAV7OWd79AS@cs696a.4cvpd.mongodb.net/"
export DB_NAME="ordelo"

# Redis
export RD_PORT="localhost:6379"
export RD_PASSWORD="myStrongPassword"

# honeycomb Observabilty
export HONEYCOMB_API_HTTP_ENDPOINT="api.honeycomb.io:443"
export HONEYCOMB_API_GRPC_ENDPOINT="api.honeycomb.io"
export OTEL_SERVICE_NAME="ordelo"
export HONEYCOMB_API_KEY="hcaik_01jtc2h87br4bc2amvb9pnrq3fmfsdv3p2qkx1nahjq30qkpyht6ktp4bd"

# LGTM Observability
export LGTM_HTTP_ENDPOINT="localhost:4318"
export LGTM_GRPC_ENDPOINT="localhost:4317"

# DONT PUSH UDATES TO THIS FILE 
git update-index --assume-unchanged env.sh

set +xe
