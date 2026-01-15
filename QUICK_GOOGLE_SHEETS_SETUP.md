# 🚀 Quick Google Sheets Setup (5 minutes)

## Your app is live! ✅ But data isn't syncing to Google Sheets yet.

To fix this, you need to set up Google Apps Script.

---

## Step 1: Open Google Apps Script

1. Go to your Google Sheet: https://docs.google.com/spreadsheets/d/1Dp4UGkT8h-PHnEXDPbGqnnDxsvhP6zO_UvxXH4xXLu0/edit
2. Click **Extensions** → **Apps Script**
3. Delete any existing code

---

## Step 2: Paste This Code

Copy and paste this entire code:

```javascript
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
      
      // Check if headers exist
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
      return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'Record added' }));
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
          return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'Record updated' }));
        }
      }
      
      return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Record not found' }));
    }
    
    if (action === 'delete') {
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
          sheet.deleteRow(i + 1);
          return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'Record deleted' }));
        }
      }
      
      return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Record not found' }));
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
      
      return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'All data synced' }));
    }
    
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Unknown action' }));
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: error.toString() }));
  }
}
```

---

## Step 3: Save the Script

1. Click **Save** (or press `Ctrl+S` / `Cmd+S`)
2. Give it a name: "Budget Calculator Sync"

---

## Step 4: Deploy as Web App

1. Click **Deploy** → **New deployment**
2. Click the gear icon ⚙️ next to "Select type"
3. Choose **Web app**
4. Fill in:
   - **Description**: Budget Calculator Sync
   - **Execute as**: Me
   - **Who has access**: **Anyone** (IMPORTANT!)
5. Click **Deploy**
6. **Authorize** if asked (click "Authorize access")
7. **Copy the Web App URL** (looks like: `https://script.google.com/macros/s/.../exec`)

---

## Step 5: Add URL to Code

**Option A: Quick Fix (Hardcode in code)**

1. Open: `src/utils/googleSheetsDirect.js`
2. Find line 133: `const GOOGLE_SCRIPT_URL = process.env.REACT_APP_GOOGLE_SCRIPT_URL || '';`
3. Replace with: `const GOOGLE_SCRIPT_URL = 'YOUR_SCRIPT_URL_HERE';` (paste your URL)
4. Save and push to GitHub

**Option B: Better (Use config)**

I'll create a config file for you - just tell me your script URL and I'll add it!

---

## ✅ Test It

1. Create a record in your app
2. Check your Google Sheet
3. You should see the data appear automatically!

---

## 🆘 Need Help?

If you get stuck, just share your Google Apps Script Web App URL and I'll add it to the code for you!

