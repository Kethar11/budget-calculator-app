import React, { useState, useEffect } from 'react';
import { db } from './utils/database';
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
    const loadRealTimeStats = async () => {
      try {
        // Load transactions (all-time)
        const transactions = await db.transactions.toArray();
        
        // Calculate all-time totals
        const totalIncome = transactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + (t.amount || 0), 0);
        
        const totalExpenses = transactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + (t.amount || 0), 0);
        
        // Load savings (all-time)
        const savings = await db.savings.toArray();
        const totalSavings = savings.reduce((sum, s) => sum + (s.amount || 0), 0);

        // Load expenses (all-time)
        const expenseRecords = await db.expenses.toArray();
        const totalExpenseAmount = expenseRecords.reduce((sum, e) => sum + (e.amount || 0), 0);

        setRealTimeStats({
          totalBalance: totalIncome - totalExpenses,
          totalIncome: totalIncome,
          totalExpenses: totalExpenses,
          totalSavings: totalSavings,
          totalExpenseAmount: totalExpenseAmount
        });
      } catch (error) {
        console.error('Error loading real-time stats:', error);
      }
    };

    loadRealTimeStats();
    
    // Update stats every 5 seconds
    const interval = setInterval(loadRealTimeStats, 5000);
    
    return () => clearInterval(interval);
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
              <TrendingUp size={32} color="white" />
            </div>
            <div className="stat-info">
              <div className="stat-label">Total Earnings</div>
              <div className="stat-value positive">{formatAmount(realTimeStats.totalIncome)}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <TrendingDown size={32} color="white" />
            </div>
            <div className="stat-info">
              <div className="stat-label">Total Expense</div>
              <div className="stat-value negative">{formatAmount(realTimeStats.totalExpenses)}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <PiggyBank size={32} color="white" />
            </div>
            <div className="stat-info">
              <div className="stat-label">Total Savings</div>
              <div className="stat-value positive">{formatAmount(realTimeStats.totalSavings)}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <Wallet size={32} color="white" />
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

