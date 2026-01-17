import React, { useState } from 'react';
import { Download, Upload, CheckCircle, AlertCircle, X, Trash2 } from 'lucide-react';
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
      
      // No longer storing in IndexedDB - data is fetched directly from Google Sheets when needed
      // Just trigger a page reload to fetch fresh data

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
      // Reload page to fetch fresh data from Google Sheets
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      
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

  // Update Excel - Refresh page to sync with Google Sheets
  const updateExcel = async () => {
    setSyncing(true);
    setStatus({ 
      type: 'info', 
      message: 'Refreshing data from Google Sheets...' 
    });
    
    // Simply refresh the page to get latest data from Google Sheets
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  // Clear Excel sheet (automatic - clears Google Sheets and refreshes page)
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
        message: '✅ Google Sheets cleared successfully! Refreshing page to get latest data...' 
      });
      
      // Refresh page to get latest data from Google Sheets (which should be empty now)
      setTimeout(() => {
        window.location.reload();
      }, 2000);
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

