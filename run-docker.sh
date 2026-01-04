#!/bin/bash

echo "🚀 Starting Budget Calculator with Docker..."
echo ""

# Check if Docker is running
if ! docker ps > /dev/null 2>&1; then
    echo "❌ Docker is not running!"
    echo "Please start Docker Desktop and try again."
    exit 1
fi

# Build and start containers
docker-compose up --build
