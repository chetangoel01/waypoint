# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install dependencies
RUN npm ci

# Copy source files
COPY client/ ./client/
COPY server/ ./server/

# Build client and server
RUN npm run build:client && npm run build:server

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files for production install
COPY package*.json ./
COPY server/package*.json ./server/

# Install production dependencies only
RUN npm ci --workspace=server --omit=dev

# Copy built files
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/server/dist ./server/dist
COPY server/src/db/schema.sql ./server/src/db/

# Create data directory
RUN mkdir -p /app/data

# Set environment
ENV NODE_ENV=production
ENV PORT=3001
ENV DATABASE_PATH=/app/data/app.db

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/health || exit 1

# Start server
CMD ["node", "server/dist/index.js"]
