# Google Sheet Link 📊

## Your Budget Calculator Google Sheet

**Direct Link:**
👉 **https://docs.google.com/spreadsheets/d/1Dp4UGkT8h-PHnEXDPbGqnnDxsvhP6zO_UvxXH4xXLu0/edit**

**Sheet ID:** `1Dp4UGkT8h-PHnEXDPbGqnnDxsvhP6zO_UvxXH4xXLu0`

---

## How It Works

### Current Setup:
- ✅ Google Sheet ID is configured in `backend/google_sheets.py`
- ✅ App syncs data to/from this Google Sheet
- ✅ Excel file (`backend/budget_data.xlsx`) also syncs with Google Sheets

### Sheets Structure:
The Google Sheet contains:
- **Income** - All income entries
- **Expense** - All expense entries
- **Summary** - Financial statistics
- **Monthly Sheets** - Data organized by month (e.g., "December 2024")

---

## Access Your Sheet

1. **Click the link above** to open in your browser
2. **Or copy this URL:**
   ```
   https://docs.google.com/spreadsheets/d/1Dp4UGkT8h-PHnEXDPbGqnnDxsvhP6zO_UvxXH4xXLu0/edit
   ```

---

## Sync Status

### Automatic Sync:
- ✅ App fetches data from Google Sheets on startup
- ✅ App pushes data to Google Sheets when you add/edit/delete entries
- ✅ Daily sync runs automatically

### Manual Sync:
- Use "Fetch from Excel" button in the app to pull latest data
- Use "Update Excel" button to push your current data

---

## Important Notes

⚠️ **Make sure the Google Sheet is:**
- Set to "Anyone with the link can view/edit" (if using service account)
- Or properly shared with your Google service account email

📝 **To enable Google Sheets sync:**
1. Create a Google Cloud project
2. Enable Google Sheets API
3. Create service account credentials
4. Save as `backend/credentials.json`
5. Share the Google Sheet with the service account email

See `GOOGLE_SHEET_CONFIG.md` for detailed setup instructions.

---

**Your Google Sheet is ready!** 🎉

