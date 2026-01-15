#!/bin/bash

# Budget Calculator - Local Startup Script

echo "🚀 Starting Budget Calculator Application..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if backend venv exists
if [ ! -d "backend/venv" ]; then
    echo -e "${YELLOW}⚠️  Backend virtual environment not found. Creating...${NC}"
    cd backend
    python3 -m venv venv
    source venv/bin/activate
    pip install fastapi uvicorn pandas openpyxl python-multipart
    cd ..
fi

# Start Backend
echo -e "${BLUE}📡 Starting Backend Server (Port 8000)...${NC}"
cd backend
source venv/bin/activate
python main.py &
BACKEND_PID=$!
cd ..
echo -e "${GREEN}✅ Backend started (PID: $BACKEND_PID)${NC}"
echo ""

# Wait a moment for backend to start
sleep 3

# Start Frontend
echo -e "${BLUE}🎨 Starting Frontend App (Port 3000)...${NC}"
npm start &
FRONTEND_PID=$!
echo -e "${GREEN}✅ Frontend started (PID: $FRONTEND_PID)${NC}"
echo ""

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ Application is starting!${NC}"
echo ""
echo -e "${BLUE}📍 Backend API:${NC}  http://localhost:8000"
echo -e "${BLUE}📍 Frontend App:${NC} http://localhost:3000"
echo ""
echo -e "${YELLOW}⏳ Please wait 10-20 seconds for servers to fully start...${NC}"
echo ""
echo -e "${YELLOW}💡 To stop servers:${NC}"
echo -e "   kill $BACKEND_PID $FRONTEND_PID"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Keep script running
wait

