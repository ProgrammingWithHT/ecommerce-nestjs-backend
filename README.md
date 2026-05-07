# Ecommerce Microservices

NestJS microservices version of the original ecommerce backend. The monolith is split into independently deployable TCP services with a lightweight HTTP gateway for routing only.

## Architecture

- `user-service`: issues JWT tokens and validates user identity for other services
- `product-service`: owns product catalog and stock mutations
- `order-service`: owns order lifecycle and talks to product-service through an inventory port
- `api-gateway`: optional HTTP entrypoint that forwards requests over TCP without performing authentication
- `shared`: common contracts, auth helpers, TCP client factory, Mongo bootstrap, and error mapping

## Folder Structure

```text
ecommerce-microservices/
├── api-gateway/
├── order-service/
├── product-service/
├── shared/
├── user-service/
├── docker-compose.yml
└── package.json
```

## Why This Layout

- Services are loosely coupled by message contracts instead of direct module imports.
- `order-service` depends on an `InventoryPort`, so the TCP client can later be swapped for Kafka or RabbitMQ without changing order domain code.
- JWT signing and verification logic lives in `shared`, but each service performs its own token verification locally.
- `product-service` and `order-service` validate the token subject with `user-service` on first use, then cache the result in memory.
- Each service owns its MongoDB database and never uses cross-service Mongoose relations.

## Local Development

1. Install dependencies with `npm install`.
2. Copy each `*.env.example` file to `.env` inside the matching service directory if you want local env files instead of shell variables.
3. Start services in separate terminals:
   - `npm run start:user-service:dev`
   - `npm run start:product-service:dev`
   - `npm run start:order-service:dev`
   - `npm run start:api-gateway:dev`

## Docker

Run everything with:

```bash
docker compose up --build
```

Gateway routes traffic to the TCP services but does not verify JWTs. Protected requests pass the bearer token through to the owning service, which validates the token locally and confirms the subject with `user-service`.
