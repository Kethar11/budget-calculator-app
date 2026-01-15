import React, { useState, useEffect } from 'react';
import { db } from './utils/database';
import { restoreFromBackend } from './utils/backendSync';
import { initElectronStorage, restoreFromElectronStorage, syncToElectronStorage } from './utils/electronStorage';
import './App.css';
import BudgetCalculator from './components/BudgetCalculator';
import SavingsCalculator from './components/SavingsCalculator';
import ExpenseCalculator from './components/ExpenseCalculator';
import BuyingGoals from './components/BuyingGoals';
import Reminders from './components/Reminders';
import FileBin from './components/FileBin';
import Navigation from './components/Navigation';
import CurrencySettings from './components/CurrencySettings';
import DataExport from './components/DataExport';
import { CurrencyProvider, useCurrency } from './contexts/CurrencyContext';
import { TrendingUp, TrendingDown, PiggyBank, Wallet, Calculator } from 'lucide-react';

function AppContent() {
  const [activeTab, setActiveTab] = useState('budget');
  const { formatAmount, updateSettings } = useCurrency();
  const [realTimeStats, setRealTimeStats] = useState({
    totalBalance: 0,
    totalIncome: 0,
    totalExpenses: 0,
    totalSavings: 0,
    totalExpenseAmount: 0
  });

  useEffect(() => {
    let syncInterval = null;
    let cleanupFn = null;
    let googleSheetsCleanup = null;
    
    // Initialize Electron storage and restore data
    const initStorage = async () => {
      const isElectron = await initElectronStorage();
      if (isElectron) {
        // In Electron: restore from local files first, then sync
        await restoreFromElectronStorage(db);
        // Auto-sync IndexedDB changes to files (reduced frequency for performance)
        // Only sync when app is active, every 60 seconds instead of 5
        const handleVisibilityChange = () => {
          if (document.hidden) {
            if (syncInterval) {
              clearInterval(syncInterval);
              syncInterval = null;
            }
          } else {
            if (!syncInterval) {
              syncInterval = setInterval(() => syncToElectronStorage(db), 60000); // Sync every 60 seconds
            }
          }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        syncInterval = setInterval(() => syncToElectronStorage(db), 60000);
        
        cleanupFn = () => {
          if (syncInterval) {
            clearInterval(syncInterval);
          }
          document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
      } else {
        // In browser: restore from backend
        await restoreFromBackend(db);
      }

      // Initialize Google Sheets sync (works on both web and mobile)
      try {
        const { autoSyncOnLoad, setupDailySync, syncOnDataChange } = await import('./utils/googleSheetsSync');
        
        // Auto-sync from Google Sheets on app load
        await autoSyncOnLoad(db);
        
        // Set up daily sync
        googleSheetsCleanup = setupDailySync(db);
        
        // Listen for data changes to sync to Google Sheets
        const handleDataChange = () => {
          syncOnDataChange();
        };
        window.addEventListener('dataChanged', handleDataChange);
        
        // Also sync on visibility change (when app becomes active)
        const handleVisibilityChange = () => {
          if (!document.hidden) {
            autoSyncOnLoad(db); // Fetch latest data when app becomes visible
          }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        if (googleSheetsCleanup) {
          const originalCleanup = googleSheetsCleanup;
          googleSheetsCleanup = () => {
            originalCleanup();
            window.removeEventListener('dataChanged', handleDataChange);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
          };
        }
      } catch (error) {
        console.warn('Google Sheets sync not available:', error);
      }
    };
    
    const loadRealTimeStats = async () => {
      try {
        // Load transactions (all-time)
        const transactions = await db.transactions.toArray();
        
        // Calculate all-time totals
        const totalIncome = transactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
        
        const totalExpenses = transactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
        
        // Load savings (all-time)
        const savings = await db.savings.toArray();
        const totalSavings = savings.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);

        // Load expenses (all-time) from expenses table - THIS IS THE KEY!
        const expenseRecords = await db.expenses.toArray();
        const totalExpenseAmount = expenseRecords.reduce((sum, e) => {
          const amount = parseFloat(e.amount) || 0;
          return sum + amount;
        }, 0);

        // Combine expenses from both transactions and expenses table
        const combinedTotalExpenses = totalExpenses + totalExpenseAmount;

        console.log('📊 Header Stats Calculation:', {
          transactionsExpenses: totalExpenses,
          expensesTable: totalExpenseAmount,
          combined: combinedTotalExpenses,
          expenseRecordsCount: expenseRecords.length,
          expenseRecords: expenseRecords.map(e => ({ id: e.id, amount: e.amount, category: e.category }))
        });

        setRealTimeStats({
          totalBalance: totalIncome - combinedTotalExpenses,
          totalIncome: totalIncome,
          totalExpenses: combinedTotalExpenses, // Combined: transactions + expenses table
          totalSavings: totalSavings,
          totalExpenseAmount: totalExpenseAmount
        });
      } catch (error) {
        console.error('Error loading real-time stats:', error);
      }
    };

    // Initialize storage first
    initStorage().then(() => {
      // Load stats after data is restored (with multiple attempts to ensure data is loaded)
      setTimeout(() => {
        loadRealTimeStats();
      }, 500);
      setTimeout(() => {
        loadRealTimeStats();
      }, 1500);
      setTimeout(() => {
        loadRealTimeStats();
      }, 3000);
    });
    
    // Also load stats immediately (in case data is already loaded)
    loadRealTimeStats();
    
    // Update stats only when tab becomes visible (reduced CPU usage)
    // Remove frequent polling - stats update only on data changes or tab focus
    const handleFocus = () => {
      loadRealTimeStats();
    };
    window.addEventListener('focus', handleFocus);
    
    // Listen for data changes to refresh stats
    const handleDataChange = () => {
      loadRealTimeStats();
    };
    window.addEventListener('dataChanged', handleDataChange);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('dataChanged', handleDataChange);
      if (cleanupFn) cleanupFn();
      if (googleSheetsCleanup) googleSheetsCleanup();
    };
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-top">
          <div className="header-title">
            <h1>
              <Calculator size={28} style={{ marginRight: '12px', verticalAlign: 'middle' }} />
              Budget Calculator
            </h1>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <DataExport />
            <CurrencySettings onCurrencyChange={updateSettings} />
          </div>
        </div>
        <div className="header-stats">
          <div className="stat-card">
            <div className="stat-icon">
              <TrendingUp size={32} color="#6366f1" />
            </div>
            <div className="stat-info">
              <div className="stat-label">Total Earnings</div>
              <div className="stat-value positive">{formatAmount(realTimeStats.totalIncome)}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <TrendingDown size={32} color="#6366f1" />
            </div>
            <div className="stat-info">
              <div className="stat-label">Total Expense</div>
              <div className="stat-value negative">{formatAmount(realTimeStats.totalExpenses)}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <PiggyBank size={32} color="#6366f1" />
            </div>
            <div className="stat-info">
              <div className="stat-label">Total Savings</div>
              <div className="stat-value positive">{formatAmount(realTimeStats.totalSavings)}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <Wallet size={32} color="#6366f1" />
            </div>
            <div className="stat-info">
              <div className="stat-label">Net Balance</div>
              <div className={`stat-value ${realTimeStats.totalBalance >= 0 ? 'positive' : 'negative'}`}>
                {formatAmount(realTimeStats.totalBalance)}
              </div>
            </div>
          </div>
        </div>
      </header>
      <div className="main-container">
        <div className="left-panel">
          <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>
        <div className="right-panel">
          {activeTab === 'budget' && <BudgetCalculator />}
          {activeTab === 'savings' && <SavingsCalculator />}
          {activeTab === 'expense' && <ExpenseCalculator />}
          {activeTab === 'goals' && <BuyingGoals />}
          {activeTab === 'reminders' && <Reminders />}
          {activeTab === 'bin' && <FileBin />}
        </div>
      </div>
      <footer className="App-footer">
        <p>&copy; 2024 Budget Calculator. All rights reserved.</p>
        <p>Your financial data is stored locally and securely on your device.</p>
      </footer>
    </div>
  );
}

function App() {
  return (
    <CurrencyProvider>
      <AppContent />
    </CurrencyProvider>
  );
}

export default App;

