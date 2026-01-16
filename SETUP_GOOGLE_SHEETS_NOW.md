# 🚀 Setup Google Sheets Sync NOW (Step by Step)

## Problem: Phone doesn't see computer data because Google Sheet is empty

Your Google Sheet: https://docs.google.com/spreadsheets/d/1Dp4UGkT8h-PHnEXDPbGqnnDxsvhP6zO_UvxXH4xXLu0/edit

---

## ✅ Solution: Set Up Google Apps Script (5 minutes)

### Step 1: Open Google Apps Script

1. Go to your Google Sheet: https://docs.google.com/spreadsheets/d/1Dp4UGkT8h-PHnEXDPbGqnnDxsvhP6zO_UvxXH4xXLu0/edit
2. Click **Extensions** → **Apps Script**
3. Delete any existing code

---

### Step 2: Paste This Code

Copy ALL of this code and paste it:

```javascript
// Handle CORS preflight requests
function doOptions() {
  return ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheetId = data.sheetId;
    const action = data.action;
    
    const ss = SpreadsheetApp.openById(sheetId);
    
    if (action === 'add') {
      let sheet = ss.getSheetByName(data.type === 'income' ? 'Income' : 'Expense');
      if (!sheet) {
        sheet = ss.insertSheet(data.type === 'income' ? 'Income' : 'Expense');
        sheet.appendRow(['ID', 'Date', 'Category', 'Subcategory', 'Amount', 'Description', 'Created At']);
      }
      
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(['ID', 'Date', 'Category', 'Subcategory', 'Amount', 'Description', 'Created At']);
      }
      
      const rowData = [
        data.data.ID,
        data.data.Date,
        data.data.Category,
        data.data.Subcategory,
        data.data.Amount,
        data.data.Description,
        data.data['Created At']
      ];
      
      sheet.appendRow(rowData);
      return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'Record added' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === 'update') {
      const sheet = ss.getSheetByName(data.type === 'income' ? 'Income' : 'Expense');
      if (!sheet) return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Sheet not found' }));
      
      const dataRange = sheet.getDataRange();
      const values = dataRange.getValues();
      if (values.length === 0) return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'No data' }));
      
      const headers = values[0];
      const idIndex = headers.indexOf('ID');
      if (idIndex === -1) return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'ID column not found' }));
      
      for (let i = 1; i < values.length; i++) {
        if (values[i][idIndex] == data.recordId) {
          sheet.getRange(i + 1, 1, 1, 7).setValues([[
            data.data.ID,
            data.data.Date,
            data.data.Category,
            data.data.Subcategory,
            data.data.Amount,
            data.data.Description,
            data.data['Created At']
          ]]);
          return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'Record updated' }))
            .setMimeType(ContentService.MimeType.JSON);
        }
      }
      
      return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Record not found' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === 'delete') {
      const sheet = ss.getSheetByName(data.type === 'income' ? 'Income' : 'Expense');
      if (!sheet) return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Sheet not found' }))
        .setMimeType(ContentService.MimeType.JSON);
      
      const dataRange = sheet.getDataRange();
      const values = dataRange.getValues();
      if (values.length === 0) return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'No data' }))
        .setMimeType(ContentService.MimeType.JSON);
      
      const headers = values[0];
      const idIndex = headers.indexOf('ID');
      if (idIndex === -1) return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'ID column not found' }))
        .setMimeType(ContentService.MimeType.JSON);
      
      for (let i = 1; i < values.length; i++) {
        if (values[i][idIndex] == data.recordId) {
          sheet.deleteRow(i + 1);
          return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'Record deleted' }))
            .setMimeType(ContentService.MimeType.JSON);
        }
      }
      
      return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Record not found' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === 'syncAll') {
      let incomeSheet = ss.getSheetByName('Income');
      let expenseSheet = ss.getSheetByName('Expense');
      
      if (!incomeSheet) {
        incomeSheet = ss.insertSheet('Income');
        incomeSheet.appendRow(['ID', 'Date', 'Category', 'Subcategory', 'Amount', 'Description', 'Created At']);
      } else {
        incomeSheet.clear();
        incomeSheet.appendRow(['ID', 'Date', 'Category', 'Subcategory', 'Amount', 'Description', 'Created At']);
      }
      
      if (data.transactions && data.transactions.length > 0) {
        data.transactions.forEach(t => {
          incomeSheet.appendRow([t.ID, t.Date, t.Category, t.Subcategory, t.Amount, t.Description, t['Created At']]);
        });
      }
      
      if (!expenseSheet) {
        expenseSheet = ss.insertSheet('Expense');
        expenseSheet.appendRow(['ID', 'Date', 'Category', 'Subcategory', 'Amount', 'Description', 'Created At']);
      } else {
        expenseSheet.clear();
        expenseSheet.appendRow(['ID', 'Date', 'Category', 'Subcategory', 'Amount', 'Description', 'Created At']);
      }
      
      if (data.expenses && data.expenses.length > 0) {
        data.expenses.forEach(e => {
          expenseSheet.appendRow([e.ID, e.Date, e.Category, e.Subcategory, e.Amount, e.Description, e['Created At']]);
        });
      }
      
      return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'All data synced' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Unknown action' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

---

### Step 3: Save the Script

1. Click **Save** (or press `Ctrl+S` / `Cmd+S`)
2. Name it: "Budget Calculator Sync"

---

### Step 4: Deploy as Web App

1. Click **Deploy** → **New deployment**
2. Click the gear icon ⚙️ next to "Select type"
3. Choose **Web app**
4. Fill in:
   - **Description**: Budget Calculator Sync
   - **Execute as**: **Me**
   - **Who has access**: **Anyone** ⚠️ (IMPORTANT - must be "Anyone")
5. Click **Deploy**
6. **Authorize** if asked:
   - Click "Authorize access"
   - Choose your Google account
   - Click "Advanced" → "Go to Budget Calculator Sync (unsafe)"
   - Click "Allow"
7. **Copy the Web App URL** (looks like: `https://script.google.com/macros/s/.../exec`)

---

### Step 5: Send Me Your Script URL

Once you have the URL, share it with me and I'll add it to the code!

Or you can add it yourself:
1. Open: `src/utils/googleSheetsDirect.js`
2. Find line 133
3. Replace: `const GOOGLE_SCRIPT_URL = '';`
4. With: `const GOOGLE_SCRIPT_URL = 'YOUR_URL_HERE';`
5. Push to GitHub

---

## ✅ After Setup:

1. **On Computer**: Create/update records → They sync to Google Sheets automatically
2. **On Phone**: Click "Fetch from Excel" → Gets latest data from Google Sheets
3. **Both stay in sync!** 🎉

---

## 🆘 Quick Test:

After setting up:
1. Create a record on your computer
2. Check Google Sheet - you should see it appear
3. On phone, click "Fetch from Excel"
4. You should see the record on your phone!

