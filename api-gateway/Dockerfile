FROM node:20-alpine AS builder

WORKDIR /app

COPY tsconfig.json ./
COPY shared ./shared
COPY api-gateway/package*.json ./api-gateway/

WORKDIR /app/api-gateway
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

WORKDIR /app
COPY api-gateway ./api-gateway

WORKDIR /app/api-gateway
RUN npm run build

FROM node:20-alpine

ENV NODE_ENV=production

WORKDIR /app
COPY api-gateway/package*.json ./api-gateway/

WORKDIR /app/api-gateway
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi

COPY --from=builder /app/api-gateway/dist ./dist

CMD ["node", "dist/api-gateway/src/main.js"]
