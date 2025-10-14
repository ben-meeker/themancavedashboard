#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# Define the Docker Hub username and image name
DOCKER_USERNAME="bemeeker"
IMAGE_NAME="themancavedashboard"

# Get the tag from the first argument, default to 'latest'
TAG=${1:-latest}

FULL_IMAGE_NAME="${DOCKER_USERNAME}/${IMAGE_NAME}:${TAG}"

echo "Building multi-architecture Docker image: ${FULL_IMAGE_NAME}"

# Create a new builder instance for multi-arch builds
docker buildx create --name multiarch-builder --use

# Build for both AMD64 and ARM64
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --tag "${FULL_IMAGE_NAME}" \
  --push \
  .

echo "Multi-architecture Docker image built and pushed successfully: ${FULL_IMAGE_NAME}"

if [ "${TAG}" != "latest" ]; then
    echo "Also tagging and pushing as latest..."
    docker buildx build \
      --platform linux/amd64,linux/arm64 \
      --tag "${DOCKER_USERNAME}/${IMAGE_NAME}:latest" \
      --push \
      .
    echo "Pushed as latest: ${DOCKER_USERNAME}/${IMAGE_NAME}:latest"
fi

echo "Multi-architecture build and push process completed."
