import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, TrendingUp, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { db } from '../utils/database';
import BudgetForm from './BudgetForm';
import BudgetList from './BudgetList';
import BudgetPlanner from './BudgetPlanner';
import ExcelExport from './ExcelExport';
import './BudgetCalculator.css';

const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe', '#43e97b', '#fa709a', '#fee140', '#30cfd0', '#330867'];

const BudgetCalculator = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartView, setChartView] = useState('monthly'); // monthly, weekly, yearly
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

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
        date: transaction.date || new Date().toISOString(),
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

  const filteredTransactions = useMemo(() => {
    if (!startDate && !endDate) return transactions;
    
    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date || transaction.createdAt);
      const transactionDateStr = transactionDate.toISOString().split('T')[0];
      
      if (startDate && endDate) {
        return transactionDateStr >= startDate && transactionDateStr <= endDate;
      } else if (startDate) {
        return transactionDateStr >= startDate;
      } else if (endDate) {
        return transactionDateStr <= endDate;
      }
      return true;
    });
  }, [transactions, startDate, endDate]);

  const summary = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    const expenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    const balance = income - expenses;
    
    return { income, expenses, balance };
  }, [filteredTransactions]);

  const categoryData = useMemo(() => {
    const expenseCategories = {};
    filteredTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        expenseCategories[t.category] = (expenseCategories[t.category] || 0) + (t.amount || 0);
      });
    
    return Object.entries(expenseCategories).map(([name, value]) => ({
      name,
      value: parseFloat(value.toFixed(2))
    })).sort((a, b) => b.value - a.value);
  }, [filteredTransactions]);

  const incomeCategoryData = useMemo(() => {
    const incomeCategories = {};
    filteredTransactions
      .filter(t => t.type === 'income')
      .forEach(t => {
        incomeCategories[t.category] = (incomeCategories[t.category] || 0) + (t.amount || 0);
      });
    
    return Object.entries(incomeCategories).map(([name, value]) => ({
      name,
      value: parseFloat(value.toFixed(2))
    })).sort((a, b) => b.value - a.value);
  }, [filteredTransactions]);

  const getChartData = useMemo(() => {
    const data = {};
    filteredTransactions.forEach(t => {
      const date = new Date(t.date || t.createdAt);
      let key = '';
      let label = '';
      
      if (chartView === 'yearly') {
        key = date.getFullYear().toString();
        label = key;
      } else if (chartView === 'weekly') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = `${weekStart.getFullYear()}-W${String(Math.ceil((weekStart.getDate() + new Date(weekStart.getFullYear(), 0, 1).getDay()) / 7)).padStart(2, '0')}`;
        label = `Week ${key.split('-W')[1]}`;
      } else { // monthly
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        label = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      }
      
      if (!data[key]) {
        data[key] = { period: label, income: 0, expense: 0 };
      }
      if (t.type === 'income') {
        data[key].income += t.amount || 0;
      } else {
        data[key].expense += t.amount || 0;
      }
    });
    return Object.values(data).sort((a, b) => {
      if (chartView === 'yearly') return a.period.localeCompare(b.period);
      return a.period.localeCompare(b.period);
    });
  }, [transactions, chartView]);

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
                <div className="stat-value positive">€{summary.income.toFixed(2)}</div>
              </div>
              <div className="stat-item expense-stat">
                <div className="stat-label">Total Expenses</div>
                <div className="stat-value negative">€{summary.expenses.toFixed(2)}</div>
              </div>
              <div className="stat-item balance-stat">
                <div className="stat-label">Balance</div>
                <div className={`stat-value ${summary.balance >= 0 ? 'positive' : 'negative'}`}>
                  €{summary.balance.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="chart-view-selector">
        <div className="view-buttons">
          <button
            className={`view-btn ${chartView === 'weekly' ? 'active' : ''}`}
            onClick={() => setChartView('weekly')}
          >
            <Calendar size={16} />
            Weekly
          </button>
          <button
            className={`view-btn ${chartView === 'monthly' ? 'active' : ''}`}
            onClick={() => setChartView('monthly')}
          >
            <Calendar size={16} />
            Monthly
          </button>
          <button
            className={`view-btn ${chartView === 'yearly' ? 'active' : ''}`}
            onClick={() => setChartView('yearly')}
          >
            <Calendar size={16} />
            Yearly
          </button>
        </div>
      </div>

      <div className="charts-section">
        <div className="chart-card">
          <h3>
            <TrendingUp size={20} className="icon-inline" />
            {chartView.charAt(0).toUpperCase() + chartView.slice(1)} Income vs Expenses
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={getChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip formatter={(value) => `€${value.toFixed(2)}`} />
              <Legend />
              <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={3} name="Income" />
              <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={3} name="Expenses" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>
            <PieChartIcon size={20} className="icon-inline" />
            Expense Categories
          </h3>
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
          <h3>
            <PieChartIcon size={20} className="icon-inline" />
            Income Sources
          </h3>
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
              <Tooltip formatter={(value) => `€${value.toFixed(2)}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>
            <BarChart3 size={20} className="icon-inline" />
            Category Comparison
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => `€${value.toFixed(2)}`} />
              <Bar dataKey="value" fill="#667eea" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <BudgetPlanner transactions={transactions} />

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

