import React from 'react';
import './Navigation.css';

const Navigation = ({ activeTab, setActiveTab }) => {
  return (
    <nav className="navigation">
      <button
        className={`nav-btn ${activeTab === 'budget' ? 'active' : ''}`}
        onClick={() => setActiveTab('budget')}
      >
        📊 Budget
      </button>
      <button
        className={`nav-btn ${activeTab === 'savings' ? 'active' : ''}`}
        onClick={() => setActiveTab('savings')}
      >
        💰 Savings
      </button>
      <button
        className={`nav-btn ${activeTab === 'expense' ? 'active' : ''}`}
        onClick={() => setActiveTab('expense')}
      >
        💸 Expenses
      </button>
    </nav>
  );
};

export default Navigation;

