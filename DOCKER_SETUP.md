# Docker Setup Guide

This guide explains how to run the Budget Calculator application using Docker and Docker Compose.

## Prerequisites

- Docker Desktop installed and running
- Docker Compose (included with Docker Desktop)

## Quick Start

1. **Build and start all services:**
   ```bash
   docker-compose up --build
   ```

2. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

## Docker Commands

### Start Services
```bash
# Start in foreground
docker-compose up

# Start in background (detached mode)
docker-compose up -d

# Rebuild and start
docker-compose up --build
```

### Stop Services
```bash
# Stop services
docker-compose stop

# Stop and remove containers
docker-compose down

# Stop, remove containers, and volumes
docker-compose down -v
```

### View Logs
```bash
# View all logs
docker-compose logs

# View specific service logs
docker-compose logs frontend
docker-compose logs backend

# Follow logs in real-time
docker-compose logs -f
```

### Rebuild Services
```bash
# Rebuild without cache
docker-compose build --no-cache

# Rebuild specific service
docker-compose build frontend
docker-compose build backend
```

### Execute Commands in Containers
```bash
# Access backend container shell
docker-compose exec backend bash

# Access frontend container shell
docker-compose exec frontend sh

# Run commands in backend
docker-compose exec backend python -m pip list
```

## Architecture

### Services

1. **Frontend (React)**
   - Container: `budget-calculator-frontend`
   - Port: 3000 (mapped from container port 80)
   - Built with multi-stage Dockerfile (Node.js builder + Nginx)
   - Serves static React build files

2. **Backend (FastAPI)**
   - Container: `budget-calculator-backend`
   - Port: 8000
   - Python 3.11 with FastAPI and Uvicorn
   - Data persisted in volumes

### Network

- All services run on a custom bridge network: `budget-network`
- Services can communicate using service names (e.g., `http://backend:8000`)

### Volumes

- Backend data is persisted in `./backend/data` directory
- JSON data file: `./backend/budget_data.json`

## Development Mode

For development with hot-reload, you can run services individually:

### Frontend Development
```bash
cd /path/to/project
npm install
npm start
```

### Backend Development
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Production Deployment

### Build for Production
```bash
docker-compose -f docker-compose.yml build
```

### Run in Production
```bash
docker-compose up -d
```

### Environment Variables

You can customize the setup using environment variables in `docker-compose.yml`:

```yaml
environment:
  - PYTHONUNBUFFERED=1
  - API_HOST=0.0.0.0
  - API_PORT=8000
```

## Troubleshooting

### Port Already in Use
If ports 3000 or 8000 are already in use, modify `docker-compose.yml`:
```yaml
ports:
  - "3001:80"  # Change 3000 to 3001
```

### Container Won't Start
1. Check logs: `docker-compose logs`
2. Verify Docker is running: `docker ps`
3. Check for port conflicts: `lsof -i :3000` or `lsof -i :8000`

### Rebuild After Code Changes
```bash
# Stop containers
docker-compose down

# Rebuild and start
docker-compose up --build
```

### Clear All Data
```bash
# Remove containers, volumes, and images
docker-compose down -v --rmi all
```

## File Structure

```
.
├── Dockerfile              # Frontend Dockerfile
├── docker-compose.yml      # Docker Compose configuration
├── nginx.conf              # Nginx configuration for frontend
├── .dockerignore           # Files to ignore in frontend build
├── backend/
│   ├── Dockerfile          # Backend Dockerfile
│   ├── .dockerignore       # Files to ignore in backend build
│   ├── main.py             # FastAPI application
│   └── requirements.txt    # Python dependencies
└── DOCKER_SETUP.md         # This file
```

## Health Checks

The backend service includes a health check that verifies the API is responding:
- Interval: 30 seconds
- Timeout: 10 seconds
- Retries: 3
- Start period: 40 seconds

## Security Notes

- The application runs in isolated containers
- Nginx includes security headers
- CORS is configured for Docker networking
- Data is persisted in local volumes

## Next Steps

1. Review and customize `docker-compose.yml` for your needs
2. Set up environment variables for production
3. Configure SSL/TLS for production deployment
4. Set up backup strategies for data volumes



