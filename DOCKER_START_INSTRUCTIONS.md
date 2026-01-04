# 🐳 How to Start with Docker

## Current Issue
Docker Desktop is **not running**. The application needs Docker to run in containerized mode.

## Solution: Start Docker Desktop

### Step 1: Start Docker Desktop
1. Open **Finder**
2. Go to **Applications**
3. Find and double-click **Docker** application
4. **Wait** for Docker to fully start (you'll see a Docker icon in your menu bar)
5. The icon should show Docker is running (not just starting)

### Step 2: Verify Docker is Running
Open Terminal and run:
```bash
docker ps
```
If you see a list (even if empty), Docker is running ✅

### Step 3: Start the Application
```bash
cd "/Users/ketharnathsivavenkatesan/Desktop/Github "
docker-compose up --build
```

### Step 4: Access the Application
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

---

## Alternative: Run Without Docker (Development Mode)

If you want to run it quickly without Docker:

```bash
npm start
```

This will start the React app on http://localhost:3000 (but backend won't be available)

---

## Troubleshooting

### "Cannot connect to Docker daemon"
- **Fix**: Start Docker Desktop application
- Wait 1-2 minutes for it to fully start

### "Port 3000 already in use"
- **Fix**: Stop any other services on port 3000
- Or change port in `docker-compose.yml`

### Docker Desktop won't start
- Check if you have enough disk space
- Restart your Mac if needed
- Reinstall Docker Desktop

---

## Quick Commands

```bash
# Check Docker status
docker ps

# Start containers
docker-compose up --build

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop containers
docker-compose down
```

