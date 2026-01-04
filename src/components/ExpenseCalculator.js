import React, { useState, useEffect, useMemo } from 'react';
import { Mail, Trash2, File, Search } from 'lucide-react';
import TableView from './TableView';
import DateRangePicker from './DateRangePicker';
import FileUpload from './FileUpload';
import FileLinksModal from './FileLinksModal';
import { getFilesForTransaction, deleteFilesForTransaction } from '../utils/fileManager';
import { useCurrency } from '../contexts/CurrencyContext';
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
  const { formatAmount } = useCurrency();
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
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expenseFiles, setExpenseFiles] = useState({});
  const [selectedFileModal, setSelectedFileModal] = useState(null); // { transactionId, files }
  const [pendingFiles, setPendingFiles] = useState([]); // Files selected before expense creation

  useEffect(() => {
    loadExpenses();
  }, []);

  useEffect(() => {
    const loadFilesForAll = async () => {
      const filesMap = {};
      for (const expense of expenses) {
        if (expense.id) {
          const files = await getFilesForTransaction(expense.id, 'expense');
          if (files.length > 0) {
            filesMap[expense.id] = files;
          }
        }
      }
      setExpenseFiles(filesMap);
    };
    if (expenses.length > 0) {
      loadFilesForAll();
    }
  }, [expenses]);

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
      const expenseId = await db.expenses.add({
        category: formData.category,
        subcategory: formData.subcategory || '',
        amount: parseFloat(formData.amount),
        description: formData.description || '',
        date: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        files: []
      });

      // Save pending files if any
      if (pendingFiles.length > 0) {
        const { saveFile } = await import('../utils/fileManager');
        for (const file of pendingFiles) {
          try {
            await saveFile(file, expenseId, 'expense');
          } catch (fileError) {
            console.error('Error saving file:', fileError);
          }
        }
        setPendingFiles([]);
      }

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

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const acceptedFormats = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/bmp',
      'image/tiff',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    const validFiles = selectedFiles.filter(file => {
      if (!acceptedFormats.includes(file.type)) {
        alert(`${file.name} is not a supported file type. Supported: Images (JPG, PNG, GIF, WEBP, BMP, TIFF), PDF, Word, Excel.`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        alert(`${file.name} is too large. Maximum file size is 10MB.`);
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      setPendingFiles(prev => [...prev, ...validFiles]);
    }
    e.target.value = ''; // Reset input
  };

  const removePendingFile = (index) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const deleteExpense = async (id) => {
    try {
      // Delete associated files first
      await deleteFilesForTransaction(id, 'expense');
      // Then delete the expense
      await db.expenses.delete(id);
      await loadExpenses();
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };


  const filteredExpenses = useMemo(() => {
    let filtered = expenses;
    
    // Filter by date range
    if (startDate || endDate) {
      filtered = filtered.filter(expense => {
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
    }
    
    // Filter by category
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(expense => expense.category === categoryFilter);
    }
    
    return filtered;
  }, [expenses, startDate, endDate, categoryFilter]);

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
    'Fixed Expenses',
    'Food',
    'Transport',
    'Lifestyle',
    'Shopping',
    'Travel',
    'Donation',
    'Savings & Investments',
    'Send Money to Parents',
    'Other'
  ];

  const subcategories = {
    'Fixed Expenses': [
      'Rent',
      'Electricity',
      'Water',
      'Internet',
      'Phone/Internet',
      'House Insurance',
      'Groceries'
    ],
    'Food': [
      'Groceries',
      'Food Outside',
      'Restaurant',
      'Takeaway',
      'Coffee/Tea',
      'Snacks'
    ],
    'Transport': [
      'Public Transport',
      'Taxi/Uber',
      'Fuel',
      'Car Maintenance',
      'Parking',
      'Bike/Scooter'
    ],
    'Lifestyle': [
      'Movie',
      'Entertainment',
      'Fitness/Badminton',
      'Gym/Basic Fit',
      'Hobbies',
      'Temu',
      'Subscriptions'
    ],
    'Shopping': [
      'Dress/Clothing',
      'Tools',
      'Electronics',
      'Home & Kitchen',
      'Books',
      'Beauty & Personal Care',
      'Sports & Outdoors',
      'Accessories',
      'Other Shopping'
    ],
    'Travel': [
      'Flight',
      'Hotel',
      'Train',
      'Food & Dining',
      'Activities',
      'Shopping',
      'Other Travel'
    ],
    'Donation': [
      'Charity',
      'Religious',
      'Education',
      'Medical',
      'Other Donation'
    ],
    'Savings & Investments': [
      'Savings Deposit',
      'Investment',
      'Emergency Fund'
    ],
    'Send Money to Parents': [],
    'Other': []
  };

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
              {formData.category && subcategories[formData.category] && subcategories[formData.category].length > 0 && (
                <div className="form-group">
                  <label>Subcategory</label>
                  <select
                    value={formData.subcategory}
                    onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                  >
                    <option value="">Select subcategory (optional)</option>
                    {subcategories[formData.category].map(subcat => (
                      <option key={subcat} value={subcat}>{subcat}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="form-group">
                <label>Amount</label>
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
              <div className="form-group">
                <label>Attach Bill/Receipt (Optional)</label>
                <div className="file-upload-section-form">
                  <label className="file-upload-label-form">
                    <File size={18} />
                    <span>Select Files</span>
                    <span className="file-upload-hint-form">Images, PDFs, Documents (Max 10MB each)</span>
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                    onChange={handleFileSelect}
                    className="file-input-form"
                  />
                </div>
                {pendingFiles.length > 0 && (
                  <div className="pending-files-list">
                    <div className="pending-files-header">
                      <span>{pendingFiles.length} file(s) selected</span>
                    </div>
                    <div className="pending-files-items">
                      {pendingFiles.map((file, index) => (
                        <div key={index} className="pending-file-item">
                          <File size={14} />
                          <span className="pending-file-name" title={file.name}>
                            {file.name.length > 30 ? file.name.substring(0, 30) + '...' : file.name}
                          </span>
                          <span className="pending-file-size">
                            {(file.size / 1024).toFixed(1)} KB
                          </span>
                          <button
                            type="button"
                            className="remove-file-btn"
                            onClick={() => removePendingFile(index)}
                            title="Remove file"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
                <div className="stat-value negative">{formatAmount(totalExpenses)}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Number of Expenses</div>
                <div className="stat-value">{filteredExpenses.length}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Average Expense</div>
                <div className="stat-value">{formatAmount(averageExpense)}</div>
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


      <div className="expense-list-section">
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
        
        <div className="expense-filters">
          <div className="filter-row">
            <div className="filter-group">
              <label>Search</label>
              <div className="search-input-wrapper">
                <Search size={18} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search expenses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>
            <div className="filter-group">
              <label>Filter by Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="category-filter-select"
              >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
              </select>
            </div>
          </div>
          <div className="quick-filter-buttons">
            <button
              className={`quick-filter-btn ${categoryFilter === 'all' ? 'active' : ''}`}
              onClick={() => setCategoryFilter('all')}
            >
              All
            </button>
            {categories.slice(0, 5).map(cat => (
              <button
                key={cat}
                className={`quick-filter-btn ${categoryFilter === cat ? 'active' : ''}`}
                onClick={() => setCategoryFilter(cat)}
              >
                {cat === 'Send Money to Parents' && <Mail size={16} className="icon-inline" />}
                {cat}
              </button>
            ))}
            {(startDate || endDate || categoryFilter !== 'all' || searchQuery) && (
              <button
                className="clear-filters-btn"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setCategoryFilter('all');
                  setSearchQuery('');
                }}
              >
                Clear All Filters
              </button>
            )}
          </div>
        </div>
        
        <TableView
          title={`All Expenses${(startDate || endDate || categoryFilter !== 'all' || searchQuery) ? ' (Filtered)' : ''}`}
          data={filteredExpenses
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
                {val === 'Send Money to Parents' && <Mail size={14} className="icon-inline" style={{ color: '#667eea', marginRight: '6px' }} />}
                {val}
                {row.subcategory && <span className="expense-subcategory"> - {row.subcategory}</span>}
              </span>
            )},
            { key: 'description', header: 'Description', render: (val) => val || 'No description' },
            { key: 'id', header: 'Files', render: (val, row) => {
              const files = expenseFiles[val] || [];
              if (files.length === 0) return <span style={{ color: '#94a3b8' }}>No files</span>;
              return (
                <button
                  onClick={() => setSelectedFileModal({ 
                    transactionId: val, 
                    files, 
                    transactionType: 'expense',
                    category: row.category,
                    subcategory: row.subcategory,
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
            { key: 'formattedDate', header: 'Date' },
            { key: 'formattedTime', header: 'Time' },
            { key: 'amount', header: 'Amount', render: (val) => formatAmount(val) },
            {
              key: 'id',
              header: 'Actions',
              render: (val) => (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <FileUpload
                    transactionId={val}
                    transactionType="expense"
                    onFilesChange={async () => {
                      const files = await getFilesForTransaction(val, 'expense');
                      setExpenseFiles(prev => ({ ...prev, [val]: files }));
                    }}
                    existingFiles={expenseFiles[val] || []}
                    compact={true}
                  />
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
                </div>
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
                      <Tooltip formatter={(value) => formatAmount(value)} />
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
                      <Tooltip formatter={(value) => formatAmount(value)} />
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
                      <Tooltip formatter={(value) => formatAmount(value)} />
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
                      <Tooltip formatter={(value) => formatAmount(value)} />
                      <Area type="monotone" dataKey="amount" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : null
          }
        />
      </div>

      {selectedFileModal && (
        <FileLinksModal
          files={selectedFileModal.files}
          transactionId={selectedFileModal.transactionId}
          transactionType={selectedFileModal.transactionType}
          onClose={() => setSelectedFileModal(null)}
        />
      )}
    </div>
  );
};

export default ExpenseCalculator;

