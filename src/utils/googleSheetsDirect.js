/**
 * Google Sheets as Database - Direct API (No Backend!)
 * 
 * Uses Google Sheets API directly from browser
 * Simple, fast, and free!
 * 
 * Google Sheet ID: 1Dp4UGkT8h-PHnEXDPbGqnnDxsvhP6zO_UvxXH4xXLu0
 */

const GOOGLE_SHEET_ID = '1Dp4UGkT8h-PHnEXDPbGqnnDxsvhP6zO_UvxXH4xXLu0';

/**
 * Read from Google Sheets using public API
 * For public sheets, we can read without authentication
 */
export const readFromGoogleSheets = async () => {
  try {
    // Read Income sheet (public access) - try different sheet names
    let incomeData = null;
    let expenseData = null;
    
    // Try "Income" sheet first
    try {
      const incomeUrl = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/gviz/tq?tqx=out:json&sheet=Income`;
      const incomeResponse = await fetch(incomeUrl);
      if (incomeResponse.ok) {
        const incomeText = await incomeResponse.text();
        incomeData = JSON.parse(incomeText.substring(47).slice(0, -2));
      }
    } catch (e) {
      console.log('Income sheet not found, trying Sheet1...');
    }
    
    // Try "Sheet1" if Income doesn't exist
    if (!incomeData) {
      try {
        const sheet1Url = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/gviz/tq?tqx=out:json&sheet=Sheet1`;
        const sheet1Response = await fetch(sheet1Url);
        if (sheet1Response.ok) {
          const sheet1Text = await sheet1Response.text();
          incomeData = JSON.parse(sheet1Text.substring(47).slice(0, -2));
        }
      } catch (e) {
        console.log('Sheet1 not found');
      }
    }
    
    // Read Expense sheet
    try {
      const expenseUrl = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/gviz/tq?tqx=out:json&sheet=Expense`;
      const expenseResponse = await fetch(expenseUrl);
      if (expenseResponse.ok) {
        const expenseText = await expenseResponse.text();
        expenseData = JSON.parse(expenseText.substring(47).slice(0, -2));
      }
    } catch (e) {
      console.log('Expense sheet not found');
    }
    
    // Convert to app format
    const transactions = [];
    const expenses = [];
    
    // Helper function to get cell value
    const getCellValue = (row, colIndex) => {
      if (!row.c || !row.c[colIndex]) return null;
      return row.c[colIndex].v || row.c[colIndex].f || null;
    };
    
    // Process Income sheet
    if (incomeData && incomeData.table && incomeData.table.rows && incomeData.table.rows.length > 1) {
      const headers = incomeData.table.cols.map(col => col.label || '');
      incomeData.table.rows.forEach((row, index) => {
        if (index === 0) return; // Skip header
        const id = getCellValue(row, headers.indexOf('ID'));
        const date = getCellValue(row, headers.indexOf('Date'));
        const amount = getCellValue(row, headers.indexOf('Amount'));
        
        // Only process rows with data
        if (id !== null || date || amount) {
          // Parse date safely
          let parsedDate = '';
          if (date) {
            try {
              const dateObj = new Date(date);
              if (!isNaN(dateObj.getTime())) {
                parsedDate = dateObj.toISOString().split('T')[0];
              } else {
                // Try parsing as string date
                parsedDate = date.toString();
              }
            } catch (e) {
              parsedDate = date.toString();
            }
          }
          
          const transaction = {
            ID: id || index,
            Date: parsedDate,
            Type: 'Income',
            Category: getCellValue(row, headers.indexOf('Category')) || '',
            Subcategory: getCellValue(row, headers.indexOf('Subcategory')) || '',
            Amount: parseFloat(amount || 0),
            Description: getCellValue(row, headers.indexOf('Description')) || '',
            Currency: getCellValue(row, headers.indexOf('Currency')) || 'EUR',
            'Created At': getCellValue(row, headers.indexOf('Created At')) || new Date().toISOString()
          };
          transactions.push(transaction);
        }
      });
    }
    
    // Process Expense sheet
    if (expenseData && expenseData.table && expenseData.table.rows && expenseData.table.rows.length > 1) {
      const headers = expenseData.table.cols.map(col => col.label || '');
      expenseData.table.rows.forEach((row, index) => {
        if (index === 0) return; // Skip header
        const id = getCellValue(row, headers.indexOf('ID'));
        const date = getCellValue(row, headers.indexOf('Date'));
        const amount = getCellValue(row, headers.indexOf('Amount'));
        
        // Only process rows with data
        if (id !== null || date || amount) {
          // Parse date safely
          let parsedDate = '';
          if (date) {
            try {
              const dateObj = new Date(date);
              if (!isNaN(dateObj.getTime())) {
                parsedDate = dateObj.toISOString().split('T')[0];
              } else {
                // Try parsing as string date
                parsedDate = date.toString();
              }
            } catch (e) {
              parsedDate = date.toString();
            }
          }
          
          const expense = {
            ID: id || index,
            Date: parsedDate,
            Category: getCellValue(row, headers.indexOf('Category')) || '',
            Subcategory: getCellValue(row, headers.indexOf('Subcategory')) || '',
            Amount: parseFloat(amount || 0),
            Description: getCellValue(row, headers.indexOf('Description')) || '',
            Currency: getCellValue(row, headers.indexOf('Currency')) || 'EUR',
            'Created At': getCellValue(row, headers.indexOf('Created At')) || new Date().toISOString()
          };
          expenses.push(expense);
          transactions.push({ ...expense, Type: 'Expense' });
        }
      });
    }
    
    return { transactions, expenses, success: true };
  } catch (error) {
    console.error('Error reading from Google Sheets:', error);
    return { transactions: [], expenses: [], success: false, error: error.message };
  }
};

/**
 * Google Apps Script Web App URL
 * 
 * TO ENABLE GOOGLE SHEETS SYNC:
 * 1. Set up Google Apps Script (see QUICK_GOOGLE_SHEETS_SETUP.md)
 * 2. Get your Web App URL
 * 3. Replace the empty string below with your URL
 * 
 * Example: const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/YOUR_ID/exec';
 */
const GOOGLE_SCRIPT_URL = process.env.REACT_APP_GOOGLE_SCRIPT_URL || 'https://script.google.com/macros/s/AKfycbyD5Y-Ln9H0va23HngNc6_jDU7czM0OsLB2Oc94i6s_qVBDabALV72kLQsp7dYROtZYBw/exec';

/**
 * Add a single record to Google Sheets
 */
export const addRecordToGoogleSheets = async (record, type) => {
  if (!GOOGLE_SCRIPT_URL) {
    const errorMsg = 'Google Apps Script not configured. Please set up Google Apps Script to enable saving.\n\n' +
      '1. Open your Google Sheet\n' +
      '2. Go to Extensions → Apps Script\n' +
      '3. Set up the script (see instructions)\n' +
      '4. Deploy as Web App and get the URL\n' +
      '5. Add REACT_APP_GOOGLE_SCRIPT_URL to your environment variables';
    console.error(errorMsg);
    return { success: false, error: errorMsg, message: 'Google Script not configured' };
  }

  try {
    console.log('Attempting to add record to Google Sheets:', { type, recordId: record.id });
    console.log('Google Script URL:', GOOGLE_SCRIPT_URL);
    
    const requestBody = {
      action: 'add',
      sheetId: GOOGLE_SHEET_ID,
      type: type, // 'income' or 'expense'
      data: {
        ID: record.id,
        Date: record.date ? new Date(record.date).toISOString().split('T')[0] : '',
        Category: record.category || '',
        Subcategory: record.subcategory || '',
        Amount: record.amount || 0,
        Description: record.description || '',
        Currency: record.entryCurrency || 'EUR',
        'Created At': record.createdAt || new Date().toISOString()
      }
    };
    
    console.log('Request body:', JSON.stringify(requestBody, null, 2));
    
    // Try JSON first (if CORS allows)
    try {
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Success response:', result);
        return { success: true, message: result.message || 'Record added to Google Sheets' };
      } else {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText || 'Failed to add record'}`);
      }
    } catch (corsError) {
      // If CORS fails, try form data approach
      console.log('JSON request failed, trying form data:', corsError.message);
      
      const formData = new URLSearchParams();
      formData.append('action', requestBody.action);
      formData.append('sheetId', requestBody.sheetId);
      formData.append('type', requestBody.type);
      formData.append('data', JSON.stringify(requestBody.data));
      
      const formResponse = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors', // Bypass CORS for Google Apps Script
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: formData.toString()
      });
      
      // With no-cors, we can't read response, but request should succeed
      // Wait longer for the script to process (Google Apps Script can be slow)
      console.log('Waiting for Google Apps Script to process...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Try to verify by reading back from Google Sheets
      console.log('Verifying record was added...');
      try {
        const verifyResult = await readFromGoogleSheets();
        console.log('Verification result:', {
          expensesCount: verifyResult.expenses?.length || 0,
          transactionsCount: verifyResult.transactions?.length || 0,
          lookingForId: requestBody.data.ID
        });
        
        const foundRecord = verifyResult.expenses?.find(e => e.ID == requestBody.data.ID) || 
                           verifyResult.transactions?.find(t => t.ID == requestBody.data.ID);
        
        if (foundRecord) {
          console.log('✅ Verification successful - record found in Google Sheets');
          return { success: true, message: 'Record added to Google Sheets and verified' };
        } else {
          console.error('❌ Verification failed - record not found in Google Sheets');
          console.error('Available IDs:', {
            expenses: verifyResult.expenses?.map(e => e.ID) || [],
            transactions: verifyResult.transactions?.map(t => t.ID) || []
          });
          return { 
            success: false, 
            error: 'Record sent but not found in Google Sheets after verification.\n\n' +
              'Please check:\n' +
              '1. Google Apps Script Executions log for errors\n' +
              '2. That you created a NEW VERSION and redeployed\n' +
              '3. The sheet name matches ("Expense" or "Income")\n' +
              '4. Your Google Sheet is accessible'
          };
        }
      } catch (verifyError) {
        console.error('Verification error:', verifyError);
        return { 
          success: false, 
          error: 'Record sent but verification failed: ' + verifyError.message + 
            '\n\nPlease check your Google Sheet manually to see if the record was added.' 
        };
      }
    }

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Response error text:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText || 'Failed to add record'}`);
    }
    
    const result = await response.json();
    console.log('Success response:', result);
    return { success: true, message: result.message || 'Record added to Google Sheets' };
  } catch (error) {
    console.error('Error adding record to Google Sheets:', error);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    
    // Check if it's a CORS or network error
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError') || error.name === 'TypeError') {
      return { 
        success: false, 
        error: 'Connection Error: The Google Apps Script Web App is not responding.\n\n' +
          'Please verify:\n' +
          '1. Script is deployed as Web App (Deploy → Manage deployments)\n' +
          '2. Access is set to "Anyone" (including anonymous)\n' +
          '3. You created a NEW VERSION and redeployed after updating the script\n' +
          '4. Test the URL in browser: ' + GOOGLE_SCRIPT_URL + '\n\n' +
          'If the URL shows an error, the script needs to be redeployed.'
      };
    }
    
    return { 
      success: false, 
      error: error.message || 'Failed to connect to Google Sheets. Please check your Google Apps Script deployment and make sure it\'s deployed as a Web App with "Anyone" access.' 
    };
  }
};

/**
 * Update a single record in Google Sheets
 */
export const updateRecordInGoogleSheets = async (record, type) => {
  if (!GOOGLE_SCRIPT_URL) {
    console.warn('Google Script URL not configured.');
    return { success: false, message: 'Google Script not configured' };
  }

  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update',
        sheetId: GOOGLE_SHEET_ID,
        type: type, // 'income' or 'expense'
        recordId: record.id,
        data: {
          ID: record.id,
          Date: record.date ? new Date(record.date).toISOString().split('T')[0] : '',
          Category: record.category || '',
          Subcategory: record.subcategory || '',
          Amount: record.amount || 0,
          Description: record.description || '',
          Currency: record.entryCurrency || 'EUR',
          'Created At': record.createdAt || new Date().toISOString()
        }
      })
    });

    if (!response.ok) throw new Error('Failed to update record');
    const result = await response.json();
    return { success: true, message: result.message || 'Record updated in Google Sheets' };
  } catch (error) {
    console.error('Error updating record in Google Sheets:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete a single record from Google Sheets
 */
export const deleteRecordFromGoogleSheets = async (recordId, type) => {
  if (!GOOGLE_SCRIPT_URL) {
    console.warn('Google Script URL not configured.');
    return { success: false, message: 'Google Script not configured' };
  }

  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'delete',
        sheetId: GOOGLE_SHEET_ID,
        type: type, // 'income' or 'expense'
        recordId: recordId
      })
    });

    if (!response.ok) throw new Error('Failed to delete record');
    const result = await response.json();
    return { success: true, message: result.message || 'Record deleted from Google Sheets' };
  } catch (error) {
    console.error('Error deleting record from Google Sheets:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Write all data to Google Sheets (for bulk operations)
 * Falls back to Excel export if Google Script not configured
 */
export const writeToGoogleSheets = async (transactions, expenses) => {
  if (!GOOGLE_SCRIPT_URL) {
    // Fallback to Excel export
    return exportToExcelFile(transactions, expenses);
  }

  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'syncAll',
        sheetId: GOOGLE_SHEET_ID,
        transactions: transactions
          .filter(t => t.type === 'income')
          .map(t => ({
            ID: t.id,
            Date: t.date ? new Date(t.date).toISOString().split('T')[0] : '',
            Category: t.category || '',
            Subcategory: t.subcategory || '',
            Amount: t.amount || 0,
            Description: t.description || '',
            Currency: t.entryCurrency || 'EUR',
            'Created At': t.createdAt || new Date().toISOString()
          })),
        expenses: expenses.map(e => ({
          ID: e.id,
          Date: e.date ? new Date(e.date).toISOString().split('T')[0] : '',
          Category: e.category || '',
          Subcategory: e.subcategory || '',
          Amount: e.amount || 0,
          Description: e.description || '',
          Currency: e.entryCurrency || 'EUR',
          'Created At': e.createdAt || new Date().toISOString()
        }))
      })
    });

    if (!response.ok) throw new Error('Failed to sync to Google Sheets');
    const result = await response.json();
    return { success: true, message: result.message || 'Data synced to Google Sheets!' };
  } catch (error) {
    console.error('Error syncing to Google Sheets:', error);
    // Fallback to Excel export
    return exportToExcelFile(transactions, expenses);
  }
};

/**
 * Clear all data from Google Sheets
 */
export const clearGoogleSheets = async () => {
  if (!GOOGLE_SCRIPT_URL) {
    return { success: false, error: 'Google Script not configured' };
  }

  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        action: 'clear',
        sheetId: GOOGLE_SHEET_ID
      }).toString()
    });

    // With no-cors, we can't read response, but request should succeed
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return { success: true, message: 'Google Sheets cleared successfully' };
  } catch (error) {
    console.error('Error clearing Google Sheets:', error);
    return { success: false, error: error.message || 'Failed to clear Google Sheets' };
  }
};

/**
 * Export to Excel file (download) - Simple fallback
 */
const exportToExcelFile = (transactions, expenses) => {
  try {
    const XLSX = require('xlsx');
    const wb = XLSX.utils.book_new();
  
  const incomeData = transactions
    .filter(t => t.type === 'income')
    .map(t => ({
      ID: t.id,
      Date: t.date ? new Date(t.date).toISOString().split('T')[0] : '',
      Category: t.category || '',
      Subcategory: t.subcategory || '',
      Amount: t.amount || 0,
      Description: t.description || '',
      'Created At': t.createdAt || new Date().toISOString()
    }));
  
  const expenseData = expenses.map(e => ({
    ID: e.id,
    Date: e.date ? new Date(e.date).toISOString().split('T')[0] : '',
    Category: e.category || '',
    Subcategory: e.subcategory || '',
    Amount: e.amount || 0,
    Description: e.description || '',
    'Created At': e.createdAt || new Date().toISOString()
  }));
  
    if (incomeData.length > 0) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(incomeData), 'Income');
    }
    if (expenseData.length > 0) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(expenseData), 'Expense');
    }
    
    const fileName = `budget_data_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    return { success: true, message: `Excel file downloaded: ${fileName}. Upload to Google Sheets manually.` };
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    return { success: false, error: 'Failed to export Excel file. ' + error.message };
  }
};
