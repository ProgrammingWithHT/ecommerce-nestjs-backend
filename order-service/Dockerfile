FROM node:20-alpine AS builder

WORKDIR /app

COPY tsconfig.json ./
COPY shared ./shared
COPY order-service/package*.json ./order-service/

WORKDIR /app/order-service
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

WORKDIR /app
COPY order-service ./order-service

WORKDIR /app/order-service
RUN npm run build

FROM node:20-alpine

ENV NODE_ENV=production

WORKDIR /app
COPY order-service/package*.json ./order-service/

WORKDIR /app/order-service
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi

COPY --from=builder /app/order-service/dist ./dist

CMD ["node", "dist/order-service/src/main.js"]
