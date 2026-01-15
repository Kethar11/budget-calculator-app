# Electron Mac App - Local File Storage

## ✅ Data Stored Locally on Your Mac

When running as an Electron Mac app, **all data is stored in local files on your computer**, not in browser storage.

## 📁 Data Location

**Mac Location**: 
```
~/Library/Application Support/Budget Calculator/budget-calculator-data/
```

**Files Stored**:
- `transactions.json` - All transactions
- `expenses.json` - All expenses
- `savings.json` - All savings deposits
- `goals.json` - All goals
- `reminders.json` - All reminders
- `budgets.json` - All budgets
- `settings.json` - App settings

## 🔄 How It Works

1. **When you add/edit/delete data**:
   - Data is saved to IndexedDB (for fast access)
   - Data is automatically synced to local JSON files every 5 seconds
   - Files are stored on your Mac's hard drive

2. **When you restart the app**:
   - If IndexedDB is empty, data is restored from local JSON files
   - Your data is always safe!

3. **If browser data is cleared**:
   - ✅ **No problem!** Data is restored from local files automatically
   - Your data is stored on your Mac, not in browser storage

## ✅ Benefits

- **No browser data loss**: Data is in files on your Mac
- **Persistent**: Survives browser data clearing
- **Backup-friendly**: JSON files can be easily backed up
- **Portable**: Copy the data folder to backup/restore

## 🔍 Finding Your Data

To find your data files:

1. Open Finder
2. Press `Cmd + Shift + G` (Go to Folder)
3. Type: `~/Library/Application Support/Budget Calculator/budget-calculator-data/`
4. Press Enter

You'll see all your data files there!

## 💾 Backup Your Data

To backup:
1. Copy the entire `budget-calculator-data` folder
2. Save it to iCloud, external drive, or anywhere safe

To restore:
1. Replace the `budget-calculator-data` folder with your backup
2. Restart the app - data will be restored automatically

## 🎯 Summary

**In Electron Mac App**:
- ✅ Data stored in local files on your Mac
- ✅ No browser storage dependency
- ✅ Survives browser data clearing
- ✅ Easy to backup and restore
- ✅ Data location: `~/Library/Application Support/Budget Calculator/budget-calculator-data/`



