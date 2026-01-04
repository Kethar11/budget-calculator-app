/**
 * Electron File Storage
 * Stores all data in local files on the computer (not browser storage)
 * Data persists even if browser data is cleared
 * Location: ~/Library/Application Support/Budget Calculator/budget-calculator-data/
 */

let electronAPI = null;

// Check if running in Electron
if (window.electronAPI) {
  electronAPI = window.electronAPI;
}

/**
 * Get the app data directory path
 */
export const getAppDataPath = async () => {
  if (!electronAPI) {
    return null;
  }
  
  try {
    const path = await electronAPI.getAppPath();
    return path;
  } catch (error) {
    console.error('Error getting app path:', error);
    return null;
  }
};

/**
 * Save data to local file (Mac filesystem)
 */
export const saveToFile = async (filename, data) => {
  if (!electronAPI) {
    // Not in Electron, use localStorage as fallback
    try {
      localStorage.setItem(`electron_storage_${filename}`, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      return false;
    }
  }
  
  try {
    const result = await electronAPI.saveFile(filename, JSON.stringify(data, null, 2));
    if (result.success) {
      console.log(`✅ Saved ${filename} to: ${result.path}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error saving file:', error);
    return false;
  }
};

/**
 * Load data from local file (Mac filesystem)
 */
export const loadFromFile = async (filename) => {
  if (!electronAPI) {
    // Not in Electron, use localStorage as fallback
    try {
      const data = localStorage.getItem(`electron_storage_${filename}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      return null;
    }
  }
  
  try {
    const data = await electronAPI.loadFile(filename);
    if (data) {
      return JSON.parse(data);
    }
    return null;
  } catch (error) {
    console.error('Error loading file:', error);
    return null;
  }
};

/**
 * Check if running in Electron
 */
export const isElectron = () => {
  return !!electronAPI;
};

/**
 * Initialize Electron storage
 */
export const initElectronStorage = async () => {
  if (isElectron()) {
    const path = await getAppDataPath();
    console.log('✅ Running in Electron - using local file storage');
    console.log('📁 Data location:', path);
    return true;
  } else {
    console.log('⚠️ Not in Electron - using IndexedDB fallback');
    return false;
  }
};

// Cache to avoid unnecessary syncs
let lastSyncTime = 0;
const SYNC_COOLDOWN = 30000; // Only sync if 30 seconds have passed

/**
 * Sync all IndexedDB data to Electron file storage (optimized)
 */
export const syncToElectronStorage = async (db) => {
  if (!isElectron()) {
    return; // Only sync if in Electron
  }
  
  // Throttle syncs to avoid excessive CPU usage
  const now = Date.now();
  if (now - lastSyncTime < SYNC_COOLDOWN) {
    return; // Skip if synced recently
  }
  lastSyncTime = now;
  
  try {
    // Use Promise.all for parallel operations (faster)
    const [transactions, expenses, savings, goals, reminders, budgets, settings] = await Promise.all([
      db.transactions.toArray(),
      db.expenses.toArray(),
      db.savings.toArray(),
      db.goals.toArray(),
      db.reminders.toArray(),
      db.budgets.toArray(),
      db.settings.toArray()
    ]);
    
    // Save all files in parallel
    await Promise.all([
      saveToFile('transactions.json', transactions),
      saveToFile('expenses.json', expenses),
      saveToFile('savings.json', savings),
      saveToFile('goals.json', goals),
      saveToFile('reminders.json', reminders),
      saveToFile('budgets.json', budgets),
      saveToFile('settings.json', settings)
    ]);
    
  } catch (error) {
    console.error('❌ Error syncing to Electron storage:', error);
  }
};

/**
 * Restore data from Electron file storage to IndexedDB
 */
export const restoreFromElectronStorage = async (db) => {
  if (!isElectron()) {
    return; // Only restore if in Electron
  }
  
  try {
    console.log('📥 Restoring data from Electron file storage...');
    
    // Check if IndexedDB already has data
    const transactionCount = await db.transactions.count();
    if (transactionCount > 0) {
      console.log('✅ IndexedDB already has data, skipping restore');
      return;
    }
    
    // Restore transactions
    const transactions = await loadFromFile('transactions.json');
    if (transactions && transactions.length > 0) {
      await db.transactions.bulkAdd(transactions);
      console.log(`✅ Restored ${transactions.length} transactions`);
    }
    
    // Restore expenses
    const expenses = await loadFromFile('expenses.json');
    if (expenses && expenses.length > 0) {
      await db.expenses.bulkAdd(expenses);
      console.log(`✅ Restored ${expenses.length} expenses`);
    }
    
    // Restore savings
    const savings = await loadFromFile('savings.json');
    if (savings && savings.length > 0) {
      await db.savings.bulkAdd(savings);
      console.log(`✅ Restored ${savings.length} savings`);
    }
    
    // Restore goals
    const goals = await loadFromFile('goals.json');
    if (goals && goals.length > 0) {
      await db.goals.bulkAdd(goals);
      console.log(`✅ Restored ${goals.length} goals`);
    }
    
    // Restore reminders
    const reminders = await loadFromFile('reminders.json');
    if (reminders && reminders.length > 0) {
      await db.reminders.bulkAdd(reminders);
      console.log(`✅ Restored ${reminders.length} reminders`);
    }
    
    // Restore budgets
    const budgets = await loadFromFile('budgets.json');
    if (budgets && budgets.length > 0) {
      await db.budgets.bulkAdd(budgets);
      console.log(`✅ Restored ${budgets.length} budgets`);
    }
    
    // Restore settings
    const settings = await loadFromFile('settings.json');
    if (settings && settings.length > 0) {
      await db.settings.bulkAdd(settings);
      console.log(`✅ Restored ${settings.length} settings`);
    }
    
    console.log('✅ Data restoration complete');
  } catch (error) {
    console.error('❌ Error restoring from Electron storage:', error);
  }
};

