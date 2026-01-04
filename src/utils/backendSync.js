/**
 * Backend Sync Utility
 * Syncs IndexedDB data to backend Excel files for persistence
 * Even if browser data is cleared, data will be restored from backend
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

/**
 * Sync all data to backend
 */
export const syncAllToBackend = async (db) => {
  try {
    console.log('🔄 Syncing all data to backend...');
    
    // Sync transactions
    const transactions = await db.transactions.toArray();
    for (const transaction of transactions) {
      await syncTransactionToBackend(transaction);
    }
    
    // Sync expenses (as transactions with type='expense')
    const expenses = await db.expenses.toArray();
    for (const expense of expenses) {
      await syncExpenseToBackend(expense);
    }
    
    // Sync savings
    const savings = await db.savings.toArray();
    for (const saving of savings) {
      await syncSavingToBackend(saving);
    }
    
    console.log('✅ All data synced to backend');
  } catch (error) {
    console.error('❌ Error syncing to backend:', error);
  }
};

/**
 * Sync transaction to backend
 */
export const syncTransactionToBackend = async (transaction) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: transaction.type || 'expense',
        category: transaction.category || 'Other',
        amount: transaction.amount || 0,
        description: transaction.description || '',
        date: transaction.date || new Date().toISOString(),
        subcategory: transaction.subcategory || ''
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to sync transaction: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error syncing transaction:', error);
    // Don't throw - allow app to continue working offline
    return null;
  }
};

/**
 * Sync expense to backend (as transaction)
 */
export const syncExpenseToBackend = async (expense) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'expense',
        category: expense.category || 'Other',
        amount: expense.amount || 0,
        description: expense.description || '',
        date: expense.date || new Date().toISOString(),
        subcategory: expense.subcategory || ''
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to sync expense: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error syncing expense:', error);
    return null;
  }
};

/**
 * Sync saving to backend
 */
export const syncSavingToBackend = async (saving) => {
  try {
    // For now, savings can be stored as income transactions
    // You can extend backend API later if needed
    const response = await fetch(`${API_BASE_URL}/api/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'income',
        category: 'Savings & Investments',
        amount: saving.amount || 0,
        description: `Savings: ${saving.accountType || ''} - ${saving.description || ''}`,
        date: saving.date || new Date().toISOString(),
        subcategory: saving.accountType || ''
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to sync saving: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error syncing saving:', error);
    return null;
  }
};

/**
 * Load data from backend and restore to IndexedDB
 * This is called on app startup to restore data if IndexedDB is empty
 */
export const restoreFromBackend = async (db) => {
  try {
    console.log('📥 Restoring data from backend...');
    
    // Check if IndexedDB has data
    const transactionCount = await db.transactions.count();
    const expenseCount = await db.expenses.count();
    const savingsCount = await db.savings.count();
    
    // If IndexedDB already has data, don't restore (to avoid duplicates)
    if (transactionCount > 0 || expenseCount > 0 || savingsCount > 0) {
      console.log('✅ IndexedDB already has data, skipping restore');
      return;
    }
    
    // Load transactions from backend
    const response = await fetch(`${API_BASE_URL}/api/transactions`);
    if (response.ok) {
      const backendTransactions = await response.json();
      
      for (const bt of backendTransactions) {
        // Only restore if it's a transaction (not expense)
        if (bt.Type === 'income') {
          await db.transactions.add({
            type: 'income',
            category: bt.Category || 'Other',
            amount: parseFloat(bt.Amount || 0),
            description: bt.Description || '',
            date: bt.Date || new Date().toISOString(),
            createdAt: bt['Created At'] || new Date().toISOString(),
            subcategory: bt.Subcategory || ''
          });
        } else if (bt.Type === 'expense') {
          // Check if it's actually an expense (by description pattern)
          if (bt.Description && bt.Description.includes('Savings:')) {
            // This is a savings record
            const parts = bt.Description.split(' - ');
            const accountType = bt.Subcategory || parts[0]?.replace('Savings: ', '') || '';
            const description = parts[1] || '';
            
            await db.savings.add({
              accountType: accountType,
              amount: parseFloat(bt.Amount || 0),
              date: bt.Date || new Date().toISOString(),
              description: description,
              createdAt: bt['Created At'] || new Date().toISOString(),
              maturityDate: '',
              interestRate: 0,
              files: []
            });
          } else {
            // Regular expense
            await db.expenses.add({
              category: bt.Category || 'Other',
              subcategory: bt.Subcategory || '',
              amount: parseFloat(bt.Amount || 0),
              description: bt.Description || '',
              date: bt.Date || new Date().toISOString(),
              createdAt: bt['Created At'] || new Date().toISOString(),
              files: []
            });
          }
        }
      }
      
      console.log(`✅ Restored ${backendTransactions.length} records from backend`);
    }
  } catch (error) {
    console.error('❌ Error restoring from backend:', error);
    // Don't throw - allow app to work offline
  }
};

// Debounce syncs to avoid excessive API calls
let syncTimeout = null;
const SYNC_DELAY = 2000; // Wait 2 seconds before syncing (debounce)

/**
 * Auto-sync on data changes (debounced for performance)
 * Call this after any create/update/delete operation
 */
export const autoSync = async (db, type, data) => {
  try {
    // Clear existing timeout
    if (syncTimeout) {
      clearTimeout(syncTimeout);
    }
    
    // Debounce syncs - only sync after user stops making changes
    syncTimeout = setTimeout(async () => {
      if (type === 'transaction') {
        await syncTransactionToBackend(data);
      } else if (type === 'expense') {
        await syncExpenseToBackend(data);
      } else if (type === 'saving') {
        await syncSavingToBackend(data);
      }
      syncTimeout = null;
    }, SYNC_DELAY);
  } catch (error) {
    console.error('Error in auto-sync:', error);
  }
};

