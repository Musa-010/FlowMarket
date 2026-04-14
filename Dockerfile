FROM node:20 AS builder
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production

# Install OpenSSL & CA Certificates securely (required by Prisma for DB SSL connections)
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Copy package and prisma schema FIRST
COPY package*.json ./
COPY prisma ./prisma/

# Install only production dependencies and strictly generate the prisma client
RUN npm ci --omit=dev
RUN npx prisma generate

# Copy built files
COPY --from=builder /app/dist ./dist

EXPOSE 3000
CMD ["node","--max-old-space-size=512","dist/src/main.js"]
