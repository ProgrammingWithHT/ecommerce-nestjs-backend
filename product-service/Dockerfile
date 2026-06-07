FROM node:20-alpine AS builder

WORKDIR /app

COPY tsconfig.json ./
COPY shared ./shared
COPY product-service/package*.json ./product-service/

WORKDIR /app/product-service
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

WORKDIR /app
COPY product-service ./product-service

WORKDIR /app/product-service
RUN npm run build

FROM node:20-alpine

ENV NODE_ENV=production

WORKDIR /app
COPY product-service/package*.json ./product-service/

WORKDIR /app/product-service
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi

COPY --from=builder /app/product-service/dist ./dist

CMD ["node", "dist/product-service/src/main.js"]
