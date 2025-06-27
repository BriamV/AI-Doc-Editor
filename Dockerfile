# Dockerfile for AI-Doc-Editor
# Task T-01.5: Docker-compose setup

# Stage 1: Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN yarn install --production --frozen-lockfile && yarn cache clean

# Copy source code
COPY . .

# Build application
RUN yarn build

# Stage 2: Production stage  
FROM node:20-alpine AS production

WORKDIR /app

# Install serve for hosting static files
RUN yarn global add serve@14

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Change ownership of app directory
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

# Start application
CMD ["serve", "-s", "dist", "-l", "3000"]

# Metadata
LABEL maintainer="BriamV <velasquezbriam@gmail.com>"
LABEL description="AI-powered document editor with RAG capabilities"
LABEL version="1.0.0"
EOF < /dev/null
