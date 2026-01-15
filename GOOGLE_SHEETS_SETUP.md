# 📊 Google Sheets Setup - Simple Database

## ✅ Quick Setup (2 minutes)

### Step 1: Make Your Google Sheet Public

1. Open: https://docs.google.com/spreadsheets/d/1Dp4UGkT8h-PHnEXDPbGqnnDxsvhP6zO_UvxXH4xXLu0/edit
2. Click **Share** (top right)
3. Change to: **"Anyone with the link can view"**
4. Click **Done**

### Step 2: Create Sheets (if not exist)

Your Google Sheet should have these sheets:
- **Income** - For income transactions
- **Expense** - For expenses

**Headers for Income sheet:**
```
ID | Date | Type | Category | Subcategory | Amount | Description | Created At
```

**Headers for Expense sheet:**
```
ID | Date | Category | Subcategory | Amount | Description | Created At
```

### Step 3: Test It!

1. Open your app
2. Click **"Fetch from Excel"**
3. Data should load from Google Sheets!

---

## 📝 How It Works

### **Reading (Works Now!)**
- ✅ Reads directly from Google Sheets
- ✅ No setup needed (if sheet is public)
- ✅ Works immediately!

### **Writing (Two Options)**

#### Option 1: Manual Upload (Works Now!)
1. Click **"Update Excel"**
2. Excel file downloads
3. Upload to Google Sheets manually
4. Done!

#### Option 2: Automatic Write (Optional Setup)
1. Create Google Apps Script (5 minutes)
2. Deploy as web app
3. Automatic write works!

---

## 🚀 Automatic Write Setup (Optional)

If you want automatic writing (no manual upload):

### Step 1: Create Google Apps Script

1. Open your Google Sheet
2. Click **Extensions** → **Apps Script**
3. Paste this code:

```javascript
function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet();
    const data = JSON.parse(e.postData.contents);
    
    // Clear existing data
    const incomeSheet = sheet.getSheetByName('Income') || sheet.insertSheet('Income');
    const expenseSheet = sheet.getSheetByName('Expense') || sheet.insertSheet('Expense');
    
    incomeSheet.clear();
    expenseSheet.clear();
    
    // Add headers
    incomeSheet.appendRow(['ID', 'Date', 'Type', 'Category', 'Subcategory', 'Amount', 'Description', 'Created At']);
    expenseSheet.appendRow(['ID', 'Date', 'Category', 'Subcategory', 'Amount', 'Description', 'Created At']);
    
    // Add income data
    if (data.transactions) {
      data.transactions.forEach(t => {
        incomeSheet.appendRow([
          t.ID || '',
          t.Date || '',
          'Income',
          t.Category || '',
          t.Subcategory || '',
          t.Amount || 0,
          t.Description || '',
          t['Created At'] || new Date().toISOString()
        ]);
      });
    }
    
    // Add expense data
    if (data.expenses) {
      data.expenses.forEach(e => {
        expenseSheet.appendRow([
          e.ID || '',
          e.Date || '',
          e.Category || '',
          e.Subcategory || '',
          e.Amount || 0,
          e.Description || '',
          e['Created At'] || new Date().toISOString()
        ]);
      });
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Data saved successfully!'
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
```

### Step 2: Deploy as Web App

1. Click **Deploy** → **New deployment**
2. Type: **Web app**
3. Execute as: **Me**
4. Who has access: **Anyone**
5. Click **Deploy**
6. Copy the **Web App URL**

### Step 3: Add URL to App

1. Create `.env` file in project root:
```
REACT_APP_GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

2. Rebuild and deploy

---

## ✅ That's It!

- **Reading**: Works immediately (if sheet is public)
- **Writing**: Manual upload works now, automatic write is optional

**Your Google Sheet is now your database!** 🎉

