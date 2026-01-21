# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Build args for client (Vite requires these at build time)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

# Copy package files
COPY package*.json ./
COPY tsconfig.base.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/

# Install dependencies with reduced parallelism for low-memory systems
RUN npm ci --maxsockets=2

# Copy source files
COPY client/ ./client/
COPY server/ ./server/

# Build client and server separately to reduce peak memory usage
ENV NODE_OPTIONS="--max-old-space-size=512"
RUN npm run build:server
RUN npm run build:client

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

# Copy package files for production install
COPY package*.json ./
COPY server/package*.json ./server/

# Install production dependencies only
RUN npm ci --workspace=server --omit=dev

# Copy built files
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/server/dist ./server/dist
COPY server/src/db/*.sql ./server/src/db/

# Change ownership to non-root user
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Set environment
ENV NODE_ENV=production
ENV PORT=3001

# Supabase placeholders (should be provided at runtime)
ENV SUPABASE_URL=""
ENV SUPABASE_SERVICE_KEY=""

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/api/health || exit 1

# Start server
CMD ["node", "server/dist/index.js"]
