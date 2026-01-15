# Google Sheet Configuration

## Your Google Sheet

**Sheet ID:** `1Dp4UGkT8h-PHnEXDPbGqnnDxsvhP6zO_UvxXH4xXLu0`  
**Public URL:** https://docs.google.com/spreadsheets/d/1Dp4UGkT8h-PHnEXDPbGqnnDxsvhP6zO_UvxXH4xXLu0/edit?usp=sharing

## Quick Setup

### 1. Backend Configuration

Update `backend/.env` or set environment variables:

```bash
export GOOGLE_SHEET_ID=1Dp4UGkT8h-PHnEXDPbGqnnDxsvhP6zO_UvxXH4xXLu0
export GOOGLE_CREDENTIALS_FILE=credentials.json
```

### 2. Frontend Configuration

The app will automatically use this sheet ID when configured. Update `src/utils/googleSheetsSync.js` if needed:

```javascript
const GOOGLE_SHEET_ID = '1Dp4UGkT8h-PHnEXDPbGqnnDxsvhP6zO_UvxXH4xXLu0';
```

### 3. Make Sheet Public (Already Done)

Your sheet is already public. To verify:
1. Open the sheet
2. Click **Share** button
3. Should show "Anyone with the link can edit"

### 4. Service Account Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create/select a project
3. Enable **Google Sheets API** and **Google Drive API**
4. Create **Service Account**:
   - Go to **IAM & Admin** > **Service Accounts**
   - Click **Create Service Account**
   - Name: `budget-calculator-sync`
   - Click **Create and Continue**
   - Skip role assignment
   - Click **Done**
5. Create Key:
   - Click on the service account
   - Go to **Keys** tab
   - Click **Add Key** > **Create new key**
   - Select **JSON**
   - Download the file
6. Save as `backend/credentials.json`
7. Share Sheet with Service Account:
   - Open your Google Sheet
   - Click **Share**
   - Add the service account email (from credentials.json, field: `client_email`)
   - Give it **Editor** permission
   - Click **Send**

## Sheet Structure

The app expects these sheets in your Google Sheet:

1. **Transactions** - Income and expense transactions
2. **Expenses** - Detailed expense records
3. **Savings** - Savings deposits
4. **Budgets** - Budget limits
5. **Files** - PDF file metadata (auto-created)

## Auto-Sync Features

✅ **On App Load:** Fetches latest data from Google Sheets  
✅ **Daily Sync:** Automatically syncs once per day  
✅ **On Data Change:** Pushes changes to Google Sheets  
✅ **On App Resume:** Fetches latest data when app becomes active  

## Testing Sync

1. Add data in the app
2. Wait 2-3 seconds
3. Check Google Sheet - data should appear
4. Add data in Google Sheet
5. Refresh app - data should appear

## Troubleshooting

### Sync not working?
- Check backend is running: `http://localhost:8000`
- Verify `credentials.json` exists in `backend/`
- Check service account email has access to sheet
- Verify sheet ID is correct

### Data not appearing?
- Check sheet names match exactly (case-sensitive)
- Verify columns match expected format
- Check backend logs for errors

### Permission errors?
- Ensure service account has Editor access
- Verify Google Sheets API is enabled
- Check credentials.json is valid

