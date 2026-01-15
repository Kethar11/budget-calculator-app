# Google Apps Script Setup (5 minutes)

To enable direct sync to Google Sheets (no Excel downloads), follow these steps:

## Step 1: Open Google Apps Script

1. Go to your Google Sheet: https://docs.google.com/spreadsheets/d/1Dp4UGkT8h-PHnEXDPbGqnnDxsvhP6zO_UvxXH4xXLu0/edit
2. Click **Extensions** → **Apps Script**
3. Delete any existing code

## Step 2: Paste This Code

```javascript
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheetId = data.sheetId;
    const action = data.action;
    
    const ss = SpreadsheetApp.openById(sheetId);
    
    if (action === 'add') {
      const sheet = ss.getSheetByName(data.type === 'income' ? 'Income' : 'Expense');
      if (!sheet) {
        sheet = ss.insertSheet(data.type === 'income' ? 'Income' : 'Expense');
        // Add headers
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
      const headers = values[0];
      const idIndex = headers.indexOf('ID');
      
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
      const headers = values[0];
      const idIndex = headers.indexOf('ID');
      
      for (let i = 1; i < values.length; i++) {
        if (values[i][idIndex] == data.recordId) {
          sheet.deleteRow(i + 1);
          return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'Record deleted' }));
        }
      }
      
      return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Record not found' }));
    }
    
    if (action === 'syncAll') {
      // Clear and update all data
      const incomeSheet = ss.getSheetByName('Income');
      const expenseSheet = ss.getSheetByName('Expense');
      
      if (incomeSheet) {
        incomeSheet.clear();
        incomeSheet.appendRow(['ID', 'Date', 'Category', 'Subcategory', 'Amount', 'Description', 'Created At']);
        if (data.transactions) {
          data.transactions.forEach(t => {
            incomeSheet.appendRow([t.ID, t.Date, t.Category, t.Subcategory, t.Amount, t.Description, t['Created At']]);
          });
        }
      }
      
      if (expenseSheet) {
        expenseSheet.clear();
        expenseSheet.appendRow(['ID', 'Date', 'Category', 'Subcategory', 'Amount', 'Description', 'Created At']);
        if (data.expenses) {
          data.expenses.forEach(e => {
            expenseSheet.appendRow([e.ID, e.Date, e.Category, e.Subcategory, e.Amount, e.Description, e['Created At']]);
          });
        }
      }
      
      return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'All data synced' }));
    }
    
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Unknown action' }));
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: error.toString() }));
  }
}
```

## Step 3: Deploy as Web App

1. Click **Deploy** → **New deployment**
2. Click the gear icon ⚙️ next to "Select type" → Choose **Web app**
3. Set:
   - **Description**: Budget Calculator Sync
   - **Execute as**: Me
   - **Who has access**: Anyone
4. Click **Deploy**
5. **Copy the Web App URL** (looks like: `https://script.google.com/macros/s/.../exec`)

## Step 4: Add URL to App

1. Create a file `.env.local` in the project root:
```
REACT_APP_GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

2. Restart the app: `npm start`

## ✅ Done!

Now when you create/update/delete records, they will sync directly to Google Sheets!

