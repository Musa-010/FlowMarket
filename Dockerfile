FROM node:20 AS builder
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production
# Force binary engine to avoid N-API memory sharing issues on constrained Railway instances
ENV PRISMA_CLIENT_ENGINE_TYPE="binary"
ENV PRISMA_CLI_QUERY_ENGINE_TYPE="binary"

RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --omit=dev

# Generate the prisma client for the runtime container
RUN npx prisma generate

COPY --from=builder /app/dist ./dist

EXPOSE 3000
CMD ["node", "--max-old-space-size=256", "dist/src/main.js"]
