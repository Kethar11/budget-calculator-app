# Troubleshooting Guide 🔧

## Issue: "Update Excel" shows success but Excel file is empty

### Possible Causes:

1. **No data in the app** - You need to add transactions/expenses first
2. **Data format issue** - Data not being sent correctly
3. **Backend not saving** - Excel file not being written

---

## Quick Fix Steps

### Step 1: Check if you have data

1. Open your app at `http://localhost:3000`
2. Go to **Budget** tab
3. Check if you see any transactions in the table
4. Go to **Expenses** tab
5. Check if you see any expenses

**If you see NO data:**
- Add some test data:
  - Budget tab → Add Income (e.g., Salary, €1000)
  - Expenses tab → Add Expense (e.g., Food, €50)
- Then try "Update Excel" again

### Step 2: Check backend logs

1. Look at the terminal where backend is running
2. When you click "Update Excel", you should see:
   ```
   📥 Received X transactions and Y expenses
   💰 Income records to save: X
   💸 Expense records to save: Y
   💾 Saving X income records...
   ✅ Income records saved
   ```

**If you see "0 transactions and 0 expenses":**
- You don't have data in the app
- Add data first, then try again

### Step 3: Check Excel file

1. Open `backend/budget_data.xlsx`
2. Check **Income** sheet - should have data rows (not just headers)
3. Check **Expense** sheet - should have data rows

**If Excel only has headers:**
- Check backend terminal for errors
- Make sure you have data in the app
- Try adding a new transaction and updating again

---

## Issue: "Failed to sync to Google Sheets"

### This is NORMAL if credentials.json is not set up

**Google Sheets sync is OPTIONAL.** You can:
- ✅ Use Excel file only (works without Google Sheets)
- ✅ Set up Google Sheets later (see `GOOGLE_SHEETS_SETUP.md`)

**To fix Google Sheets:**
1. Follow `GOOGLE_SHEETS_SETUP.md`
2. Create `backend/credentials.json`
3. Share Google Sheet with service account email

---

## Common Issues

### "No data to save!"
**Solution:** Add transactions/expenses in the app first

### Excel file empty after "Update Excel"
**Solution:** 
1. Check backend terminal - look for error messages
2. Make sure you have data in the app
3. Check browser console (F12) for errors

### Backend not running
**Solution:**
```bash
cd backend
source venv/bin/activate
python main.py
```

### Excel file not found
**Solution:**
- Backend will create it automatically
- Or run: `cd backend && python -c "from excel_storage import create_excel_file; create_excel_file()"`

---

## Debug Steps

### 1. Check Browser Console
- Press `F12` (or `Cmd+Option+I` on Mac)
- Go to Console tab
- Look for errors when clicking "Update Excel"

### 2. Check Backend Terminal
- Look for log messages:
  - `📥 Received X transactions...`
  - `💰 Income records to save: X`
  - `✅ Income records saved`

### 3. Check Excel File
```bash
cd backend
python -c "from openpyxl import load_workbook; wb = load_workbook('budget_data.xlsx'); ws = wb['Income']; print('Income rows:', ws.max_row)"
```

Should show more than 1 row if data exists.

---

## Still Not Working?

1. **Check you have data:**
   - Budget tab → See transactions?
   - Expenses tab → See expenses?

2. **Check backend is running:**
   - Open `http://localhost:8000` in browser
   - Should see: `{"message":"Budget Calculator API"}`

3. **Check backend terminal:**
   - Look for error messages
   - Share the error if you see one

4. **Try adding new data:**
   - Add a test transaction
   - Click "Update Excel"
   - Check if it appears in Excel

---

**Most common issue: No data in the app! Make sure you have transactions/expenses before clicking "Update Excel".**

