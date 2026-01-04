# Quick Start with Docker

## Prerequisites

1. **Docker Desktop** must be installed and running
   - Download from: https://www.docker.com/products/docker-desktop
   - Make sure Docker Desktop is running (you'll see a whale icon in your menu bar)

## Running the Application

### Option 1: Using the Script (Easiest)

```bash
./run-docker.sh
```

### Option 2: Manual Commands

1. **Start Docker Desktop** (if not already running)

2. **Build and start containers:**
   ```bash
   docker-compose up --build
   ```

3. **Or run in background (detached mode):**
   ```bash
   docker-compose up --build -d
   ```

## Access the Application

Once containers are running:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## Stop the Application

Press `Ctrl+C` if running in foreground, or:

```bash
docker-compose down
```

## View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f frontend
docker-compose logs -f backend
```

## Troubleshooting

### Docker is not running
- Make sure Docker Desktop is installed and running
- Check the Docker icon in your menu bar (macOS) or system tray (Windows)
- Wait a few seconds after starting Docker Desktop

### Port already in use
If ports 3000 or 8000 are already in use, modify `docker-compose.yml`:
```yaml
ports:
  - "3001:80"  # Change 3000 to 3001
```

### Rebuild after code changes
```bash
docker-compose down
docker-compose up --build
```

### Check container status
```bash
docker-compose ps
```

