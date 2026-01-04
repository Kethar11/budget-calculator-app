# 🐳 Start Docker Application - Quick Guide

## Step 1: Start Docker Desktop

**You need to start Docker Desktop manually:**

1. Open **Finder**
2. Go to **Applications**
3. Find and double-click **Docker** (or **Docker Desktop**)
4. **Wait** for Docker to fully start (you'll see a whale icon in your menu bar)
5. The icon should show Docker is **running** (not just starting)

## Step 2: Once Docker is Running

Run this command in your terminal:

```bash
cd "/Users/ketharnathsivavenkatesan/Desktop/Github "
docker-compose up --build
```

Or use the script:

```bash
./RUN_NOW.sh
```

## Step 3: Access the Application

Once containers are running:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000  
- **API Docs**: http://localhost:8000/docs

## Quick Commands

```bash
# Start in background
docker-compose up --build -d

# View logs
docker-compose logs -f

# Stop containers
docker-compose down

# Check status
docker-compose ps
```

## Troubleshooting

**"Cannot connect to Docker daemon"**
- Docker Desktop is not running
- Start Docker Desktop from Applications
- Wait 1-2 minutes for it to fully initialize

**"Port already in use"**
- Stop other services on ports 3000 or 8000
- Or change ports in `docker-compose.yml`

