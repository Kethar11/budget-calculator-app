# Run as Electron Desktop App

## Current Status

**Application is currently running through Docker:**
- Frontend: http://localhost:3000 (Docker container)
- Backend: http://localhost:8000 (Docker container)

## Run as Electron App

### Option 1: Development Mode (with Docker running)

If Docker is running, Electron will connect to it:

```bash
npm run electron-dev
```

This will:
- Use the Docker containers (already running)
- Open Electron window
- Auto-reload on changes

### Option 2: Standalone Mode (no Docker needed)

For a completely standalone Electron app:

1. **Stop Docker containers:**
   ```bash
   docker-compose down
   ```

2. **Run React dev server:**
   ```bash
   npm start
   ```
   (This starts React on http://localhost:3000)

3. **In another terminal, run Electron:**
   ```bash
   npm run electron
   ```

### Option 3: Build Standalone Mac App

Create a `.app` file you can double-click:

```bash
# Build React app
npm run build

# Create Mac app
npm run electron-build-mac
```

The `.app` file will be in the `dist` folder.

## Quick Start

**With Docker (recommended):**
```bash
# Make sure Docker is running
docker-compose up -d

# Run Electron
npm run electron-dev
```

**Without Docker (standalone):**
```bash
# Terminal 1: Start React
npm start

# Terminal 2: Start Electron
npm run electron
```

## Notes

- Electron app works with both Docker and npm start
- All data is stored locally (IndexedDB)
- Works offline after initial load
- Can be packaged as a standalone Mac/Windows/Linux app

