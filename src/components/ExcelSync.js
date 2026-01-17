import React, { useState } from 'react';
import { Download, Upload, CheckCircle, AlertCircle, X, Trash2, Database } from 'lucide-react';
import { db } from '../utils/database';
import { readFromGoogleSheets, writeToGoogleSheets, clearGoogleSheets } from '../utils/googleSheetsDirect';
import './ExcelSync.css';

const ExcelSync = ({ onDataFetched }) => {
  const [syncing, setSyncing] = useState(false);
  const [status, setStatus] = useState(null);

  // No need to check backend - we use Google Sheets API directly!

  // Fetch data from Google Sheets (direct API - no backend!)
  const fetchFromExcel = async () => {
    setSyncing(true);
    setStatus(null);
    
    try {
      const data = await readFromGoogleSheets();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch from Google Sheets');
      }
      
      // Import transactions from Google Sheets
      if (data.transactions && Array.isArray(data.transactions)) {
        let imported = 0;
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
                entryCurrency: t.Currency || 'EUR',
                files: []
              });
              imported++;
            }
          } catch (error) {
            console.error('Error importing transaction:', error);
          }
        }
        console.log(`✅ Imported ${imported} transactions from Google Sheets`);
      }

      // Import expenses from Google Sheets
      if (data.expenses && Array.isArray(data.expenses)) {
        let imported = 0;
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
                entryCurrency: e.Currency || 'EUR',
                files: []
              });
              imported++;
            }
          } catch (error) {
            console.error('Error importing expense:', error);
          }
        }
        console.log(`✅ Imported ${imported} expenses from Google Sheets`);
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
          message: '✅ Google Sheet is EMPTY. No data to fetch. Add data in the app and click "Update Excel" to save to Google Sheets.' 
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
      console.error('Error fetching from Google Sheets:', error);
      setStatus({ 
        type: 'error', 
        message: `Failed to fetch from Google Sheets: ${error.message}. Make sure your Google Sheet is public or check the sheet ID.` 
      });
    } finally {
      setSyncing(false);
    }
  };

  // Update Google Sheets with current data (direct API - no backend!)
  const updateExcel = async () => {
    setSyncing(true);
    setStatus(null);
    
    try {
      // Get all data from IndexedDB
      const transactions = await db.transactions.toArray();
      const expenses = await db.expenses.toArray();
      
      if (transactions.length === 0 && expenses.length === 0) {
        setStatus({ 
          type: 'error', 
          message: 'No data to save! Please add some income or expense transactions first.' 
        });
        setSyncing(false);
        return;
      }
      
      // Write to Google Sheets directly (no backend!)
      const result = await writeToGoogleSheets(transactions, expenses);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to update Google Sheets');
      }
      
      const incomeCount = transactions.filter(t => t.type === 'income').length;
      const expenseCount = expenses.length;
      const totalRecords = incomeCount + expenseCount;
      
      // Check if it's Excel export or direct write
      if (result.message && result.message.includes('downloaded')) {
        setStatus({ 
          type: 'success', 
          message: `✅ ${result.message} Upload this file to your Google Sheet manually.` 
        });
      } else {
        setStatus({ 
          type: 'success', 
          message: `✅ Data saved to Google Sheets! ${totalRecords} records (${incomeCount} income, ${expenseCount} expenses)` 
        });
      }
      window.dispatchEvent(new Event('dataChanged'));
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => setStatus(null), 3000);
    } catch (error) {
      console.error('Error updating Google Sheets:', error);
      setStatus({ 
        type: 'error', 
        message: error.message || 'Failed to update Google Sheets. Excel file will be downloaded instead - you can upload it manually.' 
      });
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

  // Clear Excel sheet (automatic - only clears Google Sheets, NOT local data)
  const clearExcelSheet = async () => {
    setSyncing(true);
    setStatus({ 
      type: 'info', 
      message: 'Clearing Google Sheets only...' 
    });

    try {
      // Clear Google Sheets ONLY (not local data)
      const clearResult = await clearGoogleSheets();
      
      if (!clearResult.success) {
        throw new Error(clearResult.error || 'Failed to clear Google Sheets');
      }

      setStatus({ 
        type: 'success', 
        message: '✅ Google Sheets cleared successfully! Refresh the sheet to see changes.' 
      });
      
      // Don't reload page - user can continue working
      setTimeout(() => setStatus(null), 5000);
    } catch (error) {
      console.error('Error clearing Google Sheets:', error);
      setStatus({ 
        type: 'error', 
        message: 'Failed to clear Google Sheets: ' + error.message 
      });
      setTimeout(() => setStatus(null), 5000);
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
        title="Update Google Sheets with current data (downloads Excel file for manual upload)"
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

