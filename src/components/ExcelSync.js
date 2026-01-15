import React, { useState } from 'react';
import { Download, Upload, CheckCircle, AlertCircle, X, Trash2, Database } from 'lucide-react';
import { db } from '../utils/database';
import './ExcelSync.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

const ExcelSync = ({ onDataFetched }) => {
  const [syncing, setSyncing] = useState(false);
  const [status, setStatus] = useState(null);

  // Check if backend is running
  const checkBackend = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const response = await fetch(`${BACKEND_URL}/`, { 
        method: 'GET', 
        signal: controller.signal 
      });
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      return false;
    }
  };

  // Fetch data from Excel (backend)
  const fetchFromExcel = async () => {
    setSyncing(true);
    setStatus(null);
    
    // Check if backend is running first
    const backendRunning = await checkBackend();
    if (!backendRunning) {
      setStatus({ 
        type: 'error', 
        message: 'Backend server is not running! Please start it: cd backend && source venv/bin/activate && python main.py' 
      });
      setSyncing(false);
      return;
    }
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/excel/all-data`);
      if (!response.ok) {
        throw new Error('Failed to fetch from Excel');
      }
      
      const data = await response.json();
      
      // Import transactions (from Income and Expense sheets)
      if (data.transactions && Array.isArray(data.transactions)) {
        for (const t of data.transactions) {
          try {
            const existing = await db.transactions.get(t.ID);
            if (!existing) {
              await db.transactions.add({
                id: t.ID,
                type: (t.Type || 'expense').toLowerCase(),
                category: t.Category || '',
                subcategory: t.Subcategory || '',
                amount: parseFloat(t.Amount) || 0,
                description: t.Description || '',
                date: t.Date || t['Created At'] || new Date().toISOString(),
                createdAt: t['Created At'] || new Date().toISOString(),
                files: []
              });
            }
          } catch (error) {
            console.error('Error importing transaction:', error);
          }
        }
      }

      // Import expenses (from Expense sheet)
      if (data.expenses && Array.isArray(data.expenses)) {
        for (const e of data.expenses) {
          try {
            const existing = await db.expenses.get(e.ID);
            if (!existing) {
              await db.expenses.add({
                id: e.ID,
                category: e.Category || '',
                subcategory: e.Subcategory || '',
                amount: parseFloat(e.Amount) || 0,
                description: e.Description || '',
                date: e.Date || e['Created At'] || new Date().toISOString(),
                createdAt: e['Created At'] || new Date().toISOString(),
                files: []
              });
            }
          } catch (error) {
            console.error('Error importing expense:', error);
          }
        }
      }

      const transactionCount = data.transactions?.length || 0;
      const expenseCount = data.expenses?.length || 0;
      
      // Count income vs expense transactions
      const incomeCount = data.transactions?.filter(t => (t.Type || '').toLowerCase() === 'income').length || 0;
      const expenseTransactionCount = data.transactions?.filter(t => (t.Type || '').toLowerCase() === 'expense').length || 0;
      
      console.log('📥 Fetched data from Excel:', {
        transactions: transactionCount,
        expenses: expenseCount,
        income: incomeCount,
        expenseTransactions: expenseTransactionCount,
        sampleTransaction: data.transactions?.[0],
        sampleExpense: data.expenses?.[0]
      });
      
      if (transactionCount === 0 && expenseCount === 0) {
        setStatus({ 
          type: 'info', 
          message: '✅ Excel sheet is EMPTY. No data to fetch. Add data in the app and click "Update Excel" to save to Excel.' 
        });
      } else {
        let message = `✅ Data fetched! `;
        const parts = [];
        
        if (transactionCount > 0) {
          let transactionMsg = `${transactionCount} transaction(s)`;
          if (incomeCount > 0 || expenseTransactionCount > 0) {
            transactionMsg += ` (${incomeCount} income, ${expenseTransactionCount} expense)`;
          }
          transactionMsg += ` → View in Budget tab`;
          parts.push(transactionMsg);
        }
        
        if (expenseCount > 0) {
          parts.push(`${expenseCount} expense(s) → View in Expenses tab`);
        }
        
        message += parts.join('. ') + '. Check the tabs below!';
        
        setStatus({ 
          type: 'success', 
          message: message
        });
        
        // Auto-switch to Budget tab if transactions were imported
        if (transactionCount > 0 && onDataFetched) {
          setTimeout(() => {
            onDataFetched('budget');
          }, 500);
        } else if (expenseCount > 0 && onDataFetched) {
          setTimeout(() => {
            onDataFetched('expense');
          }, 500);
        }
      }
      window.dispatchEvent(new Event('dataChanged'));
      
      // Reload page data after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => setStatus(null), 5000);
    } catch (error) {
      console.error('Error fetching from Excel:', error);
      setStatus({ type: 'error', message: 'Failed to fetch from Excel. Make sure backend is running.' });
    } finally {
      setSyncing(false);
    }
  };

  // Update Excel with current data
  const updateExcel = async () => {
    setSyncing(true);
    setStatus(null);
    
    // Check if backend is running first
    const backendRunning = await checkBackend();
    if (!backendRunning) {
      setStatus({ 
        type: 'error', 
        message: 'Backend server is not running! Please start it: cd backend && source venv/bin/activate && python main.py' 
      });
      setSyncing(false);
      return;
    }
    
    try {
      // Get all data from IndexedDB - SIMPLIFIED: Only Income and Expense
      const transactions = await db.transactions.toArray();
      const expenses = await db.expenses.toArray();
      
      console.log(`📤 Sending to Excel: ${transactions.length} transactions, ${expenses.length} expenses`);
      console.log('Sample transaction:', transactions[0]);
      console.log('Sample expense:', expenses[0]);
      
      if (transactions.length === 0 && expenses.length === 0) {
        setStatus({ 
          type: 'error', 
          message: 'No data to save! Please add some income or expense transactions first in the Budget or Expenses tabs.' 
        });
        setSyncing(false);
        return;
      }
      
      // Prepare data for sending
      const transactionsData = transactions.map(t => ({
        ID: t.id,
        Date: t.date ? new Date(t.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        Time: t.date ? new Date(t.date).toTimeString().slice(0, 8) : new Date().toTimeString().slice(0, 8),
        Type: t.type ? t.type.charAt(0).toUpperCase() + t.type.slice(1) : 'Expense',
        Category: t.category || '',
        Subcategory: t.subcategory || '',
        Amount: t.amount || 0,
        Description: t.description || '',
        'Created At': t.createdAt || new Date().toISOString()
      }));
      
      const expensesData = expenses.map(e => ({
        ID: e.id,
        Date: e.date ? new Date(e.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        Time: e.date ? new Date(e.date).toTimeString().slice(0, 8) : new Date().toTimeString().slice(0, 8),
        Category: e.category || '',
        Subcategory: e.subcategory || '',
        Amount: e.amount || 0,
        Description: e.description || '',
        'Created At': e.createdAt || new Date().toISOString()
      }));
      
      console.log('📋 Prepared transactions:', transactionsData.length);
      console.log('📋 Prepared expenses:', expensesData.length);

      // Send to backend to update Excel - SIMPLIFIED structure
      const response = await fetch(`${BACKEND_URL}/api/excel/update-all`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactions: transactionsData,
          expenses: expensesData
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update Excel');
      }

      const result = await response.json();
      const recordCount = result.total_records || 0;
      const incomeCount = result.income_count || 0;
      const expenseCount = result.expense_count || 0;
      setStatus({ 
        type: 'success', 
        message: `Excel updated successfully! ${recordCount} records saved (${incomeCount} income, ${expenseCount} expenses)` 
      });
      window.dispatchEvent(new Event('dataChanged'));
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => setStatus(null), 3000);
    } catch (error) {
      console.error('Error updating Excel:', error);
      setStatus({ type: 'error', message: 'Failed to update Excel. Make sure backend is running.' });
    } finally {
      setSyncing(false);
    }
  };

  // Removed Google Sheets sync - simplified to only Excel

  // Clear all local data (IndexedDB)
  const clearLocalData = async () => {
    if (!window.confirm('⚠️ WARNING: This will delete ALL local data (IndexedDB)! This cannot be undone. Are you absolutely sure?')) {
      return;
    }
    
    if (!window.confirm('⚠️ This is your LAST WARNING! All local data will be permanently deleted. Continue?')) {
      return;
    }

    try {
      // Clear all IndexedDB tables
      await db.transactions.clear();
      await db.expenses.clear();
      await db.savings.clear();
      await db.files.clear();
      
      setStatus({ 
        type: 'success', 
        message: 'Local data cleared successfully! Page will reload...' 
      });
      
      window.dispatchEvent(new Event('dataChanged'));
      
      // Reload page after 2 seconds
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Error clearing local data:', error);
      setStatus({ type: 'error', message: 'Failed to clear local data.' });
    }
  };

  // Clear Excel sheet (with password)
  const clearExcelSheet = async () => {
    // Ask for password
    const password = window.prompt('⚠️ Enter password to clear Excel sheet:');
    if (password !== '780788') {
      setStatus({ 
        type: 'error', 
        message: 'Incorrect password. Excel sheet not cleared.' 
      });
      setTimeout(() => setStatus(null), 3000);
      return;
    }

    if (!window.confirm('⚠️ WARNING: This will delete ALL data from Excel sheet! This cannot be undone. Are you absolutely sure?')) {
      return;
    }

    setSyncing(true);
    setStatus(null);
    
    const backendRunning = await checkBackend();
    if (!backendRunning) {
      setStatus({ 
        type: 'error', 
        message: 'Backend server is not running! Please start it: cd backend && source venv/bin/activate && python main.py' 
      });
      setSyncing(false);
      return;
    }
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/excel/clear-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to clear Excel');
      }

      const result = await response.json();
      setStatus({ 
        type: 'success', 
        message: result.message || 'Excel sheet cleared successfully!' 
      });
      window.dispatchEvent(new Event('dataChanged'));
      
      setTimeout(() => setStatus(null), 5000);
    } catch (error) {
      console.error('Error clearing Excel:', error);
      setStatus({ type: 'error', message: 'Failed to clear Excel. Make sure backend is running.' });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="excel-sync-container-header">
      <button
        className="excel-sync-btn-header fetch-btn"
        onClick={fetchFromExcel}
        disabled={syncing}
        title="Fetch data from Excel sheet"
      >
        <Download size={18} />
        {syncing ? 'Fetching...' : 'Fetch from Excel'}
      </button>
      
      <button
        className="excel-sync-btn-header update-btn"
        onClick={updateExcel}
        disabled={syncing}
        title="Update Excel sheet with current data (also syncs to Google Sheets)"
      >
        <Upload size={18} />
        {syncing ? 'Updating...' : 'Update Excel'}
      </button>
      
      <button
        className="excel-sync-btn-header clear-local-btn"
        onClick={clearLocalData}
        disabled={syncing}
        title="Clear all local data (IndexedDB) - WARNING: This cannot be undone!"
        style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: 'white' }}
      >
        <Database size={18} />
        Clear Local
      </button>

      <button
        className="excel-sync-btn-header clear-excel-btn"
        onClick={clearExcelSheet}
        disabled={syncing}
        title="Clear Excel sheet (requires password) - WARNING: This cannot be undone!"
        style={{ background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)', color: 'white' }}
      >
        <Trash2 size={18} />
        Clear Excel
      </button>

      {status && (
        <div className={`excel-sync-status-header ${status.type}`}>
          {status.type === 'success' ? (
            <CheckCircle size={14} />
          ) : status.type === 'info' ? (
            <CheckCircle size={14} />
          ) : (
            <AlertCircle size={14} />
          )}
          <span style={{ fontSize: '0.85rem' }}>{status.message}</span>
          <button
            className="status-close-btn"
            onClick={() => setStatus(null)}
            title="Close"
          >
            <X size={12} />
          </button>
        </div>
      )}
    </div>
  );
};

export default ExcelSync;

