#!/bin/bash
set -e

# Build and Push Script for The Man Cave Dashboard
# Usage: ./build-and-push.sh [version]
# Example: ./build-and-push.sh v1.0.0

VERSION=${1:-latest}
REPO="bemeeker/themancavedashboard"

echo "🚀 Building and pushing The Man Cave Dashboard: $VERSION"
echo ""

# Check if logged into Docker Hub
if ! docker info | grep -q "Username"; then
    echo "⚠️  Not logged into Docker Hub. Please run: docker login"
    exit 1
fi

echo "📦 Building all-in-one image..."
docker build -t ${REPO}:${VERSION} .

if [ "$VERSION" != "latest" ]; then
    echo "🏷️  Tagging as latest..."
    docker tag ${REPO}:${VERSION} ${REPO}:latest
fi

echo ""
echo "⬆️  Pushing to Docker Hub..."
docker push ${REPO}:${VERSION}

if [ "$VERSION" != "latest" ]; then
    docker push ${REPO}:latest
fi

echo ""
echo "✅ Done! Image pushed:"
echo "   - ${REPO}:${VERSION}"
if [ "$VERSION" != "latest" ]; then
    echo "   - ${REPO}:latest"
fi
echo ""
echo "🎉 Users can now run:"
echo "   docker pull ${REPO}:latest"
echo "   docker-compose up -d"
