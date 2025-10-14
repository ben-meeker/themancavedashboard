# Deployment Guide

This guide covers deploying The Man Cave Dashboard using Docker and Docker Hub.

## Quick Start (Using Pre-built Images)

1. **Copy the example environment file**:
```bash
cp .env.example .env
```

2. **Edit `.env` with your configuration**:
```bash
nano .env
```

Fill in your:
- Anniversary date and trash day
- Photos directory path
- API keys (Tesla, Weather, Ecowitt, etc.)
- Google OAuth credentials

3. **Start the dashboard**:
```bash
docker-compose up -d
```

4. **Access the dashboard**:
Open http://localhost:3000

## Building and Pushing to Docker Hub

### Prerequisites
- Docker installed
- Docker Hub account
- Logged into Docker Hub: `docker login`

### Build Both Images

```bash
# Build backend
docker build -t bemeeker/themancavedashboard-backend:latest ./server
docker build -t bemeeker/themancavedashboard-backend:v1.0.0 ./server

# Build frontend
docker build -t bemeeker/themancavedashboard:latest .
docker build -t bemeeker/themancavedashboard:v1.0.0 .
```

### Push to Docker Hub

```bash
# Push backend
docker push bemeeker/themancavedashboard-backend:latest
docker push bemeeker/themancavedashboard-backend:v1.0.0

# Push frontend
docker push bemeeker/themancavedashboard:latest
docker push bemeeker/themancavedashboard:v1.0.0
```

### Use Build Script

```bash
./build-and-push.sh v1.0.0
```

## Important Security Notes

⚠️ **The Docker images do NOT contain**:
- `.env` files
- `token.json` (Google OAuth token)
- `config.json` (API configuration)
- Photos from `public/photos/`

These are mounted as volumes at runtime for security.

## Configuration Storage

### Using Docker Volumes (Recommended)

The `docker-compose.yml` uses a named volume for persistent config:

```yaml
volumes:
  - dashboard-config:/app/config
```

This keeps your configuration safe across container restarts.

### Using .env File

All API keys and settings can be provided via `.env`:

```env
TESSIE_API_KEY=xxx
TESSIE_VIN=xxx
# ... etc
```

### Using the Web UI

After starting the dashboard, use the setup UI to configure APIs interactively.

## Photos Directory

Mount your local photos directory:

```env
PHOTOS_PATH=/path/to/your/photos
```

The dashboard will read photos from this directory. Supported formats:
- JPEG, JPG, PNG
- HEIC (will be handled by browser)

## Updating

### Pull Latest Images

```bash
docker-compose pull
docker-compose up -d
```

### Keep Your Data

Your configuration and photos are stored in volumes and local directories, so they persist across updates.

## Troubleshooting

### Check logs
```bash
docker logs mancave-backend
docker logs mancave-frontend
```

### Verify config volume
```bash
docker volume inspect themancavedashboard_dashboard-config
```

### Test backend API
```bash
curl http://localhost:8080/health
```

### Reset configuration
```bash
docker volume rm themancavedashboard_dashboard-config
docker-compose up -d
```

## Multi-Architecture Builds

To build for multiple architectures (amd64, arm64):

```bash
docker buildx create --use
docker buildx build --platform linux/amd64,linux/arm64 \
  -t bemeeker/themancavedashboard-backend:latest \
  --push ./server

docker buildx build --platform linux/amd64,linux/arm64 \
  -t bemeeker/themancavedashboard:latest \
  --push .
```

This enables deployment on:
- Intel/AMD servers (amd64)
- Apple Silicon / Raspberry Pi (arm64)
