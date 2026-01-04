import React from 'react';
import { Wallet, PiggyBank, Receipt, Trash2, Target, Bell } from 'lucide-react';
import './Navigation.css';

const Navigation = ({ activeTab, setActiveTab }) => {
  return (
    <nav className="sidebar-navigation">
      <div className="nav-header">
        <h3>Menu</h3>
      </div>
      <div className="nav-items">
        <button
          className={`nav-item ${activeTab === 'budget' ? 'active' : ''}`}
          onClick={() => setActiveTab('budget')}
        >
          <Wallet size={20} />
          <span>Budget</span>
        </button>
        <button
          className={`nav-item ${activeTab === 'savings' ? 'active' : ''}`}
          onClick={() => setActiveTab('savings')}
        >
          <PiggyBank size={20} />
          <span>Savings</span>
        </button>
        <button
          className={`nav-item ${activeTab === 'expense' ? 'active' : ''}`}
          onClick={() => setActiveTab('expense')}
        >
          <Receipt size={20} />
          <span>Expenses</span>
        </button>
        <button
          className={`nav-item ${activeTab === 'goals' ? 'active' : ''}`}
          onClick={() => setActiveTab('goals')}
        >
          <Target size={20} />
          <span>Goals</span>
        </button>
        <button
          className={`nav-item ${activeTab === 'reminders' ? 'active' : ''}`}
          onClick={() => setActiveTab('reminders')}
        >
          <Bell size={20} />
          <span>Reminders</span>
        </button>
        <button
          className={`nav-item ${activeTab === 'bin' ? 'active' : ''}`}
          onClick={() => setActiveTab('bin')}
        >
          <Trash2 size={20} />
          <span>File Bin</span>
        </button>
      </div>
    </nav>
  );
};

export default Navigation;

