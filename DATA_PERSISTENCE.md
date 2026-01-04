# Data Persistence Guide

## ✅ YES - Your Data Will Persist!

When you shut down your laptop and restart, **all your records will still be there** when you run the application again.

## How Data is Stored

### 1. **Frontend Data (IndexedDB)**
- **Location**: Stored in your browser's IndexedDB
- **Database Name**: `FinancialCalculatorDB`
- **What's stored**: 
  - Transactions
  - Expenses
  - Savings
  - Goals
  - Reminders
  - Budgets
  - Files/Attachments
  - Currency Settings

**Persistence**: ✅ Persists across:
- Browser restarts
- Laptop shutdowns/restarts
- Docker container restarts
- Application restarts

**⚠️ Important Notes**:
- Data is stored **per browser** (Chrome, Firefox, Safari each have separate data)
- Data is stored **per computer** (not synced across devices)
- If you clear browser data, you'll lose the data

### 2. **Backend Data (Excel Files)**
- **Location**: `./backend/data/` and `./backend/budget_data.xlsx`
- **What's stored**: Backend transaction data (if using Excel sync)

**Persistence**: ✅ Persists because:
- Docker volumes are mapped to your local filesystem
- Files are stored on your laptop's hard drive
- Data survives Docker container restarts
- Data survives laptop shutdowns

## What Happens When You:

### ✅ Shut Down Laptop → Restart
**Result**: All data is preserved!
- IndexedDB data remains in browser
- Excel files remain on disk
- Just run `docker-compose up` again

### ✅ Stop Docker Containers
**Result**: All data is preserved!
- Data is stored outside containers
- Restart with `docker-compose up`

### ✅ Restart Docker Containers
**Result**: All data is preserved!
- Volumes persist data
- IndexedDB persists in browser

### ⚠️ Clear Browser Data
**Result**: Frontend data is lost!
- IndexedDB will be cleared
- Backend Excel files remain (if using)

### ⚠️ Delete Project Folder
**Result**: All data is lost!
- Both IndexedDB and Excel files would be lost

## Backup Recommendations

### Option 1: Export Data Regularly
Use the **Data Export** feature in the app:
1. Click "Export" in the header
2. Select all data types
3. Export to Excel or PDF
4. Save to cloud storage (Google Drive, iCloud, etc.)

### Option 2: Backup Project Folder
```bash
# Copy the entire project folder
cp -r /Users/ketharnathsivavenkatesan/Desktop/Github /path/to/backup/
```

### Option 3: Backup Backend Data
```bash
# Copy backend data folder
cp -r backend/data /path/to/backup/
cp backend/budget_data.xlsx /path/to/backup/
```

## Quick Test

To verify data persistence:
1. Add a test expense/transaction
2. Shut down Docker: `docker-compose down`
3. Restart Docker: `docker-compose up -d`
4. Open http://localhost:3000
5. ✅ Your test data should still be there!

## Summary

**Your data is safe!** It persists across:
- ✅ Laptop shutdowns
- ✅ Docker restarts
- ✅ Application restarts
- ✅ Browser restarts

**Just remember**:
- Don't clear browser data
- Don't delete the project folder
- Export regularly for extra safety

