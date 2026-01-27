# Multi-stage Dockerfile for Qdrant Web Backup
# Combines React frontend + Spring Boot backend in a single container

# ============================================
# Stage 1: Build Frontend
# ============================================
FROM node:25-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy package files for dependency caching
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY frontend/ ./

# Build for production - mocks disabled, API calls go to same origin
ENV VITE_MOCK_ENABLED=false
ENV VITE_API_URL=""

RUN npm run build

# ============================================
# Stage 2: Build Backend
# ============================================
FROM eclipse-temurin:25-jdk-alpine AS backend-builder

WORKDIR /app/backend

# Copy gradle wrapper and build files
COPY backend/gradlew ./
COPY backend/gradle ./gradle
COPY backend/build.gradle.kts backend/settings.gradle.kts ./

# Make gradlew executable
RUN chmod +x gradlew

# Download dependencies (cached layer)
RUN ./gradlew dependencies --no-daemon || true

# Copy source code
COPY backend/src ./src

# Build the application
RUN ./gradlew bootJar --no-daemon -x test

# ============================================
# Stage 3: Production Runtime
# ============================================
FROM eclipse-temurin:25-jre-alpine AS production

# Install nginx, supervisor, curl for healthcheck
RUN apk add --no-cache nginx supervisor curl

WORKDIR /app

# Copy backend JAR from builder
COPY --from=backend-builder /app/backend/build/libs/*.jar /app/app.jar

# Copy frontend build from builder
COPY --from=frontend-builder /app/frontend/dist /app/static

# Configure nginx
RUN rm -f /etc/nginx/http.d/default.conf
COPY nginx.conf /etc/nginx/http.d/app.conf

# Configure supervisor to manage nginx + java
COPY supervisord.conf /etc/supervisor.d/app.ini

# Copy entrypoint script
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Create directories and set permissions
RUN mkdir -p /app/data /var/log/supervisor /run/nginx && \
    addgroup -g 1001 appgroup && \
    adduser -u 1001 -G appgroup -D appuser && \
    chown -R appuser:appgroup /app /var/log/nginx /var/lib/nginx /run/nginx /var/log/supervisor

# Expose port
EXPOSE 8080

# Environment variables
ENV PORT=8080
ENV SPRING_PROFILES_ACTIVE=prod
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:+ExitOnOutOfMemoryError"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:${PORT}/actuator/health || exit 1

# Start with entrypoint
CMD ["/app/entrypoint.sh"]