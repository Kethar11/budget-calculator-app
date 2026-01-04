#!/bin/bash

echo "🔄 Starting in Development Mode (Auto-Update)"
echo "   Changes will appear automatically!"
echo ""

# Stop production containers
docker-compose down 2>/dev/null

# Start development mode
docker-compose -f docker-compose.dev.yml up --build

