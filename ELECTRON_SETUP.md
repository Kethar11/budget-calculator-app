# Running as Mac Application

## Current Setup

You have two ways to run the app:

### 1. **Web App (Localhost)** - For Testing
```bash
npm start
```
Runs at: `http://localhost:3000` in your browser

### 2. **Mac Desktop App** - Standalone Application

#### First Time Setup:
```bash
# Install Electron dependencies
npm install
```

#### Development Mode (with hot reload):
```bash
npm run electron-dev
```
This will:
- Start React dev server
- Launch Electron app window
- Auto-reload on code changes

#### Build Production Mac App:
```bash
# Build React app and create Mac .app file
npm run electron-build-mac
```

This creates a `.app` file in the `dist` folder that you can:
- Double-click to run
- Drag to Applications folder
- Share with others

## What You Get

### Development:
- ✅ Test in browser: `npm start` → `http://localhost:3000`
- ✅ Test as Mac app: `npm run electron-dev`

### Production:
- ✅ Standalone `.app` file for Mac
- ✅ No browser needed
- ✅ Works offline
- ✅ All data stored locally on your Mac

## File Locations

- **Web version**: Runs in browser (localhost:3000)
- **Mac app**: Created in `dist/` folder after building
- **Data storage**: IndexedDB (stored in app's user data folder)

## Notes

- The Mac app uses the same code as the web version
- All features work the same (Budget, Savings, Expenses)
- Data is stored locally on your Mac
- No internet connection needed after installation


