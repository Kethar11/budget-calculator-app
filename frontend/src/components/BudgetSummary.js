import React, { useMemo } from 'react';
import './BudgetSummary.css';

const BudgetSummary = ({ transactions }) => {
  const summary = useMemo(() => {
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    const balance = income - expenses;
    
    return { income, expenses, balance };
  }, [transactions]);

  return (
    <div className="budget-summary-card">
      <h2>Summary</h2>
      <div className="summary-item income">
        <div className="summary-label">Total Income</div>
        <div className="summary-value positive">${summary.income.toFixed(2)}</div>
      </div>
      <div className="summary-item expense">
        <div className="summary-label">Total Expenses</div>
        <div className="summary-value negative">${summary.expenses.toFixed(2)}</div>
      </div>
      <div className="summary-item balance">
        <div className="summary-label">Balance</div>
        <div className={`summary-value ${summary.balance >= 0 ? 'positive' : 'negative'}`}>
          ${summary.balance.toFixed(2)}
        </div>
      </div>
    </div>
  );
};

export default BudgetSummary;

