/**
 * Google Sheets Sync Utility
 * Handles bidirectional sync between local IndexedDB and Google Sheets
 * 
 * Google Sheet ID: 1Dp4UGkT8h-PHnEXDPbGqnnDxsvhP6zO_UvxXH4xXLu0
 * Sheet URL: https://docs.google.com/spreadsheets/d/1Dp4UGkT8h-PHnEXDPbGqnnDxsvhP6zO_UvxXH4xXLu0/edit?usp=sharing
 */

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
const GOOGLE_SHEET_ID = '1Dp4UGkT8h-PHnEXDPbGqnnDxsvhP6zO_UvxXH4xXLu0';

/**
 * Sync all data from Google Sheets to local IndexedDB
 */
export const syncFromGoogleSheets = async (db) => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/google-sheets/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to import from Google Sheets');
    }

    const result = await response.json();
    
    if (result.status === 'error') {
      console.warn('Google Sheets sync error:', result.message);
      return { success: false, message: result.message };
    }

    if (result.status === 'success' && result.data) {
      // Import transactions
      if (result.data.transactions && Array.isArray(result.data.transactions)) {
        for (const transaction of result.data.transactions) {
          try {
            // Check if transaction already exists
            const existing = await db.transactions.get(transaction.ID);
            if (!existing) {
              await db.transactions.add({
                id: transaction.ID,
                type: transaction.Type?.toLowerCase() || 'expense',
                category: transaction.Category || '',
                amount: parseFloat(transaction.Amount) || 0,
                description: transaction.Description || '',
                date: transaction.Date || transaction['Created At'] || new Date().toISOString(),
                createdAt: transaction['Created At'] || new Date().toISOString(),
                files: []
              });
            }
          } catch (error) {
            console.error('Error importing transaction:', error);
          }
        }
      }

      // Import expenses
      if (result.data.expenses && Array.isArray(result.data.expenses)) {
        for (const expense of result.data.expenses) {
          try {
            const existing = await db.expenses.get(expense.ID);
            if (!existing) {
              await db.expenses.add({
                id: expense.ID,
                category: expense.Category || '',
                subcategory: expense.Subcategory || '',
                amount: parseFloat(expense.Amount) || 0,
                description: expense.Description || '',
                date: expense.Date || expense['Created At'] || new Date().toISOString(),
                createdAt: expense['Created At'] || new Date().toISOString(),
                files: []
              });
            }
          } catch (error) {
            console.error('Error importing expense:', error);
          }
        }
      }

      // Import savings
      if (result.data.savings && Array.isArray(result.data.savings)) {
        for (const saving of result.data.savings) {
          try {
            const existing = await db.savings.get(saving.ID);
            if (!existing) {
              await db.savings.add({
                id: saving.ID,
                accountType: saving['Account Type'] || saving.accountType || '',
                amount: parseFloat(saving.Amount) || 0,
                date: saving.Date || saving['Deposit Date'] || new Date().toISOString(),
                maturityDate: saving['Maturity Date'] || saving.maturityDate || '',
                interestRate: parseFloat(saving['Interest Rate'] || saving.interestRate || 0),
                description: saving.Description || '',
                createdAt: saving['Created At'] || new Date().toISOString(),
                files: []
              });
            }
          } catch (error) {
            console.error('Error importing saving:', error);
          }
        }
      }

      return { success: true, message: 'Data synced from Google Sheets' };
    }

    return { success: false, message: 'No data to import' };
  } catch (error) {
    console.error('Error syncing from Google Sheets:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Sync all local data to Google Sheets
 */
export const syncToGoogleSheets = async () => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/google-sheets/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to sync to Google Sheets');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error syncing to Google Sheets:', error);
    return { status: 'error', message: error.message };
  }
};

/**
 * Auto-sync on app load - fetch latest data from Google Sheets
 */
export const autoSyncOnLoad = async (db) => {
  try {
    console.log('🔄 Starting auto-sync from Google Sheets...');
    const result = await syncFromGoogleSheets(db);
    
    if (result.success) {
      console.log('✅ Auto-sync completed:', result.message);
      // Trigger data change event to refresh UI
      window.dispatchEvent(new Event('dataChanged'));
      return true;
    } else {
      console.warn('⚠️ Auto-sync warning:', result.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Auto-sync error:', error);
    return false;
  }
};

/**
 * Set up daily sync - syncs once per day
 */
export const setupDailySync = (db) => {
  const LAST_SYNC_KEY = 'lastGoogleSheetsSync';
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;

  const shouldSync = () => {
    const lastSync = localStorage.getItem(LAST_SYNC_KEY);
    if (!lastSync) return true;
    
    const lastSyncTime = parseInt(lastSync, 10);
    const now = Date.now();
    return (now - lastSyncTime) >= ONE_DAY_MS;
  };

  const performDailySync = async () => {
    if (shouldSync()) {
      console.log('📅 Performing daily sync...');
      const result = await syncFromGoogleSheets(db);
      if (result.success) {
        localStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
        window.dispatchEvent(new Event('dataChanged'));
      }
    }
  };

  // Sync immediately if needed
  performDailySync();

  // Set up interval to check daily (check every hour)
  const intervalId = setInterval(performDailySync, 60 * 60 * 1000);

  return () => clearInterval(intervalId);
};

/**
 * Sync when data changes - push to Google Sheets
 */
export const syncOnDataChange = async () => {
  try {
    // Small delay to batch multiple changes
    if (window.syncTimeout) {
      clearTimeout(window.syncTimeout);
    }

    window.syncTimeout = setTimeout(async () => {
      console.log('📤 Syncing changes to Google Sheets...');
      const result = await syncToGoogleSheets();
      if (result.status === 'success') {
        console.log('✅ Changes synced to Google Sheets');
      } else {
        console.warn('⚠️ Sync warning:', result.message);
      }
    }, 2000); // Wait 2 seconds before syncing to batch changes
  } catch (error) {
    console.error('Error in sync on data change:', error);
  }
};

