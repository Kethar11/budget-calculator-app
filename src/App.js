import React, { useState } from 'react';
import { Calculator } from 'lucide-react';
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
        <div className="header-content">
          <Calculator size={40} className="header-icon" />
          <h1>Complete Financial Calculator</h1>
        </div>
        <p>Budget • Savings • Expenses</p>
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

