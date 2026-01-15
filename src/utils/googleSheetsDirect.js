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
    // Read Income sheet (public access)
    const incomeUrl = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/gviz/tq?tqx=out:json&sheet=Income`;
    const incomeResponse = await fetch(incomeUrl);
    
    if (!incomeResponse.ok) {
      throw new Error('Failed to read Income sheet');
    }
    
    const incomeText = await incomeResponse.text();
    const incomeJson = JSON.parse(incomeText.substring(47).slice(0, -2));
    
    // Read Expense sheet (public access)
    const expenseUrl = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/gviz/tq?tqx=out:json&sheet=Expense`;
    const expenseResponse = await fetch(expenseUrl);
    
    if (!expenseResponse.ok) {
      throw new Error('Failed to read Expense sheet');
    }
    
    const expenseText = await expenseResponse.text();
    const expenseJson = JSON.parse(expenseText.substring(47).slice(0, -2));
    
    // Convert to app format
    const transactions = [];
    const expenses = [];
    
    // Process Income sheet
    if (incomeJson.table && incomeJson.table.rows) {
      const headers = incomeJson.table.cols.map(col => col.label);
      incomeJson.table.rows.forEach((row, index) => {
        if (index === 0) return; // Skip header
        if (row.c && row.c[0] && row.c[0].v) {
          const transaction = {
            ID: row.c[headers.indexOf('ID')]?.v || index,
            Date: row.c[headers.indexOf('Date')]?.v || '',
            Type: 'Income',
            Category: row.c[headers.indexOf('Category')]?.v || '',
            Subcategory: row.c[headers.indexOf('Subcategory')]?.v || '',
            Amount: parseFloat(row.c[headers.indexOf('Amount')]?.v || 0),
            Description: row.c[headers.indexOf('Description')]?.v || '',
            'Created At': row.c[headers.indexOf('Created At')]?.v || new Date().toISOString()
          };
          transactions.push(transaction);
        }
      });
    }
    
    // Process Expense sheet
    if (expenseJson.table && expenseJson.table.rows) {
      const headers = expenseJson.table.cols.map(col => col.label);
      expenseJson.table.rows.forEach((row, index) => {
        if (index === 0) return; // Skip header
        if (row.c && row.c[0] && row.c[0].v) {
          const expense = {
            ID: row.c[headers.indexOf('ID')]?.v || index,
            Date: row.c[headers.indexOf('Date')]?.v || '',
            Category: row.c[headers.indexOf('Category')]?.v || '',
            Subcategory: row.c[headers.indexOf('Subcategory')]?.v || '',
            Amount: parseFloat(row.c[headers.indexOf('Amount')]?.v || 0),
            Description: row.c[headers.indexOf('Description')]?.v || '',
            'Created At': row.c[headers.indexOf('Created At')]?.v || new Date().toISOString()
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
 * Write to Google Sheets using Google Apps Script Web App
 * This is the simplest way - no OAuth needed!
 */
export const writeToGoogleSheets = async (transactions, expenses) => {
  try {
    // Use Google Apps Script Web App URL
    // You'll need to create this (see GOOGLE_SHEETS_SETUP.md)
    const SCRIPT_URL = process.env.REACT_APP_GOOGLE_SCRIPT_URL || '';
    
    if (!SCRIPT_URL) {
      // Fallback: Export to Excel file for manual upload
      return exportToExcelFile(transactions, expenses);
    }
    
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sheetId: GOOGLE_SHEET_ID,
        transactions: transactions.filter(t => t.type === 'income'),
        expenses
      }),
    });
    
    if (!response.ok) throw new Error('Failed to write to Google Sheets');
    
    const result = await response.json();
    return { success: true, message: result.message || 'Data saved to Google Sheets!' };
  } catch (error) {
    console.error('Error writing to Google Sheets:', error);
    // Fallback to Excel export
    return exportToExcelFile(transactions, expenses);
  }
};

/**
 * Export to Excel file (download) - Simple fallback
 */
const exportToExcelFile = (transactions, expenses) => {
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
  
  XLSX.writeFile(wb, `budget_data_${new Date().toISOString().split('T')[0]}.xlsx`);
  return { success: true, message: 'Excel file downloaded! Upload to Google Sheets manually.' };
};
