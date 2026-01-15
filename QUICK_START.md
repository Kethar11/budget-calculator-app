# Quick Start - Test Locally Now! 🚀

## Step-by-Step Testing Guide

### Step 1: Install Dependencies (First Time Only)

```bash
# Install frontend dependencies
cd "/Users/ketharnathsivavenkatesan/Desktop/Github "
npm install

# Install backend dependencies
cd backend
pip install fastapi uvicorn pandas openpyxl python-multipart
cd ..
```

### Step 2: Start Backend Server

**Open Terminal 1:**

```bash
cd "/Users/ketharnathsivavenkatesan/Desktop/Github /backend"
python main.py
```

**You should see:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

✅ **Keep this terminal open!**

### Step 3: Start Frontend App

**Open Terminal 2 (new terminal window):**

```bash
cd "/Users/ketharnathsivavenkatesan/Desktop/Github "
npm start
```

**You should see:**
```
Compiled successfully!
You can now view budget-calculator-app in the browser.
  Local:            http://localhost:3000
```

✅ Browser opens automatically at `http://localhost:3000`

### Step 4: Test Features

#### Test 1: Add Income
1. In the app, go to **Budget** tab
2. Fill form:
   - Type: **Income**
   - Category: Select any (e.g., "Salary")
   - Amount: `1000`
   - Description: "Test income"
3. Click **Add Transaction**
4. ✅ Should appear in the list immediately

#### Test 2: Add Expense
1. Go to **Expenses** tab
2. Fill form:
   - Category: Select (e.g., "Food")
   - Amount: `50`
   - Description: "Test expense"
3. Click **Add Expense**
4. ✅ Should appear in the list immediately

#### Test 3: Check Excel File
1. Open `backend/budget_data.xlsx` (in Excel, Numbers, or Google Sheets)
2. ✅ You should see:
   - **Income** sheet with your income entry
   - **Expense** sheet with your expense entry
   - **Summary** sheet with totals
   - Monthly sheet (e.g., "December 2024") with data

#### Test 4: Excel Sync Buttons
1. In Budget Calculator, find **Excel Sync** section
2. Click **"Update Excel"** button
   - ✅ Should show "Excel updated successfully!"
3. Click **"Fetch from Excel"** button
   - ✅ Should show "Data fetched from Excel successfully!"

#### Test 5: Mobile View
1. Press `F12` (or `Cmd+Option+I` on Mac) to open DevTools
2. Click device icon (or press `Cmd+Shift+M`)
3. Select "iPhone 12" or "Pixel 5"
4. ✅ App should adapt to mobile layout
5. Test buttons - should be touch-friendly

### Step 5: Verify Excel Structure

Open `backend/budget_data.xlsx` and check:

**Sheets you should see:**
- ✅ **Income** - Your income entries
- ✅ **Expense** - Your expense entries  
- ✅ **Summary** - Statistics
- ✅ **December 2024** (or current month) - Monthly data

**Columns in Income/Expense:**
- ID, Date, Time, Category, Subcategory, Amount, Description, Created At, Updated At

### Quick Test Checklist

- [ ] Backend running (Terminal 1 shows "Uvicorn running")
- [ ] Frontend running (Browser shows app at localhost:3000)
- [ ] Can add income transaction
- [ ] Can add expense
- [ ] Excel file exists at `backend/budget_data.xlsx`
- [ ] Excel has Income and Expense sheets
- [ ] "Update Excel" button works
- [ ] "Fetch from Excel" button works
- [ ] Mobile view works (DevTools device mode)

## Troubleshooting

### Backend won't start?
```bash
# Check if port 8000 is in use
lsof -i :8000

# Kill process if needed
kill -9 <PID>

# Or use different port
cd backend
uvicorn main:app --reload --port 8001
```

### Frontend won't start?
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm start
```

### Excel file not created?
- Make sure backend is running
- Click "Update Excel" button in app
- Check `backend/` directory exists

### Excel sync not working?
1. Check backend is running: Open `http://localhost:8000` in browser
   - Should see: `{"message":"Budget Calculator API","version":"1.0.0"}`
2. Check browser console (F12) for errors
3. Check backend terminal for errors

## What to Expect

### After Adding Data:
1. ✅ Data appears in app immediately
2. ✅ Data auto-syncs to Excel (check `backend/budget_data.xlsx`)
3. ✅ Data appears in correct monthly sheet
4. ✅ Summary sheet updates automatically

### Excel File Structure:
```
budget_data.xlsx
├── Income (all income entries)
├── Expense (all expense entries)
├── Summary (statistics)
├── January 2024 (monthly data)
├── February 2024 (monthly data)
└── ... (one sheet per month)
```

## Next Steps After Testing

1. ✅ Test all features work
2. ✅ Verify Excel structure
3. ✅ Test on mobile (DevTools)
4. ✅ Build Android APK (see `ANDROID_APK_BUILD.md`)
5. ✅ Set up Google Sheets (see `GOOGLE_SHEET_CONFIG.md`)

## Need Help?

- Check `LOCAL_TESTING.md` for detailed guide
- Check `COMPLETE_WORKFLOW.md` for workflow
- Check browser console (F12) for errors
- Check backend terminal for errors

**You're ready to test! Start both servers and begin adding data!** 🎉

