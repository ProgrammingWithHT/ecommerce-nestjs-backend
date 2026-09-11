# Ecommerce Microservices (RabbitMQ Transport)

NestJS microservices version of the ecommerce backend. All inter-service communication (RPC commands and events) routes through **RabbitMQ** message queues (`user_queue`, `product_queue`, `order_queue`) with a lightweight HTTP gateway for REST routing.

## Architecture

- `user-service`: issues JWT tokens, manages users, and handles token validation requests via `user_queue`
- `product-service`: owns product catalog and stock mutations, listens for order events on `product_queue`
- `order-service`: owns order lifecycle, dispatches inventory event patterns, and routes messages via `order_queue`
- `api-gateway`: HTTP entrypoint that forwards requests over RabbitMQ queues without performing JWT verification
- `shared`: common contracts, auth helpers, RMQ client factory, Mongo bootstrap, and error mapping

## Folder Structure

```text
ecommerce-microservices/
├── api-gateway/
├── order-service/
├── product-service/
├── shared/
├── user-service/
├── docker-compose.yml
├── MICROSERVICES.md
└── package.json
```

## Why This Layout

- Services are loosely coupled by message contracts and RabbitMQ queues instead of direct module imports or raw sockets.
- JWT signing and verification logic lives in `shared`, but each service performs its own token verification locally with in-memory TTL caching.
- `product-service` listens asynchronously for `ORDER_CREATED` and `ORDER_CANCELLED` events on `product_queue` to adjust inventory without blocking order creation.
- Each service owns its MongoDB database and never uses cross-service Mongoose relations.

## Local Development

1. Ensure RabbitMQ is running (e.g. `docker compose up rabbitmq -d` or a local RabbitMQ instance on port `5672`).
2. Start services in separate terminals:
   - `npm run start:dev` inside `user-service`
   - `npm run start:dev` inside `product-service`
   - `npm run start:dev` inside `order-service`
   - `npm run start:dev` inside `api-gateway`

## Docker

Run everything (MongoDB, RabbitMQ Broker, User Service, Product Service, Order Service, API Gateway) with:

```bash
docker compose up --build
```

Access the **RabbitMQ Management Console** at `http://localhost:15672` (default credentials: `guest` / `guest`).

For complete detailed documentation of message patterns, queues, schemas, and API endpoints, view [`MICROSERVICES.md`](file:///c:/Users/Hamza/Desktop/ecommerce-nestjs-backend/MICROSERVICES.md).
