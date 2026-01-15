# Google Sheets Setup - Super Simple Guide 🚀

## Why Do I Need This?

Even though your Google Sheet is **public and editable**, Google's API requires authentication for apps to write to it programmatically. This is Google's security requirement.

**Good news:** It only takes 5 minutes to set up once, then it works forever!

---

## Step-by-Step (Copy & Paste)

### 1. Go to Google Cloud Console
👉 https://console.cloud.google.com

### 2. Create Project
- Click **"Select a project"** (top)
- Click **"New Project"**
- Name: `Budget Calculator`
- Click **"Create"**
- Wait 10 seconds for it to create

### 3. Enable APIs
- Click **"APIs & Services"** (left menu)
- Click **"Library"**
- Search: `Google Sheets API` → Click → **"Enable"**
- Go back, search: `Google Drive API` → Click → **"Enable"**

### 4. Create Service Account
- Click **"APIs & Services"** → **"Credentials"**
- Click **"+ CREATE CREDENTIALS"** (top)
- Select **"Service Account"**
- Name: `budget-calculator`
- Click **"CREATE AND CONTINUE"**
- Click **"CONTINUE"** (skip role)
- Click **"DONE"**

### 5. Create Key
- Click on the service account you just created
- Click **"Keys"** tab
- Click **"ADD KEY"** → **"Create new key"**
- Select **JSON**
- Click **"CREATE"**
- **File downloads automatically!** ✅

### 6. Save File
- Find the downloaded file (usually in Downloads folder)
- It's named something like: `your-project-xxxxx-xxxxx.json`
- **Rename it to:** `credentials.json`
- **Move it to:** `backend/credentials.json`
- Full path should be: `/Users/ketharnathsivavenkatesan/Desktop/Github /backend/credentials.json`

### 7. Share Google Sheet
- **Open the JSON file** you just saved
- Find this line: `"client_email": "something@something.iam.gserviceaccount.com"`
- **Copy that email address**
- Open your Google Sheet: https://docs.google.com/spreadsheets/d/1Dp4UGkT8h-PHnEXDPbGqnnDxsvhP6zO_UvxXH4xXLu0/edit
- Click **"Share"** button (top right)
- **Paste the email** you copied
- Change permission to **"Editor"**
- Click **"Send"**

### 8. Restart Backend
```bash
# Stop backend (Ctrl+C in terminal)
cd backend
source venv/bin/activate
python main.py
```

### 9. Test It!
- Go to your app
- Click **"Sync Google Sheet"**
- Should show: "Google Sheets synced! X rows updated." ✅

---

## That's It! 🎉

Now whenever you:
- Click **"Update Excel"** → Also syncs to Google Sheets automatically
- Click **"Sync Google Sheet"** → Manually syncs to Google Sheets

---

## Troubleshooting

### "credentials.json not found"
- ✅ Make sure file is named exactly `credentials.json` (not `.txt`)
- ✅ Make sure it's in `backend/` folder
- ✅ Check the path is correct

### "Permission denied"
- ✅ Share Google Sheet with service account email
- ✅ Give it **Editor** access (not Viewer)
- ✅ Check the email matches the one in JSON file

### Still not working?
- Check backend terminal for error messages
- Verify JSON file is valid (open it, should see JSON data)
- Make sure sheet is shared with service account email

---

## Quick Checklist

- [ ] Created Google Cloud project
- [ ] Enabled Google Sheets API
- [ ] Enabled Google Drive API
- [ ] Created service account
- [ ] Downloaded JSON key
- [ ] Saved as `backend/credentials.json`
- [ ] Shared Google Sheet with service account email
- [ ] Restarted backend
- [ ] Tested "Sync Google Sheet" button

---

**Once set up, it works automatically forever!** 🚀

