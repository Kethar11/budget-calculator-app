# Excel Database Structure - Simplified

## Overview

Excel is now the **primary database** for the application. It's organized simply with only **Income** and **Expense** sheets.

## Excel File Structure

**File:** `backend/budget_data.xlsx`

### Main Sheets:

1. **Income** - All income entries
   - Columns: ID, Date, Time, Category, Subcategory, Amount, Description, Created At, Updated At

2. **Expense** - All expense entries
   - Columns: ID, Date, Time, Category, Subcategory, Amount, Description, Created At, Updated At

3. **Summary** - Real-time statistics
   - Columns: Metric, Value, Last Updated

### Monthly Sheets (Auto-created):

- **January 2024**, **February 2024**, etc.
- One sheet per month
- Contains transactions from that month
- Automatically created when data is added

## Data Flow

```
App (IndexedDB) 
    ↓ (Auto-sync on add/edit/delete)
Excel File (Income/Expense sheets)
    ├── Income Sheet
    ├── Expense Sheet
    ├── January 2024 (monthly)
    ├── February 2024 (monthly)
    └── ... (one per month)
    ↓ (Optional - if configured)
Google Sheets
    └── Sheet ID: 1Dp4UGkT8h-PHnEXDPbGqnnDxsvhP6zO_UvxXH4xXLu0
```

## How It Works

### When You Add Data:

1. **Add Income Transaction:**
   - Saved to IndexedDB
   - Auto-synced to Excel **Income** sheet
   - Also added to monthly sheet (e.g., "December 2024")

2. **Add Expense:**
   - Saved to IndexedDB
   - Auto-synced to Excel **Expense** sheet
   - Also added to monthly sheet

3. **Add Savings:**
   - Saved to IndexedDB
   - Treated as Income in Excel (Category: "Savings")
   - Auto-synced to Excel **Income** sheet

### Excel Sync Buttons:

- **"Update Excel"** - Pushes all current app data to Excel
- **"Fetch from Excel"** - Pulls all data from Excel to app

## Benefits

✅ **Simple Structure** - Only Income and Expense  
✅ **Database-like** - Excel acts as primary data source  
✅ **Mobile Compatible** - Works on phone app  
✅ **Electron Compatible** - Works on Mac desktop app  
✅ **Monthly Organization** - Easy to track by month  
✅ **Auto-sync** - Data syncs automatically  
✅ **Bidirectional** - Fetch and Update buttons  

## Testing

1. Start backend: `cd backend && python main.py`
2. Start frontend: `npm start`
3. Add income/expense in app
4. Click "Update Excel"
5. Open `backend/budget_data.xlsx`
6. Check **Income** and **Expense** sheets
7. Check monthly sheets (e.g., "December 2024")

## Mobile & Electron

- **Mobile:** Excel sync works via backend API
- **Electron:** Excel sync works via backend API
- **Both:** Use same Excel file structure
- **Both:** Auto-sync on data changes

## Recommendations

1. **Use Excel as Source of Truth** - Excel file is the master database
2. **Regular Backups** - Excel file is automatically backed up
3. **Monthly Review** - Check monthly sheets for trends
4. **Google Sheets Sync** - Optional cloud backup

