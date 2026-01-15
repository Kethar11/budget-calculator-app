# Local Testing Guide

This guide will help you test all features of the Budget Calculator app locally.

## Prerequisites

1. **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
2. **Python 3.8+** - [Download](https://www.python.org/downloads/)
3. **npm** (comes with Node.js)

## Step 1: Install Dependencies

### Frontend (React App)
```bash
cd "/Users/ketharnathsivavenkatesan/Desktop/Github "
npm install
```

### Backend (Python/FastAPI)
```bash
cd backend
pip install -r requirements.txt
```

If `requirements.txt` doesn't exist, install manually:
```bash
pip install fastapi uvicorn pandas openpyxl python-multipart
```

## Step 2: Start Backend Server

The backend is required for Excel sync functionality.

```bash
cd backend
python main.py
```

Or using uvicorn directly:
```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

**Keep this terminal open!** The backend must be running for Excel sync to work.

## Step 3: Start Frontend (React App)

Open a **new terminal window** and run:

```bash
cd "/Users/ketharnathsivavenkatesan/Desktop/Github "
npm start
```

This will:
- Start the React development server
- Open your browser automatically at `http://localhost:3000`
- Enable hot-reload (changes update automatically)

## Step 4: Test Features

### 1. Test Excel Sync

#### Test "Update Excel" Button:
1. Add a new transaction in the Budget Calculator
2. Click **"Update Excel"** button
3. Check `backend/budget_data.xlsx` file - your data should be there!

#### Test "Fetch from Excel" Button:
1. Manually edit `backend/budget_data.xlsx` (add a row in Transactions sheet)
2. Click **"Fetch from Excel"** button in the app
3. The data should appear in your app!

### 2. Test Auto-Sync to Excel

1. Add a new transaction/expense/savings entry
2. Wait 2-3 seconds
3. Check `backend/budget_data.xlsx` - data should be automatically synced!

### 3. Test Mobile Responsiveness

#### Option A: Browser DevTools
1. Open Chrome/Edge DevTools (F12 or Cmd+Option+I on Mac)
2. Click the device toggle icon (or press Cmd+Shift+M)
3. Select a mobile device (iPhone, Android, etc.)
4. Test the app - buttons should be touch-friendly, layout should adapt

#### Option B: Actual Mobile Device
1. Find your computer's IP address:
   ```bash
   # On Mac:
   ifconfig | grep "inet " | grep -v 127.0.0.1
   
   # Or:
   ipconfig getifaddr en0
   ```
2. On your phone, open browser and go to: `http://YOUR_IP:3000`
   - Example: `http://192.168.1.100:3000`
3. Make sure your phone and computer are on the same WiFi network

### 4. Test PDF Upload

1. Go to any transaction/expense/savings entry
2. Click the file upload button
3. Select a PDF file
4. The PDF should upload and sync to Google Sheets (if configured)

### 5. Test Data Entry

1. **Budget Calculator:**
   - Add income transaction
   - Add expense transaction
   - Check Excel file - both should be there

2. **Expense Calculator:**
   - Add an expense with category
   - Check Excel file - should appear in Expenses sheet

3. **Savings Calculator:**
   - Add a savings deposit
   - Check Excel file - should appear in Savings sheet

## Step 5: Check Excel File

The Excel file is located at:
```
backend/budget_data.xlsx
```

Open it with Excel, Numbers, or Google Sheets to verify:
- **Transactions** sheet - all income/expense transactions
- **Expenses** sheet - all expense records
- **Savings** sheet - all savings deposits
- **Budgets** sheet - budget limits
- **Summary** sheet - calculated statistics

## Troubleshooting

### Backend won't start?
```bash
# Check if port 8000 is already in use
lsof -i :8000

# Kill the process if needed
kill -9 <PID>

# Or use a different port
uvicorn main:app --reload --port 8001
```

### Frontend won't start?
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Try a different port
PORT=3001 npm start
```

### Excel sync not working?
1. **Check backend is running:** Open `http://localhost:8000` in browser
   - Should see: `{"message":"Budget Calculator API","version":"1.0.0"}`

2. **Check CORS:** Make sure backend allows requests from `http://localhost:3000`

3. **Check Excel file exists:** `backend/budget_data.xlsx` should be created automatically

4. **Check browser console:** Open DevTools (F12) and check for errors

### Mobile not accessible?
1. **Check firewall:** Allow connections on port 3000
2. **Check network:** Phone and computer must be on same WiFi
3. **Try IP address:** Use your computer's local IP, not `localhost`

## Quick Test Checklist

- [ ] Backend server running on port 8000
- [ ] Frontend app running on port 3000
- [ ] Can add transactions
- [ ] Can add expenses
- [ ] Can add savings
- [ ] "Update Excel" button works
- [ ] "Fetch from Excel" button works
- [ ] Excel file (`backend/budget_data.xlsx`) exists and has data
- [ ] Mobile responsive (test in browser DevTools)
- [ ] PDF upload works (if Google Sheets configured)

## Testing Electron App (Mac)

If you want to test as Electron app:

```bash
# Install Electron dependencies
npm install electron electron-builder --save-dev

# Run Electron app
npm run electron:dev
```

Or build for production:
```bash
npm run electron:build
```

## Testing on Actual Phone

1. **Start backend:**
   ```bash
   cd backend
   python main.py
   ```

2. **Start frontend with network access:**
   ```bash
   npm start
   ```

3. **Find your IP:**
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```

4. **On phone browser:** Go to `http://YOUR_IP:3000`

5. **Test all features on phone:**
   - Add transactions
   - Test Excel sync buttons
   - Test PDF upload
   - Check mobile layout

## Common Issues

### "Failed to fetch from Excel"
- Backend not running
- Backend URL incorrect
- CORS issue

### "Excel file not found"
- Backend will create it automatically on first sync
- Check `backend/` directory permissions

### "Port already in use"
- Kill existing process: `lsof -i :8000` then `kill -9 <PID>`
- Or use different port

## Next Steps

Once local testing works:
1. Test all features thoroughly
2. Check Excel file structure
3. Test on actual mobile device
4. Build Android APK (see `ANDROID_APK_BUILD.md`)
5. Deploy to production

## Need Help?

Check the console logs:
- **Backend:** Terminal where you ran `python main.py`
- **Frontend:** Browser DevTools Console (F12)
- **Network:** Browser DevTools Network tab

