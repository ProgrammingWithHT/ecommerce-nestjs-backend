FROM node:20-alpine AS builder

WORKDIR /app

COPY tsconfig.json ./
COPY shared ./shared
COPY user-service/package*.json ./user-service/

WORKDIR /app/user-service
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

WORKDIR /app
COPY user-service ./user-service

WORKDIR /app/user-service
RUN npm run build

FROM node:20-alpine

ENV NODE_ENV=production

WORKDIR /app
COPY user-service/package*.json ./user-service/

WORKDIR /app/user-service
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi

COPY --from=builder /app/user-service/dist ./dist

CMD ["node", "dist/user-service/src/main.js"]
