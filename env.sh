#!/bin/bash

set -xe

# Front end 
export SPOONACULAR_API_KEY="<enter key>"

# back end 
export PORT="8080"
export DB_URI="<uri>"
export DB_NAME="test"

# honeycomb observabilty
export HONEYCOMB_API_ENDPOINT="https://api.honeycomb.io:443"
export OTEL_SERVICE_NAME="ordelo"
export HONEYCOMB_API_KEY="<enter key>"

# DONT PUSH UDATES TO THIS FILE 
git update-index --assume-unchanged env.sh

