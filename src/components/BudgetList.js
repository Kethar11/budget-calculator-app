import React, { useState, useMemo } from 'react';
import './BudgetList.css';

const BudgetList = ({ transactions, onDelete }) => {
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(t => filter === 'all' || t.type === filter)
      .sort((a, b) => {
        if (sortBy === 'date') {
          return new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt);
        }
        if (sortBy === 'amount') {
          return b.amount - a.amount;
        }
        return 0;
      });
  }, [transactions, filter, sortBy]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="budget-list-card">
      <div className="list-header">
        <h2>Transactions</h2>
        <div className="list-controls">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="date">Sort by Date</option>
            <option value="amount">Sort by Amount</option>
          </select>
        </div>
      </div>
      <div className="transactions-list">
        {filteredTransactions.length === 0 ? (
          <div className="empty-state">No transactions found</div>
        ) : (
          filteredTransactions.map(transaction => (
            <div key={transaction.id} className={`transaction-item ${transaction.type}`}>
              <div className="transaction-main">
                <div className="transaction-info">
                  <div className="transaction-category">{transaction.category}</div>
                  <div className="transaction-description">{transaction.description}</div>
                  <div className="transaction-date">{formatDate(transaction.date || transaction.createdAt)}</div>
                </div>
                <div className={`transaction-amount ${transaction.type}`}>
                  {transaction.type === 'income' ? '+' : '-'}€{Math.abs(transaction.amount || 0).toFixed(2)}
                </div>
              </div>
              <button
                className="delete-btn"
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this transaction?')) {
                    onDelete(transaction.id);
                  }
                }}
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BudgetList;

