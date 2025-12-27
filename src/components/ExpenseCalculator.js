import React, { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { db } from '../utils/database';
import './ExpenseCalculator.css';

const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#10b981'];

const ExpenseCalculator = () => {
  const [expenses, setExpenses] = useState([]);
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    description: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    try {
      const allExpenses = await db.expenses.toArray();
      setExpenses(allExpenses);
    } catch (error) {
      console.error('Error loading expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const addExpense = async (e) => {
    e.preventDefault();
    if (!formData.category || !formData.amount || !formData.description) {
      alert('Please fill in all fields');
      return;
    }

    try {
      await db.expenses.add({
        ...formData,
        amount: parseFloat(formData.amount),
        date: new Date().toISOString(),
        createdAt: new Date().toISOString()
      });
      setFormData({
        category: '',
        amount: '',
        description: ''
      });
      await loadExpenses();
    } catch (error) {
      console.error('Error adding expense:', error);
      alert('Error adding expense');
    }
  };

  const deleteExpense = async (id) => {
    try {
      await db.expenses.delete(id);
      await loadExpenses();
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  const categoryData = useMemo(() => {
    const categories = {};
    expenses.forEach(expense => {
      categories[expense.category] = (categories[expense.category] || 0) + (expense.amount || 0);
    });
    
    return Object.entries(categories).map(([name, value]) => ({
      name,
      value: parseFloat(value.toFixed(2))
    })).sort((a, b) => b.value - a.value);
  }, [expenses]);

  const monthlyExpenseData = useMemo(() => {
    const monthly = {};
    expenses.forEach(expense => {
      const date = new Date(expense.date || expense.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthly[monthKey]) {
        monthly[monthKey] = { month: monthKey, amount: 0 };
      }
      monthly[monthKey].amount += expense.amount || 0;
    });
    return Object.values(monthly).sort((a, b) => a.month.localeCompare(b.month));
  }, [expenses]);

  const dailyExpenseData = useMemo(() => {
    const daily = {};
    expenses.forEach(expense => {
      const date = new Date(expense.date || expense.createdAt);
      const dayKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!daily[dayKey]) {
        daily[dayKey] = { day: dayKey, amount: 0 };
      }
      daily[dayKey].amount += expense.amount || 0;
    });
    return Object.values(daily).slice(-30).sort((a, b) => new Date(a.day) - new Date(b.day));
  }, [expenses]);

  const totalExpenses = useMemo(() => {
    return expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  }, [expenses]);

  const averageExpense = useMemo(() => {
    return expenses.length > 0 ? totalExpenses / expenses.length : 0;
  }, [expenses, totalExpenses]);

  const categories = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Education', 'Other'];

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="expense-calculator">
      <div className="expense-grid">
        <div className="expense-form-section">
          <div className="expense-form-card">
            <h2>Add Expense</h2>
            <form onSubmit={addExpense}>
              <div className="form-group">
                <label>Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                >
                  <option value="">Select category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>
              <button type="submit" className="submit-btn">Add Expense</button>
            </form>
          </div>
        </div>

        <div className="expense-summary-section">
          <div className="expense-summary-card">
            <h2>Expense Summary</h2>
            <div className="summary-stats">
              <div className="stat-item">
                <div className="stat-label">Total Expenses</div>
                <div className="stat-value negative">${totalExpenses.toFixed(2)}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Number of Expenses</div>
                <div className="stat-value">{expenses.length}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Average Expense</div>
                <div className="stat-value">${averageExpense.toFixed(2)}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Top Category</div>
                <div className="stat-value">
                  {categoryData.length > 0 ? categoryData[0].name : 'N/A'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="expense-charts-section">
        <div className="chart-card">
          <h3>Expenses by Category</h3>
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
          <h3>Monthly Expenses Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyExpenseData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
              <Line type="monotone" dataKey="amount" stroke="#ef4444" strokeWidth={3} />
            </LineChart>
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
              <Bar dataKey="value" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Daily Expenses (Last 30 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={dailyExpenseData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
              <Area type="monotone" dataKey="amount" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="expense-list-section">
        <div className="expense-list-card">
          <h2>All Expenses</h2>
          {expenses.length === 0 ? (
            <div className="empty-state">No expenses recorded yet. Add one above!</div>
          ) : (
            <div className="expenses-list">
              {expenses
                .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt))
                .map(expense => (
                  <div key={expense.id} className="expense-item">
                    <div className="expense-main">
                      <div className="expense-info">
                        <div className="expense-category">{expense.category}</div>
                        <div className="expense-description">{expense.description}</div>
                        <div className="expense-date">
                          {new Date(expense.date || expense.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                      </div>
                      <div className="expense-amount">
                        ${(expense.amount || 0).toFixed(2)}
                      </div>
                    </div>
                    <button
                      className="delete-btn"
                      onClick={() => {
                        if (window.confirm('Delete this expense?')) {
                          deleteExpense(expense.id);
                        }
                      }}
                    >
                      Delete
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExpenseCalculator;

