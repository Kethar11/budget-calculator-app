import React, { useState, useEffect } from 'react';
import { db } from './utils/database';
import { readFromGoogleSheets } from './utils/googleSheetsDirect';
// Removed Electron storage - using IndexedDB only
import './App.css';
import BudgetCalculator from './components/BudgetCalculator';
import SavingsCalculator from './components/SavingsCalculator';
import ExpenseCalculator from './components/ExpenseCalculator';
import FileBin from './components/FileBin';
import Navigation from './components/Navigation';
import { CurrencyProvider, useCurrency } from './contexts/CurrencyContext';
import { TrendingUp, TrendingDown, PiggyBank, Wallet, Calculator, FileSpreadsheet, ExternalLink, LogOut } from 'lucide-react';
import ExcelSync from './components/ExcelSync';
import Login from './components/Login';

function AppContent({ onLogout }) {
  const [activeTab, setActiveTab] = useState('budget');
  const { formatAmount } = useCurrency();
  const [realTimeStats, setRealTimeStats] = useState({
    totalBalance: 0,
    totalIncome: 0,
    totalExpenses: 0,
    totalSavings: 0,
    totalExpenseAmount: 0
  });

  useEffect(() => {
    // Auto-fetch from Google Sheets on page load
    const fetchFromGoogleSheets = async () => {
      try {
        console.log('🔄 Auto-fetching from Google Sheets on page load...');
        const result = await readFromGoogleSheets();
        
        if (result.success && (result.transactions.length > 0 || result.expenses.length > 0)) {
          let importedCount = 0;
          
          // Import transactions
          for (const t of result.transactions) {
            try {
              const existing = await db.transactions.get(t.ID);
              if (!existing) {
                await db.transactions.add({
                  id: t.ID,
                  type: t.Type?.toLowerCase() || 'income',
                  category: t.Category || '',
                  subcategory: t.Subcategory || '',
                  amount: parseFloat(t.Amount) || 0,
                  description: t.Description || '',
                  date: t.Date || t['Created At'] || new Date().toISOString(),
                  createdAt: t['Created At'] || new Date().toISOString(),
                  files: [],
                  entryCurrency: 'EUR'
                });
                importedCount++;
              }
            } catch (err) {
              console.warn('Error importing transaction:', err);
            }
          }
          
          // Import expenses
          for (const e of result.expenses) {
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
                  files: [],
                  entryCurrency: 'EUR'
                });
                importedCount++;
              }
            } catch (err) {
              console.warn('Error importing expense:', err);
            }
          }
          
          if (importedCount > 0) {
            console.log(`✅ Auto-fetched ${importedCount} records from Google Sheets`);
            window.dispatchEvent(new Event('dataChanged'));
          }
        }
      } catch (error) {
        console.warn('Auto-fetch from Google Sheets failed:', error);
      }
    };
    
    // Initialize storage - fetch from Google Sheets
    const initStorage = async () => {
      // Auto-fetch from Google Sheets on app load
      await fetchFromGoogleSheets();
      
      // Also fetch when app becomes visible (user switches back to tab)
      const handleVisibilityChange = () => {
        if (!document.hidden) {
          fetchFromGoogleSheets();
        }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    };
    
    // Debounce function to prevent too many rapid calls
    let statsTimeout = null;
    const debouncedLoadStats = () => {
      if (statsTimeout) {
        clearTimeout(statsTimeout);
      }
      statsTimeout = setTimeout(() => {
        loadRealTimeStats();
      }, 300); // Wait 300ms after last call
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

        // Only log in development mode to reduce console spam
        if (process.env.NODE_ENV === 'development') {
          console.log('📊 Header Stats Calculation:', {
            transactionsExpenses: totalExpenses,
            expensesTable: totalExpenseAmount,
            combined: combinedTotalExpenses,
            expenseRecordsCount: expenseRecords.length
          });
        }

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
      // Load stats once after data is restored
      setTimeout(() => {
        loadRealTimeStats();
      }, 1000);
    });
    
    // Load stats once on mount (in case data is already loaded)
    loadRealTimeStats();
    
    // Update stats only when tab becomes visible (reduced CPU usage)
    const handleFocus = () => {
      debouncedLoadStats();
    };
    window.addEventListener('focus', handleFocus);
    
    // Listen for data changes to refresh stats (debounced)
    const handleDataChange = () => {
      debouncedLoadStats();
    };
    window.addEventListener('dataChanged', handleDataChange);
    
    return () => {
      if (statsTimeout) {
        clearTimeout(statsTimeout);
      }
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('dataChanged', handleDataChange);
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
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexShrink: 0, flexWrap: 'wrap' }}>
            <a
              href="https://docs.google.com/spreadsheets/d/1Dp4UGkT8h-PHnEXDPbGqnnDxsvhP6zO_UvxXH4xXLu0/edit"
              target="_blank"
              rel="noopener noreferrer"
              className="google-sheet-link"
              title="Open Google Sheet - Click to view your data"
              onClick={(e) => {
                e.preventDefault();
                window.open('https://docs.google.com/spreadsheets/d/1Dp4UGkT8h-PHnEXDPbGqnnDxsvhP6zO_UvxXH4xXLu0/edit', '_blank', 'noopener,noreferrer');
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <FileSpreadsheet size={28} className="google-sheet-icon" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '0.9rem', fontWeight: '600', whiteSpace: 'nowrap' }}>Google Sheet</span>
              <ExternalLink size={14} className="external-link-icon" style={{ flexShrink: 0 }} />
            </a>
            <div className="header-excel-sync">
              <ExcelSync onDataFetched={(tab) => setActiveTab(tab)} />
            </div>
            <button
              onClick={onLogout}
              className="logout-button"
              title="Logout"
            >
              <LogOut size={18} />
              Logout
            </button>
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
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('isAuthenticated') === 'true';
  });

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <CurrencyProvider>
      <AppContent onLogout={handleLogout} />
    </CurrencyProvider>
  );
}

export default App;

