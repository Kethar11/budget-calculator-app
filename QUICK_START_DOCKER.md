# Quick Start - Docker

## Start the Application

1. **Start Docker Desktop** (if not already running)

2. **Run the application:**
   ```bash
   docker-compose up --build
   ```

3. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:8000

## Stop the Application

Press `Ctrl+C` in the terminal, or run:
```bash
docker-compose down
```

## Rebuild After Changes

```bash
docker-compose down
docker-compose up --build
```
