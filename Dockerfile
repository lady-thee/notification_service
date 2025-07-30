# Use multi-stage build to reduce final image size
FROM node:21-alpine AS builder

WORKDIR /app

# Install dependencies first for better caching
RUN apk add --no-cache openssl
RUN npm i -g pnpm

COPY package.json pnpm-lock.yaml ./

RUN --mount=type=secret,id=npmtoken \
    pnpm config set //npm.pkg.github.com/:_authToken=$(cat /run/secrets/npmtoken) && \
    pnpm install --frozen-lockfile

COPY . .
RUN pnpx prisma generate
RUN pnpm run build

# Production stage

FROM node:21-alpine AS production

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache openssl
RUN npm i -g pnpm

# Copy only necessary files from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Generate Prisma client in production image
RUN pnpx prisma generate

# # Health check
# HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
#     CMD node dist/healthcheck.js || exit 1

# Run as non-root user
USER node

CMD ["node", "dist/main.js"]