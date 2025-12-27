import React from 'react';
import { Wallet, PiggyBank, Receipt } from 'lucide-react';
import './Navigation.css';

const Navigation = ({ activeTab, setActiveTab }) => {
  return (
    <nav className="navigation">
      <button
        className={`nav-btn ${activeTab === 'budget' ? 'active' : ''}`}
        onClick={() => setActiveTab('budget')}
      >
        <Wallet size={18} />
        <span>Budget</span>
      </button>
      <button
        className={`nav-btn ${activeTab === 'savings' ? 'active' : ''}`}
        onClick={() => setActiveTab('savings')}
      >
        <PiggyBank size={18} />
        <span>Savings</span>
      </button>
      <button
        className={`nav-btn ${activeTab === 'expense' ? 'active' : ''}`}
        onClick={() => setActiveTab('expense')}
      >
        <Receipt size={18} />
        <span>Expenses</span>
      </button>
    </nav>
  );
};

export default Navigation;

