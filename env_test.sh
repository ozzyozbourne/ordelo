set -xe
 
export SPOONACULAR_API_KEY="<enter-value>"

# Backend server properties
export PORT=":8080"
export JWT_SECRET="68c25ff615073a0e83eac48ba6f0c89f3ef4571ac3b0080111b02d341aedbf79"
export REFRESH_SECRET="026312bdf88154b35e22e41be09674abd4a964493f7b76f170b8ff8b8119a9eb"

# MongoDB
export DB_URI="mongodb+srv://ahmedz17:BZVGyZytG0rSjrFr@cluster0.kuqjw.mongodb.net/"
export DB_NAME="ordelo"

# Redis
export RD_PORT="localhost:6379"
export RD_PASSWORD="myStrongPassword"

# honeycomb Observabilty
export HONEYCOMB_API_HTTP_ENDPOINT="api.honeycomb.io:443"
export HONEYCOMB_API_GRPC_ENDPOINT="api.honeycomb.io"
export OTEL_SERVICE_NAME="ordelo"
export HONEYCOMB_API_KEY="hcaik_01jt4xk1cmxmmgv4ns8fwn1y329gjat8naqnt77q2g5zppeede4nqtcd9j"

# LGTM Observability
export LGTM_HTTP_ENDPOINT="localhost:4318"
export LGTM_GRPC_ENDPOINT="localhost:4317"

# DONT PUSH UDATES TO THIS FILE 
git update-index --assume-unchanged env.sh

set +xe
