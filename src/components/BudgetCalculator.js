import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, TrendingUp, BarChart3, PieChart as PieChartIcon, Search, Trash2, File } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { db } from '../utils/database';
import BudgetForm from './BudgetForm';
import TableView from './TableView';
import FileUpload from './FileUpload';
import { getFilesForTransaction, deleteFilesForTransaction } from '../utils/fileManager';
import BudgetPlanner from './BudgetPlanner';
import ExcelExport from './ExcelExport';
import DateRangePicker from './DateRangePicker';
import './BudgetCalculator.css';

const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe', '#43e97b', '#fa709a', '#fee140', '#30cfd0', '#330867'];

const BudgetCalculator = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartView, setChartView] = useState('monthly'); // monthly, weekly, yearly
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [transactionTypeFilter, setTransactionTypeFilter] = useState('all'); // 'all', 'income', 'expense'
  const [transactionFiles, setTransactionFiles] = useState({});

  useEffect(() => {
    loadTransactions();
  }, []);

  useEffect(() => {
    const loadFilesForAll = async () => {
      const filesMap = {};
      for (const transaction of transactions) {
        if (transaction.id) {
          const files = await getFilesForTransaction(transaction.id, 'transaction');
          if (files.length > 0) {
            filesMap[transaction.id] = files;
          }
        }
      }
      setTransactionFiles(filesMap);
    };
    if (transactions.length > 0) {
      loadFilesForAll();
    }
  }, [transactions]);

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
      const transactionId = await db.transactions.add({
        ...transaction,
        date: transaction.date || new Date().toISOString(),
        createdAt: new Date().toISOString(),
        files: []
      });
      await loadTransactions();
      return transactionId;
    } catch (error) {
      console.error('Error adding transaction:', error);
      throw error;
    }
  };

  const deleteTransaction = async (id) => {
    try {
      // Delete associated files first
      await deleteFilesForTransaction(id, 'transaction');
      // Then delete the transaction
      await db.transactions.delete(id);
      await loadTransactions();
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  const filteredTransactions = useMemo(() => {
    let filtered = transactions;
    
    // Filter by date range
    if (startDate || endDate) {
      filtered = filtered.filter(transaction => {
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
    }
    
    // Filter by type (income/expense)
    if (transactionTypeFilter !== 'all') {
      filtered = filtered.filter(t => t.type === transactionTypeFilter);
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(transaction => 
        (transaction.category || '').toLowerCase().includes(query) ||
        (transaction.description || '').toLowerCase().includes(query) ||
        (transaction.amount || 0).toString().includes(query)
      );
    }
    
    return filtered;
  }, [transactions, startDate, endDate, transactionTypeFilter, searchQuery]);

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
  }, [filteredTransactions, chartView]);

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
                <div className="stat-label">Current Balance</div>
                <div className={`stat-value ${summary.balance >= 0 ? 'positive' : 'negative'}`} style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                  {summary.balance >= 0 ? '+' : ''}€{summary.balance.toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="budget-filters-section">
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onClear={() => {
            setStartDate('');
            setEndDate('');
          }}
        />
        
        <div className="budget-filters">
          <div className="filter-row">
            <div className="filter-group">
              <label>Search</label>
              <div className="search-input-wrapper">
                <Search size={18} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>
            <div className="filter-group">
              <label>Filter by Type</label>
              <select
                value={transactionTypeFilter}
                onChange={(e) => setTransactionTypeFilter(e.target.value)}
                className="type-filter-select"
              >
                <option value="all">All Types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>
            {(startDate || endDate || transactionTypeFilter !== 'all' || searchQuery) && (
              <button
                className="clear-filters-btn"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setTransactionTypeFilter('all');
                  setSearchQuery('');
                }}
              >
                Clear All Filters
              </button>
            )}
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

      <TableView
        title={`All Transactions${(startDate || endDate || searchQuery || transactionTypeFilter !== 'all') ? ' (Filtered)' : ''}`}
        data={filteredTransactions.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt))}
        columns={[
          { key: 'type', header: 'Type', render: (val) => <span className={`transaction-type ${val}`}>{val.charAt(0).toUpperCase() + val.slice(1)}</span> },
          { key: 'category', header: 'Category' },
          { key: 'description', header: 'Description', render: (val) => val || 'N/A' },
          { key: 'id', header: 'Files', render: (val, row) => {
            const files = transactionFiles[val] || [];
            if (files.length === 0) return <span style={{ color: '#94a3b8' }}>No files</span>;
            return (
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <File size={14} style={{ color: '#667eea' }} />
                <span style={{ fontSize: '0.85rem', color: '#475569' }}>{files.length} file{files.length > 1 ? 's' : ''}</span>
              </div>
            );
          }},
          { key: 'amount', header: 'Amount (€)', render: (val, row) => `${row.type === 'income' ? '+' : '-'}€${Math.abs(val).toFixed(2)}` },
          { key: 'date', header: 'Date', render: (val) => new Date(val).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) },
          {
            key: 'id',
            header: 'Actions',
            render: (val, row) => (
              <div style={{ display: 'flex', gap: '6px' }}>
                <FileUpload
                  transactionId={val}
                  transactionType="transaction"
                  onFilesChange={async () => {
                    const files = await getFilesForTransaction(val, 'transaction');
                    setTransactionFiles(prev => ({ ...prev, [val]: files }));
                  }}
                  existingFiles={transactionFiles[val] || []}
                  compact={true}
                />
                <button
                  className="delete-btn-table"
                  onClick={() => {
                    if (window.confirm('Delete this transaction?')) {
                      deleteTransaction(val);
                    }
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )
          }
        ]}
        viewType="list"
        emptyMessage="No transactions recorded yet. Add one above!"
      />
    </div>
  );
};

export default BudgetCalculator;

