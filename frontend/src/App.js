import React, { useState, useEffect } from 'react';
import './App.css';
import BudgetForm from './components/BudgetForm';
import BudgetList from './components/BudgetList';
import BudgetSummary from './components/BudgetSummary';
import ExcelExport from './components/ExcelExport';
import { db } from './utils/database';

function App() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const allTransactions = await db.transactions.toArray();
      setTransactions(allTransactions);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTransaction = async (transaction) => {
    try {
      const id = await db.transactions.add({
        ...transaction,
        date: new Date().toISOString(),
        createdAt: new Date().toISOString()
      });
      await loadTransactions();
      return id;
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw error;
    }
  };

  const deleteTransaction = async (id) => {
    try {
      await db.transactions.delete(id);
      await loadTransactions();
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  const updateTransaction = async (id, updates) => {
    try {
      await db.transactions.update(id, updates);
      await loadTransactions();
    } catch (error) {
      console.error('Error updating transaction:', error);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>💰 Budget Calculator</h1>
        <p>Track your income and expenses</p>
      </header>
      <div className="container">
        <div className="main-content">
          <BudgetForm onAdd={addTransaction} />
          <BudgetSummary transactions={transactions} />
          <ExcelExport transactions={transactions} />
        </div>
        <BudgetList
          transactions={transactions}
          onDelete={deleteTransaction}
          onUpdate={updateTransaction}
        />
      </div>
    </div>
  );
}

export default App;

