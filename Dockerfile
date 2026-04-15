FROM node:20-alpine AS builder
WORKDIR /app

# Install openssl and libc6-compat for Prisma on alpine
RUN apk add --no-cache openssl ca-certificates libc6-compat

# Copy package config and schema
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies
RUN npm ci

# Copy source code and build step
COPY . .
RUN npx prisma generate
RUN npm run build

# Strip dev dependencies to keep production image size low
RUN npm prune --omit=dev

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV PRISMA_CLIENT_ENGINE_TYPE="binary"
ENV PRISMA_CLI_QUERY_ENGINE_TYPE="binary"

# Re-install system required dependencies for the smaller final image
RUN apk add --no-cache openssl ca-certificates libc6-compat

# Specifically DO NOT run npx prisma generate here
# We pull exactly the node_modules with the cleanly generated client from builder
COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/dist ./dist

EXPOSE 3000
CMD ["node", "--max-old-space-size=256", "dist/src/main.js"]
