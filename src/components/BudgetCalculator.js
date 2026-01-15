import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, TrendingUp, BarChart3, PieChart as PieChartIcon, Search, Trash2, File, Edit2 } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { db } from '../utils/database';
import BudgetForm from './BudgetForm';
import TableView from './TableView';
import FileUpload from './FileUpload';
import FileLinksModal from './FileLinksModal';
import { getFilesForTransaction, deleteFilesForTransaction } from '../utils/fileManager';
import BudgetPlanner from './BudgetPlanner';
import { autoSync } from '../utils/backendSync';
import { syncToElectronStorage, isElectron } from '../utils/electronStorage';
import ExcelSync from './ExcelSync';
import DateRangePicker from './DateRangePicker';
import { useCurrency } from '../contexts/CurrencyContext';
import RecordModal from './RecordModal';
import TransactionModalForm from './TransactionModalForm';
import './BudgetCalculator.css';

const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe', '#43e97b', '#fa709a', '#fee140', '#30cfd0', '#330867'];

const BudgetCalculator = () => {
  const { formatAmount, formatAmountWithSign } = useCurrency();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartView, setChartView] = useState('monthly'); // monthly, weekly, yearly
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [transactionTypeFilter, setTransactionTypeFilter] = useState('all'); // 'all', 'income', 'expense'
  const [transactionFiles, setTransactionFiles] = useState({});
  const [selectedFileModal, setSelectedFileModal] = useState(null); // { transactionId, files }
  const [editingId, setEditingId] = useState(null); // ID of transaction being edited
  const [selectedRecordModal, setSelectedRecordModal] = useState(null);

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
        files: [],
        entryCurrency: transaction.entryCurrency || 'EUR'
      });
      await loadTransactions();
      
      // Auto-sync to Excel
      try {
        const allTransactions = await db.transactions.toArray();
        const allExpenses = await db.expenses.toArray();
        const allSavings = await db.savings.toArray();
        const allBudgets = await db.budgets.toArray();
        
        await fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000'}/api/excel/update-all`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transactions: allTransactions.map(t => ({
              ID: t.id,
              Date: t.date ? new Date(t.date).toISOString().split('T')[0] : '',
              Time: t.date ? new Date(t.date).toTimeString().slice(0, 8) : '',
              Type: t.type ? t.type.charAt(0).toUpperCase() + t.type.slice(1) : '',
              Category: t.category || '',
              Subcategory: t.subcategory || '',
              Amount: t.amount || 0,
              Description: t.description || '',
              'Created At': t.createdAt || new Date().toISOString()
            })),
            expenses: allExpenses.map(e => ({
              ID: e.id,
              Date: e.date ? new Date(e.date).toISOString().split('T')[0] : '',
              Time: e.date ? new Date(e.date).toTimeString().slice(0, 8) : '',
              Category: e.category || '',
              Subcategory: e.subcategory || '',
              Amount: e.amount || 0,
              Description: e.description || '',
              'Created At': e.createdAt || new Date().toISOString()
            })),
            savings: allSavings.map(s => ({
              ID: s.id,
              Date: s.date ? new Date(s.date).toISOString().split('T')[0] : '',
              Time: s.date ? new Date(s.date).toTimeString().slice(0, 8) : '',
              'Account Type': s.accountType || '',
              Amount: s.amount || 0,
              'Maturity Date': s.maturityDate ? new Date(s.maturityDate).toISOString().split('T')[0] : '',
              'Interest Rate': s.interestRate || 0,
              Description: s.description || '',
              'Created At': s.createdAt || new Date().toISOString()
            })),
            budgets: allBudgets.map(b => ({
              ID: b.id,
              Category: b.category || '',
              'Monthly Limit': b.monthlyLimit || 0,
              Description: b.description || '',
              'Created At': b.createdAt || new Date().toISOString()
            }))
          })
        });
      } catch (excelError) {
        console.warn('Excel sync failed:', excelError);
      }
      
      // Auto-sync to backend
      const savedTransaction = await db.transactions.get(transactionId);
      if (savedTransaction) {
        autoSync(db, 'transaction', savedTransaction);
      }
      // Auto-sync to Electron storage
      if (isElectron()) {
        syncToElectronStorage(db);
      }
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

  const startEdit = (transaction) => {
    setEditingId(transaction.id);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const updateTransaction = async (transaction) => {
    try {
      await db.transactions.update(editingId, {
        ...transaction,
        date: transaction.date || new Date().toISOString(),
        entryCurrency: transaction.entryCurrency || 'EUR'
      });
      setEditingId(null);
      await loadTransactions();
      // Auto-sync to backend
      const updatedTransaction = await db.transactions.get(editingId);
      if (updatedTransaction) {
        autoSync(db, 'transaction', updatedTransaction);
      }
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw error;
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
          <BudgetForm 
            onAdd={editingId ? updateTransaction : addTransaction}
            editingTransaction={editingId ? transactions.find(t => t.id === editingId) : null}
            onCancel={editingId ? cancelEdit : null}
          />
        </div>
        
        <div className="summary-section">
          <div className="summary-card">
            <h2>Budget Summary</h2>
            <div className="summary-stats">
              <div className="stat-item income-stat">
              <div className="stat-label">Total Income</div>
              <div className="stat-value positive">{formatAmount(summary.income)}</div>
            </div>
            <div className="stat-item expense-stat">
              <div className="stat-label">Total Expenses</div>
              <div className="stat-value negative">{formatAmount(summary.expenses)}</div>
            </div>
            <div className="stat-item balance-stat">
              <div className="stat-label">Current Balance</div>
              <div className={`stat-value ${summary.balance >= 0 ? 'positive' : 'negative'}`} style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                {formatAmountWithSign(summary.balance, true)}
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
              <Tooltip formatter={(value) => formatAmount(value)} />
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
              <Tooltip formatter={(value) => formatAmount(value)} />
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
              <Tooltip formatter={(value) => formatAmount(value)} />
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
              <Tooltip formatter={(value) => formatAmount(value)} />
              <Bar dataKey="value" fill="#667eea" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <BudgetPlanner transactions={transactions} />

      <div className="excel-section">
        <ExcelSync />
      </div>

      <TableView
        title={`All Transactions${(startDate || endDate || searchQuery || transactionTypeFilter !== 'all') ? ' (Filtered)' : ''}`}
        onRowDoubleClick={(row) => setSelectedRecordModal(row)}
        data={filteredTransactions.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt))}
        columns={[
          { key: 'type', header: 'Type', render: (val) => <span className={`transaction-type ${val}`}>{val.charAt(0).toUpperCase() + val.slice(1)}</span> },
          { key: 'category', header: 'Category' },
          { key: 'description', header: 'Description', render: (val) => val || 'N/A' },
          { key: 'id', header: 'Files', render: (val, row) => {
            const files = transactionFiles[val] || [];
            if (files.length === 0) return <span style={{ color: '#94a3b8' }}>No files</span>;
            return (
              <button
                onClick={() => setSelectedFileModal({ 
                  transactionId: val, 
                  files, 
                  transactionType: 'transaction',
                  category: row.category,
                  description: row.description
                })}
                style={{
                  display: 'flex',
                  gap: '6px',
                  alignItems: 'center',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  transition: 'all 0.2s',
                  color: '#667eea'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f1f5f9';
                  e.currentTarget.style.textDecoration = 'underline';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'none';
                  e.currentTarget.style.textDecoration = 'none';
                }}
                title="Click to view files"
              >
                <File size={14} />
                <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>
                  {files.length} file{files.length > 1 ? 's' : ''}
                </span>
              </button>
            );
          }},
          { key: 'amount', header: 'Amount', render: (val, row) => formatAmountWithSign(val * (row.type === 'income' ? 1 : -1), true) },
          { key: 'date', header: 'Date', render: (val) => new Date(val).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) },
          {
            key: 'id',
            header: 'Actions',
            render: (val, row) => (
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  className="edit-btn-table"
                  onClick={() => startEdit(row)}
                  style={{
                    padding: '6px 10px',
                    background: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '12px'
                  }}
                  title="Edit transaction"
                >
                  <Edit2 size={14} />
                </button>
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

      {selectedFileModal && (
        <FileLinksModal
          files={selectedFileModal.files}
          transactionId={selectedFileModal.transactionId}
          transactionType={selectedFileModal.transactionType}
          transactionCategory={selectedFileModal.category}
          transactionDescription={selectedFileModal.description}
          onClose={() => setSelectedFileModal(null)}
        />
      )}

      {selectedRecordModal && (
        <RecordModal
          record={selectedRecordModal}
          recordType="Transaction"
          onClose={() => setSelectedRecordModal(null)}
          onUpdate={async (updatedData) => {
            try {
              await db.transactions.update(selectedRecordModal.id, updatedData);
              await loadTransactions();
              const updatedTransaction = await db.transactions.get(selectedRecordModal.id);
              if (updatedTransaction) {
                autoSync(db, 'transaction', updatedTransaction);
              }
              if (isElectron()) {
                syncToElectronStorage(db);
              }
              setSelectedRecordModal(null);
            } catch (error) {
              console.error('Error updating transaction:', error);
              alert('Error updating transaction');
            }
          }}
          onDelete={async (id) => {
            try {
              await deleteFilesForTransaction(id, 'transaction');
              await db.transactions.delete(id);
              await loadTransactions();
            } catch (error) {
              console.error('Error deleting transaction:', error);
            }
          }}
          formComponent={TransactionModalForm}
          formatAmount={formatAmount}
        />
      )}
    </div>
  );
};

export default BudgetCalculator;

