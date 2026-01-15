# Complete Workflow Guide

## Excel Sheet Structure (Organized by Month)

Your Excel file (`backend/budget_data.xlsx`) is now organized as follows:

### Main Sheets:
1. **All Transactions** - All income/expense transactions (combined)
2. **All Expenses** - All expense records (combined)
3. **All Savings** - All savings deposits
4. **Budgets** - Budget limits by category
5. **Summary** - Real-time statistics

### Monthly Sheets:
- **January 2024**, **February 2024**, etc. - Transactions and expenses organized by month
- Each month has its own sheet for easy tracking
- Data automatically goes to the correct month based on date

## Complete Workflow

### Step 1: Start Backend Server

```bash
cd backend
python main.py
```

**Expected output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

✅ **Keep this terminal open!**

### Step 2: Start Frontend App

Open a **new terminal**:

```bash
cd "/Users/ketharnathsivavenkatesan/Desktop/Github "
npm start
```

✅ Browser opens at `http://localhost:3000`

### Step 3: Add Data in App

#### Add Budget Transaction:
1. Go to **Budget** tab
2. Fill in form:
   - Type: Income or Expense
   - Category: Select category
   - Amount: Enter amount
   - Description: (optional)
   - Date: Select date
3. Click **Add Transaction**
4. ✅ Data automatically saved to IndexedDB
5. ✅ Data automatically synced to Excel (main sheet + monthly sheet)

#### Add Expense:
1. Go to **Expenses** tab
2. Fill in form:
   - Category: Select category
   - Subcategory: (optional)
   - Amount: Enter amount
   - Description: (optional)
   - Date & Time: Select
3. Click **Add Expense**
4. ✅ Data automatically saved and synced to Excel

#### Add Savings:
1. Go to **Savings** tab
2. Fill in form:
   - Account Type: Select (Livret A, Fixed Deposit, etc.)
   - Amount: Enter amount
   - Date: Deposit date
   - Maturity Date: (optional)
   - Interest Rate: (optional)
3. Click **Add Savings**
4. ✅ Data automatically saved and synced to Excel

### Step 4: Sync with Excel

#### Update Excel (Push to Excel):
1. Click **"Update Excel"** button in Budget Calculator
2. ✅ All current data pushed to Excel
3. ✅ Data organized in monthly sheets automatically
4. Check `backend/budget_data.xlsx` - your data is there!

#### Fetch from Excel (Pull from Excel):
1. Click **"Fetch from Excel"** button
2. ✅ Data from Excel imported to app
3. ✅ App displays all data from Excel

### Step 5: Verify Excel File

Open `backend/budget_data.xlsx`:

**You should see:**
- **All Transactions** sheet - All transactions combined
- **All Expenses** sheet - All expenses combined
- **All Savings** sheet - All savings
- **January 2024** sheet - Transactions from January 2024
- **February 2024** sheet - Transactions from February 2024
- **March 2024** sheet - Transactions from March 2024
- ... (one sheet per month)
- **Summary** sheet - Statistics

### Step 6: Google Sheets Sync (Optional)

If you've configured Google Sheets:

1. Data automatically syncs to Google Sheet on app load
2. Data syncs daily automatically
3. Changes sync to Google Sheets when you add data

**Your Google Sheet:** https://docs.google.com/spreadsheets/d/1Dp4UGkT8h-PHnEXDPbGqnnDxsvhP6zO_UvxXH4xXLu0/edit?usp=sharing

## Testing Checklist

### ✅ Basic Functionality:
- [ ] Backend running on port 8000
- [ ] Frontend running on port 3000
- [ ] Can add transaction
- [ ] Can add expense
- [ ] Can add savings
- [ ] Data appears in app immediately

### ✅ Excel Sync:
- [ ] "Update Excel" button works
- [ ] "Fetch from Excel" button works
- [ ] Excel file created at `backend/budget_data.xlsx`
- [ ] Monthly sheets created automatically
- [ ] Data appears in correct monthly sheet

### ✅ Data Organization:
- [ ] Transactions in "All Transactions" sheet
- [ ] Expenses in "All Expenses" sheet
- [ ] Savings in "All Savings" sheet
- [ ] Monthly sheets have correct data
- [ ] Summary sheet has statistics

### ✅ Mobile Testing:
- [ ] Open DevTools (F12)
- [ ] Toggle device mode (Cmd+Shift+M)
- [ ] Test on mobile view
- [ ] Buttons are touch-friendly
- [ ] Layout adapts to mobile

## Quick Test Commands

```bash
# Terminal 1 - Backend
cd backend
python main.py

# Terminal 2 - Frontend
cd "/Users/ketharnathsivavenkatesan/Desktop/Github "
npm start

# Check Excel file
open backend/budget_data.xlsx
```

## Troubleshooting

### Excel file not created?
- Backend must be running
- Click "Update Excel" button
- Check `backend/` directory permissions

### Monthly sheets not created?
- Make sure date is set correctly when adding data
- Sheets are created automatically when data is added
- Check Excel file after clicking "Update Excel"

### Data not syncing?
- Check backend is running: `http://localhost:8000`
- Check browser console for errors (F12)
- Check backend terminal for errors

### Google Sheets not syncing?
- Need to set up credentials (see `GOOGLE_SHEET_CONFIG.md`)
- Backend must be running
- Check `backend/credentials.json` exists

## Data Flow

```
App (IndexedDB) 
    ↓ (Auto-sync on add)
Excel File (backend/budget_data.xlsx)
    ├── All Transactions (main sheet)
    ├── All Expenses (main sheet)
    ├── All Savings (main sheet)
    ├── January 2024 (monthly sheet)
    ├── February 2024 (monthly sheet)
    └── ... (one per month)
    ↓ (Optional - if configured)
Google Sheets
    └── Your Sheet: 1Dp4UGkT8h-PHnEXDPbGqnnDxsvhP6zO_UvxXH4xXLu0
```

## Next Steps

1. ✅ Start backend: `cd backend && python main.py`
2. ✅ Start frontend: `npm start`
3. ✅ Add some test data
4. ✅ Click "Update Excel"
5. ✅ Open Excel file and verify structure
6. ✅ Test "Fetch from Excel"
7. ✅ Test on mobile (DevTools device mode)

Everything is ready to test! 🚀

