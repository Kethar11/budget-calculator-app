import React, { useState } from 'react';
import './App.css';
import BudgetCalculator from './components/BudgetCalculator';
import SavingsCalculator from './components/SavingsCalculator';
import ExpenseCalculator from './components/ExpenseCalculator';
import Navigation from './components/Navigation';

function App() {
  const [activeTab, setActiveTab] = useState('budget');

  return (
    <div className="App">
      <header className="App-header">
        <div className="marquee-container">
          <div className="marquee-content">
            <span>💰 Complete Financial Calculator</span>
            <span>•</span>
            <span>📊 Budget Tracking</span>
            <span>•</span>
            <span>💵 Savings Management</span>
            <span>•</span>
            <span>💸 Expense Analytics</span>
            <span>•</span>
            <span>📁 File Attachments</span>
            <span>•</span>
            <span>📈 Beautiful Charts</span>
            <span>•</span>
            <span>📊 Excel Export</span>
            <span>•</span>
            <span>🔍 Advanced Filtering</span>
            <span>•</span>
            <span>💾 100% Local Storage</span>
            <span>•</span>
            <span>🔒 Secure & Private</span>
            <span>•</span>
            <span>💰 Complete Financial Calculator</span>
            <span>•</span>
            <span>📊 Budget Tracking</span>
            <span>•</span>
            <span>💵 Savings Management</span>
            <span>•</span>
            <span>💸 Expense Analytics</span>
            <span>•</span>
            <span>📁 File Attachments</span>
            <span>•</span>
            <span>📈 Beautiful Charts</span>
            <span>•</span>
            <span>📊 Excel Export</span>
            <span>•</span>
            <span>🔍 Advanced Filtering</span>
            <span>•</span>
            <span>💾 100% Local Storage</span>
            <span>•</span>
            <span>🔒 Secure & Private</span>
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

