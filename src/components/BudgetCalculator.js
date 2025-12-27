import React, { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { db } from '../utils/database';
import BudgetForm from './BudgetForm';
import BudgetList from './BudgetList';
import ExcelExport from './ExcelExport';
import './BudgetCalculator.css';

const COLORS = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const BudgetCalculator = () => {
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
      await db.transactions.add({
        ...transaction,
        date: new Date().toISOString(),
        createdAt: new Date().toISOString()
      });
      await loadTransactions();
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

  const categoryData = useMemo(() => {
    const expenseCategories = {};
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        expenseCategories[t.category] = (expenseCategories[t.category] || 0) + (t.amount || 0);
      });
    
    return Object.entries(expenseCategories).map(([name, value]) => ({
      name,
      value: parseFloat(value.toFixed(2))
    })).sort((a, b) => b.value - a.value);
  }, [transactions]);

  const incomeCategoryData = useMemo(() => {
    const incomeCategories = {};
    transactions
      .filter(t => t.type === 'income')
      .forEach(t => {
        incomeCategories[t.category] = (incomeCategories[t.category] || 0) + (t.amount || 0);
      });
    
    return Object.entries(incomeCategories).map(([name, value]) => ({
      name,
      value: parseFloat(value.toFixed(2))
    })).sort((a, b) => b.value - a.value);
  }, [transactions]);

  const monthlyData = useMemo(() => {
    const monthly = {};
    transactions.forEach(t => {
      const date = new Date(t.date || t.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthly[monthKey]) {
        monthly[monthKey] = { month: monthKey, income: 0, expense: 0 };
      }
      if (t.type === 'income') {
        monthly[monthKey].income += t.amount || 0;
      } else {
        monthly[monthKey].expense += t.amount || 0;
      }
    });
    return Object.values(monthly).sort((a, b) => a.month.localeCompare(b.month));
  }, [transactions]);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="budget-calculator">
      <div className="calculator-grid">
        <div className="form-section">
          <BudgetForm onAdd={addTransaction} />
        </div>
        
        <div className="summary-section">
          <div className="summary-card">
            <h2>Budget Summary</h2>
            <div className="summary-stats">
              <div className="stat-item income-stat">
                <div className="stat-label">Total Income</div>
                <div className="stat-value positive">${summary.income.toFixed(2)}</div>
              </div>
              <div className="stat-item expense-stat">
                <div className="stat-label">Total Expenses</div>
                <div className="stat-value negative">${summary.expenses.toFixed(2)}</div>
              </div>
              <div className="stat-item balance-stat">
                <div className="stat-label">Balance</div>
                <div className={`stat-value ${summary.balance >= 0 ? 'positive' : 'negative'}`}>
                  ${summary.balance.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="charts-section">
        <div className="chart-card">
          <h3>Monthly Income vs Expenses</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
              <Legend />
              <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={3} name="Income" />
              <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={3} name="Expenses" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Expense Categories</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Income Sources</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={incomeCategoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {incomeCategoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Category Comparison</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
              <Bar dataKey="value" fill="#667eea" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="excel-section">
        <ExcelExport transactions={transactions} />
      </div>

      <BudgetList
        transactions={transactions}
        onDelete={deleteTransaction}
      />
    </div>
  );
};

export default BudgetCalculator;

