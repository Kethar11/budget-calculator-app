import React, { useState, useEffect, useMemo } from 'react';
import { Mail, Trash2 } from 'lucide-react';
import TableView from './TableView';
import DateRangePicker from './DateRangePicker';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { db } from '../utils/database';
import './ExpenseCalculator.css';

const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#10b981'];

const ExpenseCalculator = () => {
  const [expenses, setExpenses] = useState([]);
  const [formData, setFormData] = useState({
    category: '',
    subcategory: '',
    amount: '',
    description: ''
  });
  const [loading, setLoading] = useState(true);
  const [expenseView, setExpenseView] = useState('list');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

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
    if (!formData.category || !formData.amount) {
      alert('Please fill in category and amount');
      return;
    }

    try {
      await db.expenses.add({
        category: formData.category,
        subcategory: formData.subcategory || '',
        amount: parseFloat(formData.amount),
        description: formData.description || '',
        date: new Date().toISOString(),
        createdAt: new Date().toISOString()
      });
      setFormData({
        category: '',
        subcategory: '',
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

  const sendToParents = () => {
    if (expenses.length === 0) {
      alert('No expenses to share');
      return;
    }

    // Generate expense report
    const report = generateExpenseReport();
    
    // Create email content
    const subject = encodeURIComponent('My Expense Report');
    const body = encodeURIComponent(report);
    
    // Open email client
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const generateExpenseReport = () => {
    const date = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    let report = `EXPENSE REPORT - ${date}\n\n`;
    report += `Total Expenses: €${totalExpenses.toFixed(2)}\n`;
    report += `Number of Expenses: ${expenses.length}\n`;
    report += `Average Expense: €${averageExpense.toFixed(2)}\n\n`;
    report += `--- EXPENSES BY CATEGORY ---\n\n`;
    
    categoryData.forEach(cat => {
      report += `${cat.name}: €${cat.value.toFixed(2)}\n`;
    });
    
    report += `\n--- DETAILED EXPENSES ---\n\n`;
    expenses
      .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt))
      .forEach(expense => {
        const expenseDate = new Date(expense.date || expense.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
        report += `${expenseDate} - ${expense.category}: €${expense.amount.toFixed(2)} - ${expense.description}\n`;
      });
    
    return report;
  };

  const filteredExpenses = useMemo(() => {
    if (!startDate && !endDate) return expenses;
    
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date || expense.createdAt);
      const expenseDateStr = expenseDate.toISOString().split('T')[0];
      
      if (startDate && endDate) {
        return expenseDateStr >= startDate && expenseDateStr <= endDate;
      } else if (startDate) {
        return expenseDateStr >= startDate;
      } else if (endDate) {
        return expenseDateStr <= endDate;
      }
      return true;
    });
  }, [expenses, startDate, endDate]);

  const categoryData = useMemo(() => {
    const categories = {};
    filteredExpenses.forEach(expense => {
      categories[expense.category] = (categories[expense.category] || 0) + (expense.amount || 0);
    });
    
    return Object.entries(categories).map(([name, value]) => ({
      name,
      value: parseFloat(value.toFixed(2))
    })).sort((a, b) => b.value - a.value);
  }, [filteredExpenses]);

  const monthlyExpenseData = useMemo(() => {
    const monthly = {};
    filteredExpenses.forEach(expense => {
      const date = new Date(expense.date || expense.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthly[monthKey]) {
        monthly[monthKey] = { month: monthKey, amount: 0 };
      }
      monthly[monthKey].amount += expense.amount || 0;
    });
    return Object.values(monthly).sort((a, b) => a.month.localeCompare(b.month));
  }, [filteredExpenses]);

  const dailyExpenseData = useMemo(() => {
    const daily = {};
    filteredExpenses.forEach(expense => {
      const date = new Date(expense.date || expense.createdAt);
      const dayKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!daily[dayKey]) {
        daily[dayKey] = { day: dayKey, amount: 0 };
      }
      daily[dayKey].amount += expense.amount || 0;
    });
    return Object.values(daily).slice(-30).sort((a, b) => new Date(a.day) - new Date(b.day));
  }, [filteredExpenses]);

  const totalExpenses = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  }, [filteredExpenses]);

  const averageExpense = useMemo(() => {
    return filteredExpenses.length > 0 ? totalExpenses / filteredExpenses.length : 0;
  }, [filteredExpenses, totalExpenses]);

  const categories = [
    'Food',
    'Transport',
    'Bills',
    'Shopping',
    'Rent',
    'Send to Parents',
    'Other'
  ];

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
                  onChange={(e) => setFormData({ ...formData, category: e.target.value, subcategory: '' })}
                  required
                >
                  <option value="">Select category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Amount (€)</label>
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
                <div className="stat-value negative">€{totalExpenses.toFixed(2)}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Number of Expenses</div>
                <div className="stat-value">{filteredExpenses.length}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Average Expense</div>
                <div className="stat-value">€{averageExpense.toFixed(2)}</div>
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


      <div className="expense-actions-section">
        <div className="expense-actions-card">
          <h2>Send Money to Parents</h2>
          <div className="quick-add-parents">
            <p className="action-hint">Quickly add an expense for money sent to parents</p>
            <button
              className="send-parents-btn"
              onClick={() => {
                setFormData({
                  category: 'Send to Parents',
                  subcategory: '',
                  amount: '',
                  description: 'Money sent to parents'
                });
                // Scroll to form
                document.querySelector('.expense-form-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              <Mail size={18} className="icon-inline" />
              Add "Send to Parents" Expense
            </button>
          </div>
          <div className="share-report-section">
            <button
              className="share-report-btn"
              onClick={() => {
                if (expenses.length === 0) {
                  alert('No expenses to share');
                  return;
                }
                sendToParents();
              }}
            >
              <Mail size={18} className="icon-inline" />
              Share Expense Report
            </button>
            <p className="action-hint-small">Generate and email expense report to parents</p>
          </div>
        </div>
      </div>

      <div className="expense-list-section">
        <TableView
          title="All Expenses"
          data={expenses
            .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt))
            .map(expense => ({
              ...expense,
              formattedDate: new Date(expense.date || expense.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              }),
              formattedTime: new Date(expense.date || expense.createdAt).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
              })
            }))}
          columns={[
            { key: 'category', header: 'Category', render: (val, row) => (
              <span>
                {val === 'Send to Parents' && <Mail size={14} className="icon-inline" style={{ color: '#667eea', marginRight: '6px' }} />}
                {val}
                {row.subcategory && <span className="expense-subcategory"> - {row.subcategory}</span>}
              </span>
            )},
            { key: 'description', header: 'Description', render: (val) => val || 'No description' },
            { key: 'formattedDate', header: 'Date' },
            { key: 'formattedTime', header: 'Time' },
            { key: 'amount', header: 'Amount (€)', render: (val) => `€${val.toFixed(2)}` },
            {
              key: 'id',
              header: 'Actions',
              render: (val) => (
                <button
                  className="delete-btn-table"
                  onClick={() => {
                    if (window.confirm('Delete this expense?')) {
                      deleteExpense(val);
                    }
                  }}
                >
                  <Trash2 size={16} />
                </button>
              )
            }
          ]}
          viewType={expenseView}
          onViewChange={setExpenseView}
          emptyMessage="No expenses recorded yet. Add one above!"
          chartContent={
            expenseView === 'chart' ? (
              <div className="expense-charts-in-table">
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
                      <Tooltip formatter={(value) => `€${value.toFixed(2)}`} />
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
                      <Tooltip formatter={(value) => `€${value.toFixed(2)}`} />
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
                      <Tooltip formatter={(value) => `€${value.toFixed(2)}`} />
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
                      <Tooltip formatter={(value) => `€${value.toFixed(2)}`} />
                      <Area type="monotone" dataKey="amount" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : null
          }
        />
      </div>
    </div>
  );
};

export default ExpenseCalculator;

