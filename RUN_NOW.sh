#!/bin/bash

echo "=========================================="
echo "🚀 Budget Calculator - Docker Startup"
echo "=========================================="
echo ""

# Check Docker
if ! docker ps > /dev/null 2>&1; then
    echo "❌ Docker Desktop is not running!"
    echo ""
    echo "Please start Docker Desktop:"
    echo "  1. Open Docker Desktop from Applications"
    echo "  2. Wait for it to fully start"
    echo "  3. Run this script again"
    echo ""
    echo "Or manually run: docker-compose up --build"
    exit 1
fi

echo "✅ Docker is running"
echo ""
echo "📦 Building and starting containers..."
echo "   This may take a few minutes on first run..."
echo ""

# Build and start
docker-compose up --build

