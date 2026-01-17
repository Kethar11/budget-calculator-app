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
// Handle CORS preflight requests (OPTIONS)
function doOptions(e) {
  return ContentService.createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    Logger.log('=== doPost called ===');
    Logger.log('e.postData exists: ' + (e.postData ? 'yes' : 'no'));
    Logger.log('e.parameter exists: ' + (e.parameter ? 'yes' : 'no'));
    
    // Handle both JSON and form data (for CORS bypass)
    let data;
    
    // Check if it's JSON (from postData.contents)
    if (e.postData && e.postData.contents) {
      try {
        Logger.log('Attempting to parse as JSON...');
        const jsonData = JSON.parse(e.postData.contents);
        data = jsonData;
        Logger.log('Successfully parsed as JSON');
      } catch (parseError) {
        // Not JSON, try form data
        Logger.log('JSON parse failed, trying form data. Error: ' + parseError.toString());
        const params = e.parameter || {};
        Logger.log('Form params: ' + JSON.stringify(params));
        
        // Handle clear action (no data field needed)
        if (params.action === 'clear') {
          data = {
            action: params.action,
            sheetId: params.sheetId
          };
          Logger.log('Clear action detected, data: ' + JSON.stringify(data));
        } else {
          // Other actions need data field
          try {
            const dataString = params.data || '';
            if (dataString) {
              Logger.log('Data string (raw): ' + dataString);
              const decodedData = decodeURIComponent(dataString);
              Logger.log('Data string (decoded): ' + decodedData);
              const parsedData = JSON.parse(decodedData);
              Logger.log('Data string (parsed): ' + JSON.stringify(parsedData));
              
              data = {
                action: params.action,
                sheetId: params.sheetId,
                type: params.type,
                data: parsedData,
                recordId: params.recordId
              };
            } else {
              // No data field, just action and sheetId
              data = {
                action: params.action,
                sheetId: params.sheetId,
                type: params.type,
                recordId: params.recordId
              };
            }
          } catch (formParseError) {
            Logger.log('ERROR parsing form data: ' + formParseError.toString());
            return ContentService.createTextOutput(JSON.stringify({ 
              success: false, 
              error: 'Failed to parse form data: ' + formParseError.toString() 
            }))
              .setMimeType(ContentService.MimeType.JSON);
          }
        }
      }
    } else {
      // Form data only (from e.parameter)
      Logger.log('No postData.contents, using e.parameter only');
      const params = e.parameter || {};
      Logger.log('Form params: ' + JSON.stringify(params));
      
      // Handle clear action (no data field needed)
      if (params.action === 'clear') {
        data = {
          action: params.action,
          sheetId: params.sheetId
        };
        Logger.log('Clear action detected, data: ' + JSON.stringify(data));
      } else {
        // Other actions need data field
        try {
          const dataString = params.data || '';
          if (dataString) {
            Logger.log('Data string (raw): ' + dataString);
            const decodedData = decodeURIComponent(dataString);
            Logger.log('Data string (decoded): ' + decodedData);
            const parsedData = JSON.parse(decodedData);
            Logger.log('Data string (parsed): ' + JSON.stringify(parsedData));
            
            data = {
              action: params.action,
              sheetId: params.sheetId,
              type: params.type,
              data: parsedData,
              recordId: params.recordId
            };
          } else {
            // No data field, just action and sheetId
            data = {
              action: params.action,
              sheetId: params.sheetId,
              type: params.type,
              recordId: params.recordId
            };
          }
        } catch (formParseError) {
          Logger.log('ERROR parsing form data: ' + formParseError.toString());
          return ContentService.createTextOutput(JSON.stringify({ 
            success: false, 
            error: 'Failed to parse form data: ' + formParseError.toString() 
          }))
            .setMimeType(ContentService.MimeType.JSON);
        }
      }
    }
    
    // Log for debugging (check Executions in Apps Script)
    Logger.log('Received data: ' + JSON.stringify(data));
    
    const sheetId = data.sheetId;
    const action = data.action;
    
    Logger.log('Action: ' + action);
    Logger.log('Type: ' + (data.type || 'N/A'));
    Logger.log('Sheet ID: ' + sheetId);
    
    if (!sheetId || !action) {
      Logger.log('ERROR: Missing sheetId or action');
      return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Missing sheetId or action' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const ss = SpreadsheetApp.openById(sheetId);
    
    if (action === 'add') {
      const sheetName = data.type === 'income' ? 'Income' : 'Expense';
      Logger.log('Looking for sheet: ' + sheetName);
      
      let sheet = ss.getSheetByName(sheetName);
      if (!sheet) {
        Logger.log('Sheet not found, creating: ' + sheetName);
        sheet = ss.insertSheet(sheetName);
        sheet.appendRow(['ID', 'Date', 'Category', 'Subcategory', 'Amount', 'Description', 'Currency', 'Created At']);
      }
      
      // Check if headers exist, if not add them
      if (sheet.getLastRow() === 0) {
        Logger.log('Sheet is empty, adding headers');
        sheet.appendRow(['ID', 'Date', 'Category', 'Subcategory', 'Amount', 'Description', 'Currency', 'Created At']);
      } else {
        // Check if Currency column exists, if not add it
        const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
        if (headers.indexOf('Currency') === -1) {
          // Add Currency column after Description
          const descIndex = headers.indexOf('Description');
          if (descIndex !== -1) {
            sheet.insertColumnAfter(descIndex + 1);
            sheet.getRange(1, descIndex + 2).setValue('Currency');
            // Fill existing rows with default currency
            const lastRow = sheet.getLastRow();
            if (lastRow > 1) {
              sheet.getRange(2, descIndex + 2, lastRow - 1, 1).setValue('EUR');
            }
          }
        }
      }
      
      // Ensure data.data exists
      if (!data.data) {
        Logger.log('ERROR: No data.data provided');
        Logger.log('Full data object: ' + JSON.stringify(data));
        return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'No data provided' }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      
      Logger.log('Data to add: ' + JSON.stringify(data.data));
      
      const rowData = [
        data.data.ID || '',
        data.data.Date || '',
        data.data.Category || '',
        data.data.Subcategory || '',
        data.data.Amount || 0,
        data.data.Description || '',
        data.data.Currency || data.data.entryCurrency || 'EUR',
        data.data['Created At'] || new Date().toISOString()
      ];
      
      Logger.log('Adding row: ' + JSON.stringify(rowData));
      sheet.appendRow(rowData);
      Logger.log('Row added successfully at row: ' + sheet.getLastRow());
      
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
          const currencyIndex = headers.indexOf('Currency');
          const numCols = currencyIndex !== -1 ? 8 : 7;
          const rowData = [
            data.data.ID,
            data.data.Date,
            data.data.Category,
            data.data.Subcategory,
            data.data.Amount,
            data.data.Description
          ];
          if (currencyIndex !== -1) {
            rowData.push(data.data.Currency || data.data.entryCurrency || 'EUR');
          }
          rowData.push(data.data['Created At']);
          sheet.getRange(i + 1, 1, 1, numCols).setValues([rowData]);
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
        incomeSheet.appendRow(['ID', 'Date', 'Category', 'Subcategory', 'Amount', 'Description', 'Currency', 'Created At']);
      } else {
        incomeSheet.clear();
        incomeSheet.appendRow(['ID', 'Date', 'Category', 'Subcategory', 'Amount', 'Description', 'Currency', 'Created At']);
      }
      
      if (data.transactions && data.transactions.length > 0) {
        data.transactions.forEach(t => {
          incomeSheet.appendRow([t.ID, t.Date, t.Category, t.Subcategory, t.Amount, t.Description, t.Currency || t.entryCurrency || 'EUR', t['Created At']]);
        });
      }
      
      if (!expenseSheet) {
        expenseSheet = ss.insertSheet('Expense');
        expenseSheet.appendRow(['ID', 'Date', 'Category', 'Subcategory', 'Amount', 'Description', 'Currency', 'Created At']);
      } else {
        expenseSheet.clear();
        expenseSheet.appendRow(['ID', 'Date', 'Category', 'Subcategory', 'Amount', 'Description', 'Currency', 'Created At']);
      }
      
      if (data.expenses && data.expenses.length > 0) {
        data.expenses.forEach(e => {
          expenseSheet.appendRow([e.ID, e.Date, e.Category, e.Subcategory, e.Amount, e.Description, e.Currency || e.entryCurrency || 'EUR', e['Created At']]);
        });
      }
      
      return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'All data synced' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === 'clear') {
      Logger.log('=== CLEAR ACTION STARTED ===');
      Logger.log('Sheet ID: ' + sheetId);
      
      let incomeSheet = ss.getSheetByName('Income');
      let expenseSheet = ss.getSheetByName('Expense');
      
      Logger.log('Income sheet exists: ' + (incomeSheet ? 'yes' : 'no'));
      Logger.log('Expense sheet exists: ' + (expenseSheet ? 'yes' : 'no'));
      
      if (incomeSheet) {
        try {
          const lastRow = incomeSheet.getLastRow();
          Logger.log('Income sheet last row: ' + lastRow);
          
          // Delete ALL rows including header, then re-add header
          if (lastRow > 0) {
            incomeSheet.deleteRows(1, lastRow);
            Logger.log('Deleted all ' + lastRow + ' rows from Income sheet');
          }
          
          // Re-add header
          incomeSheet.appendRow(['ID', 'Date', 'Category', 'Subcategory', 'Amount', 'Description', 'Currency', 'Created At']);
          Logger.log('Income sheet cleared successfully - header re-added');
        } catch (error) {
          Logger.log('ERROR clearing Income sheet: ' + error.toString());
          // Try alternative method
          try {
            incomeSheet.clear();
            incomeSheet.appendRow(['ID', 'Date', 'Category', 'Subcategory', 'Amount', 'Description', 'Currency', 'Created At']);
            Logger.log('Income sheet cleared using alternative method');
          } catch (error2) {
            Logger.log('ERROR with alternative method: ' + error2.toString());
          }
        }
      }
      
      if (expenseSheet) {
        try {
          const lastRow = expenseSheet.getLastRow();
          Logger.log('Expense sheet last row: ' + lastRow);
          
          // Delete ALL rows including header, then re-add header
          if (lastRow > 0) {
            expenseSheet.deleteRows(1, lastRow);
            Logger.log('Deleted all ' + lastRow + ' rows from Expense sheet');
          }
          
          // Re-add header
          expenseSheet.appendRow(['ID', 'Date', 'Category', 'Subcategory', 'Amount', 'Description', 'Currency', 'Created At']);
          Logger.log('Expense sheet cleared successfully - header re-added');
        } catch (error) {
          Logger.log('ERROR clearing Expense sheet: ' + error.toString());
          // Try alternative method
          try {
            expenseSheet.clear();
            expenseSheet.appendRow(['ID', 'Date', 'Category', 'Subcategory', 'Amount', 'Description', 'Currency', 'Created At']);
            Logger.log('Expense sheet cleared using alternative method');
          } catch (error2) {
            Logger.log('ERROR with alternative method: ' + error2.toString());
          }
        }
      }
      
      Logger.log('=== CLEAR ACTION COMPLETED ===');
      return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'All sheets cleared' }))
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

