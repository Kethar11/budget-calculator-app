import React, { useState, useEffect } from 'react';
import { db } from './utils/database';
import './App.css';
import BudgetCalculator from './components/BudgetCalculator';
import SavingsCalculator from './components/SavingsCalculator';
import ExpenseCalculator from './components/ExpenseCalculator';
import BuyingGoals from './components/BuyingGoals';
import FileBin from './components/FileBin';
import Navigation from './components/Navigation';

function App() {
  const [activeTab, setActiveTab] = useState('budget');
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
        // Load transactions
        const transactions = await db.transactions.toArray();
        const income = transactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + (t.amount || 0), 0);
        const expenses = transactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + (t.amount || 0), 0);
        const balance = income - expenses;

        // Load savings
        const savings = await db.savings.toArray();
        const totalSavings = savings.reduce((sum, s) => sum + (s.amount || 0), 0);

        // Load expenses
        const expenseRecords = await db.expenses.toArray();
        const totalExpenseAmount = expenseRecords.reduce((sum, e) => sum + (e.amount || 0), 0);

        setRealTimeStats({
          totalBalance: balance,
          totalIncome: income,
          totalExpenses: expenses,
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
        <div className="header-stats">
          <div className="stat-card">
            <div className="stat-icon">💵</div>
            <div className="stat-info">
              <div className="stat-label">Total Balance</div>
              <div className={`stat-value ${realTimeStats.totalBalance >= 0 ? 'positive' : 'negative'}`}>
                €{realTimeStats.totalBalance.toFixed(2)}
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📈</div>
            <div className="stat-info">
              <div className="stat-label">Total Income</div>
              <div className="stat-value positive">€{realTimeStats.totalIncome.toFixed(2)}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💸</div>
            <div className="stat-info">
              <div className="stat-label">Total Expenses</div>
              <div className="stat-value negative">€{realTimeStats.totalExpenses.toFixed(2)}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🏦</div>
            <div className="stat-info">
              <div className="stat-label">Total Savings</div>
              <div className="stat-value positive">€{realTimeStats.totalSavings.toFixed(2)}</div>
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

export default App;

