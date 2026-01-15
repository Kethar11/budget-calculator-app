# Google Sheets Quick Setup (5 Minutes) ⚡

## Your Public Google Sheet
**Link**: https://docs.google.com/spreadsheets/d/1Dp4UGkT8h-PHnEXDPbGqnnDxsvhP6zO_UvxXH4xXLu0/edit

**Note**: Even though your sheet is public and editable, Google Sheets API requires authentication to write programmatically. This is a Google security requirement.

---

## Quick Setup (5 Minutes)

### Step 1: Create Google Cloud Project (2 min)

1. Go to: https://console.cloud.google.com
2. Click **"Select a project"** → **"New Project"**
3. Name: `Budget Calculator`
4. Click **"Create"**

### Step 2: Enable APIs (1 min)

1. In Google Cloud Console, click **"APIs & Services"** → **"Library"**
2. Search: **"Google Sheets API"** → Click → **"Enable"**
3. Search: **"Google Drive API"** → Click → **"Enable"**

### Step 3: Create Service Account (1 min)

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"+ CREATE CREDENTIALS"** → **"Service Account"**
3. Name: `budget-calculator`
4. Click **"CREATE AND CONTINUE"**
5. Skip role (click **"CONTINUE"**)
6. Click **"DONE"**

### Step 4: Download Key (30 sec)

1. Click on the service account you just created
2. Go to **"Keys"** tab
3. Click **"ADD KEY"** → **"Create new key"**
4. Select **JSON**
5. Click **"CREATE"**
6. File downloads automatically

### Step 5: Save Credentials (30 sec)

1. Rename downloaded file to: `credentials.json`
2. Move it to: `backend/credentials.json`
3. Full path: `/Users/ketharnathsivavenkatesan/Desktop/Github /backend/credentials.json`

### Step 6: Share Google Sheet (30 sec)

1. Open the downloaded JSON file
2. Find `"client_email"` (looks like: `budget-calculator@your-project.iam.gserviceaccount.com`)
3. Copy that email
4. Open your Google Sheet: https://docs.google.com/spreadsheets/d/1Dp4UGkT8h-PHnEXDPbGqnnDxsvhP6zO_UvxXH4xXLu0/edit
5. Click **"Share"** (top right)
6. Paste the service account email
7. Give it **"Editor"** access
8. Click **"Send"**

---

## Done! ✅

Now restart your backend:

```bash
cd backend
# Stop current backend (Ctrl+C)
source venv/bin/activate
python main.py
```

Then click **"Sync Google Sheet"** in your app - it should work!

---

## Why Do I Need This?

Even though your Google Sheet is public, Google's API requires authentication for security. This is a Google requirement, not our app's requirement.

The service account acts as a "robot user" that can edit your sheet programmatically.

---

## Troubleshooting

### "Failed to authenticate"
- ✅ Check `backend/credentials.json` exists
- ✅ Check JSON file is valid
- ✅ Check service account email has access to sheet

### "Permission denied"
- ✅ Share sheet with service account email
- ✅ Give it **Editor** (not Viewer) access

### Still not working?
- Check backend terminal for error messages
- Verify the JSON file is in `backend/` folder
- Make sure sheet is shared with service account email

---

**That's it! Takes 5 minutes and then Google Sheets sync works forever!** 🎉

