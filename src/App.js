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
        <h1>💰 Complete Financial Calculator</h1>
        <p>Budget • Savings • Expenses with Beautiful Analytics</p>
      </header>
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="container">
        {activeTab === 'budget' && <BudgetCalculator />}
        {activeTab === 'savings' && <SavingsCalculator />}
        {activeTab === 'expense' && <ExpenseCalculator />}
      </div>
    </div>
  );
}

export default App;

