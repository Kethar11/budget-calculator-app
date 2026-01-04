# 🐳 Start Docker Application

## Quick Start

**Once Docker Desktop is running**, execute this command in your terminal:

```bash
docker-compose up --build
```

Or use the script:

```bash
./run-docker.sh
```

## What This Does

1. **Builds** the frontend (React) and backend (FastAPI) Docker images
2. **Starts** both containers
3. **Maps ports:**
   - Frontend: `localhost:3000` → Container port 80
   - Backend: `localhost:8000` → Container port 8000

## Access Points

Once running, open your browser:

- 🌐 **Frontend Application**: http://localhost:3000
- 🔧 **Backend API**: http://localhost:8000
- 📚 **API Documentation**: http://localhost:8000/docs

## Stop the Application

Press `Ctrl+C` in the terminal, or run:

```bash
docker-compose down
```

## Run in Background

To run in detached mode (background):

```bash
docker-compose up --build -d
```

Then view logs:

```bash
docker-compose logs -f
```

## Troubleshooting

### "Cannot connect to Docker daemon"
- **Solution**: Start Docker Desktop application
- Wait for the Docker icon in menu bar to show it's running

### "Port already in use"
- **Solution**: Stop any services using ports 3000 or 8000
- Or change ports in `docker-compose.yml`

### "Build failed"
- **Solution**: Check internet connection (needs to download images)
- Try: `docker-compose build --no-cache`

### View container logs
```bash
docker-compose logs -f frontend
docker-compose logs -f backend
```

### Check container status
```bash
docker-compose ps
```

### Restart containers
```bash
docker-compose restart
```

