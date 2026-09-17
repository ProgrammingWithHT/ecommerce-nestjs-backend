# Microservices Documentation — NestJS E-Commerce Backend (RabbitMQ Edition)

This repository contains a decoupled, event-driven microservices architecture for an E-Commerce platform built with **NestJS**, **TypeScript**, **RabbitMQ (AMQP)**, **MongoDB (Mongoose)**, **Redis Stack (ioredis)**, **Cloudinary**, and **Docker**.

---

## 1. System Overview & Architecture

The system consists of an **API Gateway** serving as an HTTP REST entry point, three core **RabbitMQ Microservices**, a **RabbitMQ Message Broker**, a **Redis Caching Layer**, and a central **Shared Module** containing infrastructure code, message patterns, and contracts.

```mermaid
graph TD
    Client[Client / Mobile App / Web] -->|HTTP REST / Port 3000| Gateway[API Gateway]

    subgraph Message Broker
        RMQ[RabbitMQ Broker / Port 5672 & 15672]
        Gateway -->|Publish AMQP Messages| RMQ
    end

    subgraph Internal Microservices
        RMQ -->|user_queue| UserService[User Microservice]
        RMQ -->|product_queue| ProductService[Product Microservice]
        RMQ -->|order_queue| OrderService[Order Microservice]

        OrderService -->|Publish Events to product_queue| RMQ
        ProductService -->|RPC auth.validate_token via user_queue| RMQ
        OrderService -->|RPC auth.validate_token via user_queue| RMQ
    end

    subgraph Caching Layer
        Redis[(Redis Stack / Port 6379 & 8001)]
        ProductService -->|Cache-Aside GET/SET/DELETE| Redis
    end

    subgraph Databases
        UserService --> DB1[(MongoDB: user_service_db)]
        ProductService --> DB2[(MongoDB: product_service_db)]
        OrderService --> DB3[(MongoDB: order_service_db)]
    end

    subgraph Cloud Storage
        UserService -.->|Avatar Uploads| Cloudinary[Cloudinary CDN]
        ProductService -.->|Product Images| Cloudinary
    end
```

### Key Architectural Principles
- **Database-per-Service**: Each microservice owns its isolated MongoDB database. Services never perform cross-database Mongoose joins or direct cross-service database operations.
- **RabbitMQ Message Queues**: All inter-service communication (RPC commands and events) flows asynchronously through RabbitMQ message queues (`user_queue`, `product_queue`, `order_queue`).
- **Redis Cache-Aside Pattern**: Product service uses Redis caching to serve sub-millisecond query responses (`product:{id}` with 300s TTL, `products:all` with 60s TTL). Cache is invalidated on product CRUD operations and RabbitMQ stock update events.
- **Fail-Open Resiliency**: If Redis is temporarily unavailable, `RedisService` logs the error silently and falls back directly to MongoDB without interrupting HTTP/RPC requests or throwing server errors.
- **Decoupled Security via Cached Remote Auth**: JWT tokens are passed through the gateway to individual services. `product-service` and `order-service` verify tokens locally and query `user-service` via RabbitMQ (`auth.validate_token`) to confirm user identity. Verified user sessions are cached in-memory with configurable TTL to reduce message broker RPC overhead.
- **Event-Driven Inventory Adjustment**: `order-service` emits asynchronous RabbitMQ events (`ORDER_CREATED`, `ORDER_CANCELLED`). `product-service` listens to these queue events to dynamically update stock without blocking order processing.
- **Binary File Payload Serialization**: File uploads (avatars & product images) intercepted at the HTTP Gateway are serialized into base64 payloads to traverse NestJS RabbitMQ transport boundaries seamlessly.

---

## 2. Service Topology Matrix

| Service Name | Primary Transport | Queue / Port | Database / Cache | Primary Responsibility |
| :--- | :--- | :--- | :--- | :--- |
| **API Gateway** | HTTP (Express) | Port `3000` | N/A | REST routing, Multipart file handling, RabbitMQ client proxy forwarding, Exception mapping |
| **RabbitMQ Broker** | AMQP | Ports `5672` / `15672` | N/A | Message queuing, routing exchanges, RPC reply queues, management dashboard |
| **Redis Stack** | Redis Protocol / HTTP | Ports `6379` / `8001` | In-Memory Data Store | Sub-millisecond product caching, cache invalidation, RedisInsight Web GUI dashboard |
| **User Service** | RabbitMQ (`Transport.RMQ`) | Queue: `user_queue` | `user_service_db` | User identity, Auth (JWT), Profile management, Avatar uploads, User admin, Token validation |
| **Product Service** | RabbitMQ (`Transport.RMQ`) | Queue: `product_queue` | `product_service_db` / Redis Cache | Product catalog, Inventory management, Reviews, Image uploads, Stock adjustment events, Redis Cache-Aside |
| **Order Service** | RabbitMQ (`Transport.RMQ`) | Queue: `order_queue` | `order_service_db` | Order placement, Status tracking, User snapshots, Order lifecycle events |
| **Shared Library** | N/A | N/A | N/A | Common DTOs, Guards, Remote Auth service, RMQ client factory ([`rmq.factory.ts`](file:///c:/Users/Hamza/Desktop/ecommerce-nestjs-backend/shared/microservices/rmq.factory.ts)), Exception filters |

---

## 3. Detailed Microservice Breakdown

### 3.1. API Gateway (`api-gateway`)
- **Location**: [`/api-gateway`](file:///c:/Users/Hamza/Desktop/ecommerce-nestjs-backend/api-gateway)
- **Role**: Entry point for external HTTP clients.
- **Key Modules**:
  - `AuthGatewayModule` ([`auth-gateway.module.ts`](file:///c:/Users/Hamza/Desktop/ecommerce-nestjs-backend/api-gateway/src/modules/auth/auth-gateway.module.ts)): Routes `/user/*` requests to `user_queue` on RabbitMQ.
  - `ProductsGatewayModule` ([`products-gateway.module.ts`](file:///c:/Users/Hamza/Desktop/ecommerce-nestjs-backend/api-gateway/src/modules/products/products-gateway.module.ts)): Routes `/product/*` requests to `product_queue` on RabbitMQ.
  - `OrdersGatewayModule` ([`orders-gateway.module.ts`](file:///c:/Users/Hamza/Desktop/ecommerce-nestjs-backend/api-gateway/src/modules/orders/orders-gateway.module.ts)): Routes `/orders/*` requests to `order_queue` on RabbitMQ.
- **Features**:
  - Uses `RpcClientService` to wrap NestJS `ClientProxy.send()` RxJS observables into Async Promises.
  - Applies `RpcExceptionFilter` globally to convert RPC errors from downstream microservices back into standard HTTP status codes (`400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`).
  - Intercepts file uploads (`multer` / `FileInterceptor`) and serializes them into base64 payloads using `file-upload.util.ts`.

---

### 3.2. User Microservice (`user-service`)
- **Location**: [`/user-service`](file:///c:/Users/Hamza/Desktop/ecommerce-nestjs-backend/user-service)
- **Role**: Identity Provider & User Domain.
- **Queue**: `user_queue`
- **Database**: `user_service_db` (Mongoose Schema: [`User`](file:///c:/Users/Hamza/Desktop/ecommerce-nestjs-backend/user-service/src/modules/accounts/schemas/user.schema.ts))
- **Core Operations**:
  - **Registration & Authentication**: User registration with avatar upload to Cloudinary, login with bcrypt password comparison, JWT issuing.
  - **Password Management**: Forgot password token generation (crypto SHA-256 with 15-min expiration) and reset password.
  - **Token Validation**: Exposes RPC handler `@MessagePattern(MESSAGE_PATTERNS.auth.validateToken)` which confirms if a token subject (`userId`) exists and is active.
  - **User Administration**: Listing all users, fetching user by ID, updating user role (`user` vs `admin`), and deleting user accounts.

---

### 3.3. Product Microservice (`product-service`)
- **Location**: [`/product-service`](file:///c:/Users/Hamza/Desktop/ecommerce-nestjs-backend/product-service)
- **Role**: Catalog & Inventory Management with Redis Caching.
- **Queue**: `product_queue`
- **Database**: `product_service_db` (Mongoose Schema: [`Product`](file:///c:/Users/Hamza/Desktop/ecommerce-nestjs-backend/product-service/src/modules/products/schemas/product.schema.ts))
- **Redis Cache**: [`RedisModule`](file:///c:/Users/Hamza/Desktop/ecommerce-nestjs-backend/product-service/src/redis/redis.module.ts) / [`RedisService`](file:///c:/Users/Hamza/Desktop/ecommerce-nestjs-backend/product-service/src/redis/redis.service.ts)
- **Core Operations**:
  - **Catalog Caching & Management**: Creation, updating, deleting products (Admin guarded). Uploads up to 5 product images to Cloudinary.
  - **Cache-Aside Pattern**:
    - `getProductDetails(id)`: Checks key `product:{id}` (300s TTL). Returns cache on HIT, queries MongoDB and sets cache on MISS.
    - `getAllProducts()`: Checks key `products:all` (60s TTL). Returns cache on HIT, queries MongoDB and sets cache on MISS.
  - **Cache Invalidation Rules**:
    - Product creation invalidates `products:all`.
    - Product update/deletion invalidates `product:{id}` and `products:all`.
    - Review additions/deletions invalidate `product:{id}` and `products:all`.
    - RabbitMQ stock updates (`ORDER_CREATED` / `ORDER_CANCELLED`) invalidate affected `product:{id}` keys and `products:all`.
  - **Review System**: Add reviews, get product reviews, delete reviews. Automatically calculates average ratings (`ratings`) and number of reviews (`numOfReviews`).
  - **Event Listeners for Inventory Control**:
    - `@EventPattern(MESSAGE_PATTERNS.orders.created)`: Subscribes to order creation events on `product_queue` to reduce product stock automatically and invalidate product cache.
    - `@EventPattern(MESSAGE_PATTERNS.orders.cancelled)`: Subscribes to order cancellation events on `product_queue` to restore product stock automatically and invalidate product cache.

---

### 3.4. Order Microservice (`order-service`)
- **Location**: [`/order-service`](file:///c:/Users/Hamza/Desktop/ecommerce-nestjs-backend/order-service)
- **Role**: Order Creation & Lifecycle Processing.
- **Queue**: `order_queue`
- **Database**: `order_service_db` (Mongoose Schema: [`Order`](file:///c:/Users/Hamza/Desktop/ecommerce-nestjs-backend/order-service/src/modules/orders/schemas/order.schema.ts))
- **Core Operations**:
  - **Order Placement**: Records shipping info, order items, user snapshot, prices (items, tax, shipping, total), and payment info.
  - **User Snapshots**: Stores immutable snapshot of user data (`id`, `name`, `email`, `role`) at order creation time to decouple from user updates.
  - **Order Status Flow**: `Processing` $\rightarrow$ `Shipped` $\rightarrow$ `Delivered` / `Cancelled`.
  - **Event Emission**:
    - Emits `ORDER_CREATED` event to `product_queue` upon successful order placement.
    - Emits `ORDER_CANCELLED` event to `product_queue` when an order status changes to `Cancelled`.

---

### 3.5. Shared Infrastructure Package (`shared/`)
- **Location**: [`/shared`](file:///c:/Users/Hamza/Desktop/ecommerce-nestjs-backend/shared)
- **Components**:
  - **`auth/`**:
    - [`JwtTokenService`](file:///c:/Users/Hamza/Desktop/ecommerce-nestjs-backend/shared/auth/jwt-token.service.ts): Decodes, signs, and verifies JWT tokens.
    - [`RemoteAuthService`](file:///c:/Users/Hamza/Desktop/ecommerce-nestjs-backend/shared/auth/remote-auth.service.ts): Performs remote identity verification against `user-service` via RabbitMQ `user_queue` and caches results in `AuthCacheService` for a configurable TTL (`AUTH_CACHE_TTL_MS`).
    - [`RpcAuthGuard`](file:///c:/Users/Hamza/Desktop/ecommerce-nestjs-backend/shared/auth/rpc-auth.guard.ts): Microservice RPC ExecutionContext guard validating access tokens.
    - `@Roles(...)`: Role-Based Access Control decorator.
  - **`microservices/`**:
    - [`MESSAGE_PATTERNS`](file:///c:/Users/Hamza/Desktop/ecommerce-nestjs-backend/shared/microservices/message-patterns.ts): Centralized RPC commands and event pattern keys.
    - [`RpcExceptionFilter`](file:///c:/Users/Hamza/Desktop/ecommerce-nestjs-backend/shared/microservices/rpc-exception.filter.ts): Converts exceptions into standardized `RpcException` structures.
    - [`rmq.factory.ts`](file:///c:/Users/Hamza/Desktop/ecommerce-nestjs-backend/shared/microservices/rmq.factory.ts): Helper functions `buildRmqClientRegistration()` and `buildRmqMicroserviceOptions()` for RabbitMQ transport.
    - [`service-tokens.ts`](file:///c:/Users/Hamza/Desktop/ecommerce-nestjs-backend/shared/microservices/service-tokens.ts): Injection tokens (`USER_SERVICE_CLIENT`, `PRODUCT_SERVICE_CLIENT`, `ORDER_SERVICE_CLIENT`).
  - **`cloudinary/`**:
    - Image upload service interfacing with Cloudinary API for avatar and product image storage.

---

## 4. API & Message Pattern Reference

### 4.1. Authentication & User Management Routes (`/user/*`)

| HTTP Method | API Path | RabbitMQ Command / Pattern | Destination Queue | Auth Required | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/user/register` | `auth.register` | `user_queue` | Public | Register new user with avatar |
| `POST` | `/user/login` | `auth.login` | `user_queue` | Public | Authenticate user & return JWT |
| `GET` | `/user/logout` | `auth.logout` | `user_queue` | Public | Logout current user session |
| `POST` | `/user/password/forgot` | `auth.forgot_password` | `user_queue` | Public | Generate password reset token |
| `PUT` | `/user/password/reset/:token` | `auth.reset_password` | `user_queue` | Public | Reset password using token |
| `GET` | `/user/me` | `auth.profile` | `user_queue` | Bearer Token | Fetch authenticated user profile |
| `PUT` | `/user/password/update` | `auth.update_password` | `user_queue` | Bearer Token | Change user password |
| `PUT` | `/user/me/update` | `auth.update_profile` | `user_queue` | Bearer Token | Update name, email, avatar |
| `GET` | `/user/admin/users` | `auth.find_all_users` | `user_queue` | Admin Token | List all registered users |
| `GET` | `/user/admin/user/:id` | `auth.find_user_by_id` | `user_queue` | Admin Token | Get user profile by ID |
| `PUT` | `/user/admin/user/:id` | `auth.update_user_role` | `user_queue` | Admin Token | Change user role (`user`/`admin`) |
| `DELETE` | `/user/admin/user/:id` | `auth.delete_user` | `user_queue` | Admin Token | Delete a user account |
| N/A | Inter-service RPC | `auth.validate_token` | `user_queue` | Internal RPC | Validate JWT token & payload |

---

### 4.2. Product & Inventory Routes (`/product/*`)

| HTTP Method | API Path | RabbitMQ Pattern / Event | Destination Queue | Auth Required | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/product/products` | `products.find_all` | `product_queue` | Public | Get all active products (Cached in Redis `products:all` TTL 60s) |
| `GET` | `/product/product/:id` | `products.find_one` | `product_queue` | Public | Get product details by ID (Cached in Redis `product:{id}` TTL 300s) |
| `GET` | `/product/reviews` | `products.find_reviews` | `product_queue` | Public | Fetch reviews for product |
| `PUT` | `/product/review` | `products.create_review` | `product_queue` | Bearer Token | Submit product review & invalidate product cache |
| `DELETE` | `/product/reviews` | `products.delete_review` | `product_queue` | Bearer Token | Delete a product review & invalidate product cache |
| `GET` | `/product/admin/products` | `products.find_admin` | `product_queue` | Admin Token | Get full product list for admin |
| `POST` | `/product/admin/products/new` | `products.create` | `product_queue` | Admin Token | Create product with images & invalidate product cache |
| `PUT` | `/product/admin/product/:id` | `products.update` | `product_queue` | Admin Token | Update product details/images & invalidate product cache |
| `DELETE` | `/product/admin/product/:id` | `products.delete` | `product_queue` | Admin Token | Delete a product & invalidate product cache |
| N/A | Inter-service Event | `@EventPattern('ORDER_CREATED')` | `product_queue` | Internal Event | Automatically decrease stock & invalidate product cache |
| N/A | Inter-service Event | `@EventPattern('ORDER_CANCELLED')` | `product_queue` | Internal Event | Automatically restore stock & invalidate product cache |

---

### 4.3. Order Management Routes (`/orders/*`)

| HTTP Method | API Path | RabbitMQ Pattern / Event | Destination Queue | Auth Required | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/orders/new` | `orders.create` | `order_queue` | Bearer Token | Place new order & emit `ORDER_CREATED` |
| `GET` | `/orders/me` | `orders.find_mine` | `order_queue` | Bearer Token | View authenticated user orders |
| `GET` | `/orders/:id` | `orders.find_one` | `order_queue` | Bearer Token | Get order details by ID |
| `GET` | `/orders/admin` | `orders.find_all` | `order_queue` | Admin Token | List all orders & total sales revenue |
| `PUT` | `/orders/admin/:id` | `orders.update_status` | `order_queue` | Admin Token | Update order status & emit events |
| `DELETE` | `/orders/admin/:id` | `orders.delete` | `order_queue` | Admin Token | Delete order record |

---

## 5. Configuration & Environment Variables

| Variable Name | Services | Default Value / Example | Description |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | All | `production` / `development` | Environment mode |
| `PORT` | API Gateway | `3000` | HTTP listener port |
| `RABBITMQ_URL` | All | `amqp://guest:guest@rabbitmq:5672` | RabbitMQ connection URL |
| `REDIS_HOST` | Product Service | `redis` / `localhost` | Redis server hostname |
| `REDIS_PORT` | Product Service | `6379` | Redis server port |
| `USER_SERVICE_QUEUE` | Gateway / User / Product / Order | `user_queue` | Queue for User service |
| `PRODUCT_SERVICE_QUEUE` | Gateway / Product / Order | `product_queue` | Queue for Product service |
| `ORDER_SERVICE_QUEUE` | Gateway / Order | `order_queue` | Queue for Order service |
| `MONGO_URI` | Services | `mongodb://mongodb:27017/<db_name>` | MongoDB connection string per service |
| `JWT_SECRET` | All | `change-me-in-production` | Secret key for signing/verifying JWTs |
| `JWT_EXPIRES_IN` | User Service | `1d` | Token lifetime |
| `AUTH_CACHE_TTL_MS` | Product / Order | `300000` (5 min) | Remote Auth TTL cache duration |
| `CLOUDINARY_NAME` | User / Product | User specific | Cloudinary Cloud Name |
| `CLOUDINARY_API_KEY` | User / Product | User specific | Cloudinary API Key |
| `CLOUDINARY_API_SECRET`| User / Product | User specific | Cloudinary API Secret |

---

## 6. Local Development & Deployment

### 6.1. Running via Docker Compose (Recommended)
To launch the entire stack with MongoDB, RabbitMQ message broker, Redis Stack, networking, and hot-reloading watch mode:

```bash
docker compose up --build
```

- **RabbitMQ Management Dashboard**: `http://localhost:15672` (Username: `guest`, Password: `guest`)
- **RedisInsight Web GUI Dashboard**: `http://localhost:8001` (Visual key/value & TTL inspection)

### 6.2. Running Microservices Individually
1. Ensure RabbitMQ and Redis are running locally on `amqp://localhost:5672` and `redis://localhost:6379`.
2. Start services in separate terminals:

```bash
# Terminal 1: User Service
npm run start:user-service:dev

# Terminal 2: Product Service
npm run start:product-service:dev

# Terminal 3: Order Service
npm run start:order-service:dev

# Terminal 4: API Gateway
npm run start:api-gateway:dev
```
