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
          const transaction = {
            ID: id || index,
            Date: date || '',
            Type: 'Income',
            Category: getCellValue(row, headers.indexOf('Category')) || '',
            Subcategory: getCellValue(row, headers.indexOf('Subcategory')) || '',
            Amount: parseFloat(amount || 0),
            Description: getCellValue(row, headers.indexOf('Description')) || '',
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
          const expense = {
            ID: id || index,
            Date: date || '',
            Category: getCellValue(row, headers.indexOf('Category')) || '',
            Subcategory: getCellValue(row, headers.indexOf('Subcategory')) || '',
            Amount: parseFloat(amount || 0),
            Description: getCellValue(row, headers.indexOf('Description')) || '',
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
 * Write to Google Sheets - Simple approach: Export to Excel for manual upload
 * For automatic write, you can set up Google Apps Script (optional)
 */
export const writeToGoogleSheets = async (transactions, expenses) => {
  try {
    // For now, export to Excel file - user can upload to Google Sheets
    // This is the simplest approach that works immediately
    return exportToExcelFile(transactions, expenses);
    
    // TODO: Optional - Set up Google Apps Script for automatic write
    // See GOOGLE_SHEETS_SETUP.md for instructions
  } catch (error) {
    console.error('Error writing to Google Sheets:', error);
    return exportToExcelFile(transactions, expenses);
  }
};

/**
 * Export to Excel file (download) - Simple fallback
 */
const exportToExcelFile = (transactions, expenses) => {
  // Dynamic import for XLSX to avoid build issues
  const XLSX = require('xlsx');
  if (!XLSX) {
    throw new Error('XLSX library not available');
  }
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
  
  XLSX.writeFile(wb, `budget_data_${new Date().toISOString().split('T')[0]}.xlsx`);
  return { success: true, message: 'Excel file downloaded! Upload to Google Sheets manually.' };
};
