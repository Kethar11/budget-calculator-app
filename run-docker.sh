#!/bin/bash

echo "🚀 Starting Budget Calculator with Docker..."
echo ""

# Check if Docker is running
if ! docker ps > /dev/null 2>&1; then
    echo "❌ Docker is not running!"
    echo "Please start Docker Desktop and try again."
    echo ""
    echo "On macOS:"
    echo "  1. Open Docker Desktop application"
    echo "  2. Wait for it to fully start (whale icon in menu bar)"
    echo "  3. Run this script again: ./run-docker.sh"
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Build and start containers
echo "📦 Building and starting containers..."
docker-compose up --build

echo ""
echo "✅ Application is running!"
echo ""
echo "📍 Access the application:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo ""
echo "To stop the application, press Ctrl+C or run:"
echo "   docker-compose down"

