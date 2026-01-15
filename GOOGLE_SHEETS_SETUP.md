# Google Sheets Setup Guide 📊

## Your Google Sheet
**Link**: https://docs.google.com/spreadsheets/d/1Dp4UGkT8h-PHnEXDPbGqnnDxsvhP6zO_UvxXH4xXLu0/edit

## Current Issue
- Google Sheet is read-only
- When updating Excel, it shows "0 rows updated"
- Need to sync Excel data to Google Sheets

---

## Solution: Setup Google Sheets API

### Step 1: Create Google Cloud Project

1. Go to https://console.cloud.google.com
2. Click "Select a project" → "New Project"
3. Name it "Budget Calculator" (or any name)
4. Click "Create"

### Step 2: Enable APIs

1. In Google Cloud Console, go to **APIs & Services** → **Library**
2. Search for "Google Sheets API" → Click → **Enable**
3. Search for "Google Drive API" → Click → **Enable**

### Step 3: Create Service Account

1. Go to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **Service Account**
3. Fill in:
   - **Service account name**: `budget-calculator-service`
   - **Service account ID**: (auto-generated)
   - Click **CREATE AND CONTINUE**
4. Skip role assignment (click **CONTINUE**)
5. Click **DONE**

### Step 4: Create Key

1. Click on the service account you just created
2. Go to **Keys** tab
3. Click **ADD KEY** → **Create new key**
4. Select **JSON** format
5. Click **CREATE**
6. A JSON file will download

### Step 5: Save Credentials

1. Rename the downloaded file to `credentials.json`
2. Move it to: `backend/credentials.json`
3. Make sure the path is: `/Users/ketharnathsivavenkatesan/Desktop/Github /backend/credentials.json`

### Step 6: Share Google Sheet

1. Open the JSON file you downloaded
2. Find the `client_email` field (looks like: `budget-calculator-service@your-project.iam.gserviceaccount.com`)
3. Copy that email address
4. Open your Google Sheet: https://docs.google.com/spreadsheets/d/1Dp4UGkT8h-PHnEXDPbGqnnDxsvhP6zO_UvxXH4xXLu0/edit
5. Click **Share** button (top right)
6. Paste the service account email
7. Give it **Editor** access
8. Click **Send**

---

## How to Use

### Option 1: Auto-Sync (Recommended)

When you click **"Update Excel"** in the app:
- ✅ Saves to Excel file
- ✅ **Automatically syncs to Google Sheets** (if credentials are set up)

### Option 2: Manual Sync

1. Click **"Sync Google Sheet"** button in the header
2. All data from Excel will be synced to Google Sheets
3. You'll see: "Google Sheets synced! X rows updated."

---

## What Gets Synced

### Sheets Created in Google Sheets:
- **Income** - All income transactions
- **Expense** - All expense transactions  
- **Summary** - Financial statistics

### Data Format:
- Headers in blue (formatted)
- All rows from Excel
- Auto-updates when you click "Update Excel"

---

## Troubleshooting

### "Failed to authenticate with Google"
- ✅ Check `backend/credentials.json` exists
- ✅ Verify the JSON file is valid
- ✅ Make sure service account email has access to Google Sheet

### "0 rows updated"
- ✅ Make sure you have data in Excel first
- ✅ Click "Update Excel" to save data to Excel
- ✅ Then click "Sync Google Sheet"

### Google Sheet Still Read-Only
- ✅ Share the sheet with service account email
- ✅ Give it **Editor** (not Viewer) access
- ✅ Check the email matches the one in `credentials.json`

---

## Quick Test

1. **Add data** in your app (income or expense)
2. **Click "Update Excel"** - Should save to Excel
3. **Click "Sync Google Sheet"** - Should sync to Google Sheets
4. **Open Google Sheet** - You should see your data!

---

## Your Google Sheet Structure

After first sync, you'll see:

```
Income Sheet:
- ID | Date | Time | Category | Subcategory | Amount | Description | Created At | Updated At

Expense Sheet:
- ID | Date | Time | Category | Subcategory | Amount | Description | Created At | Updated At

Summary Sheet:
- Metric | Value | Last Updated
```

---

**Once credentials.json is set up, everything will work automatically!** 🎉

