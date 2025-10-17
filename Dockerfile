# Multi-stage build for The Man Cave Dashboard
# Stage 1: Build Go backend
FROM golang:1.21-alpine AS backend-builder

WORKDIR /app
COPY server/go.mod server/go.sum ./
RUN go mod download
COPY server/ ./
RUN CGO_ENABLED=0 GOOS=linux go build -o /dashboard-backend

# Stage 2: Build React frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 3: Production - combine both services
FROM alpine:latest

# Install required packages
RUN apk --no-cache add \
    ca-certificates \
    nginx \
    supervisor \
    wget

# Copy Go backend binary
COPY --from=backend-builder /dashboard-backend /app/dashboard-backend

# Copy built React frontend
COPY --from=frontend-builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/http.d/default.conf

# Create necessary directories
RUN mkdir -p /app/config \
    /usr/share/nginx/html/photos \
    /var/log/supervisor \
    /run/nginx && \
    chmod -R 755 /usr/share/nginx/html && \
    chown -R nginx:nginx /usr/share/nginx/html

# Create supervisord configuration
RUN echo '[supervisord]' > /etc/supervisord.conf && \
    echo 'nodaemon=true' >> /etc/supervisord.conf && \
    echo 'user=root' >> /etc/supervisord.conf && \
    echo 'logfile=/var/log/supervisor/supervisord.log' >> /etc/supervisord.conf && \
    echo 'pidfile=/var/run/supervisord.pid' >> /etc/supervisord.conf && \
    echo '' >> /etc/supervisord.conf && \
    echo '[program:backend]' >> /etc/supervisord.conf && \
    echo 'command=/app/dashboard-backend' >> /etc/supervisord.conf && \
    echo 'autostart=true' >> /etc/supervisord.conf && \
    echo 'autorestart=true' >> /etc/supervisord.conf && \
    echo 'stderr_logfile=/var/log/supervisor/backend.err.log' >> /etc/supervisord.conf && \
    echo 'stdout_logfile=/var/log/supervisor/backend.out.log' >> /etc/supervisord.conf && \
    echo '' >> /etc/supervisord.conf && \
    echo '[program:nginx]' >> /etc/supervisord.conf && \
    echo 'command=nginx -g "daemon off;"' >> /etc/supervisord.conf && \
    echo 'autostart=true' >> /etc/supervisord.conf && \
    echo 'autorestart=true' >> /etc/supervisord.conf && \
    echo 'stderr_logfile=/var/log/supervisor/nginx.err.log' >> /etc/supervisord.conf && \
    echo 'stdout_logfile=/var/log/supervisor/nginx.out.log' >> /etc/supervisord.conf

# Expose port 80 (frontend/nginx)
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Start supervisord to manage both services
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
