import React, { useState, useEffect, useMemo } from 'react';
import { Mail, Trash2, File, Edit2 } from 'lucide-react';
import TableView from './TableView';
import CompactControls from './CompactControls';
import FileUpload from './FileUpload';
import FileLinksModal from './FileLinksModal';
import { getFilesForTransaction, deleteFilesForTransaction } from '../utils/fileManager';
import { useCurrency } from '../contexts/CurrencyContext';
import { addRecordToGoogleSheets, updateRecordInGoogleSheets, deleteRecordFromGoogleSheets } from '../utils/googleSheetsDirect';
// Removed Electron storage
import AmountInput from './AmountInput';
import RecordModal from './RecordModal';
import ExpenseModalForm from './ExpenseModalForm';
import {
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
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
    description: '',
    entryCurrency: 'EUR',
    date: new Date().toISOString().split('T')[0], // Default to today
    time: new Date().toTimeString().slice(0, 5) // Default to current time
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
  const [editingId, setEditingId] = useState(null); // ID of expense being edited
  const [selectedRecordModal, setSelectedRecordModal] = useState(null); // Record selected for modal view/edit

  useEffect(() => {
    loadExpenses();
    
    // Reload when data changes (e.g., after fetch from Excel)
    const handleDataChange = () => {
      loadExpenses();
    };
    window.addEventListener('dataChanged', handleDataChange);
    
    return () => {
      window.removeEventListener('dataChanged', handleDataChange);
    };
  }, []);

  // Removed useEffect that was causing infinite loop
  // Stats will update automatically when data actually changes via other events

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
      // Don't trigger dataChanged here - it causes infinite loops
      // Stats will update when data actually changes (add/update/delete)
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

    // Set loading state
    setLoading(true);

    try {
      // Combine date and time into ISO string
      // Safely parse date and time
      let dateTime;
      if (formData.date && formData.time) {
        try {
          const dateObj = new Date(`${formData.date}T${formData.time}`);
          if (!isNaN(dateObj.getTime())) {
            dateTime = dateObj.toISOString();
          } else {
            dateTime = new Date().toISOString();
          }
        } catch (e) {
          dateTime = new Date().toISOString();
        }
      } else {
        dateTime = new Date().toISOString();
      }
      
      // Generate temporary ID
      const tempId = Date.now();
      const expenseToAdd = {
        id: tempId,
        category: formData.category,
        subcategory: formData.subcategory || '',
        amount: parseFloat(formData.amount),
        description: formData.description || '',
        date: dateTime,
        createdAt: dateTime,
        files: [],
        entryCurrency: formData.entryCurrency || 'EUR'
      };

      // Write to Google Sheets FIRST (primary database)
      try {
        const result = await addRecordToGoogleSheets(expenseToAdd, 'expense');
        if (!result.success) {
          // Show detailed error message
          const errorMsg = result.error || result.message || 'Failed to add to Google Sheets';
          console.error('Google Sheets error:', errorMsg);
          
          // Check if it's a configuration error
          if (errorMsg.includes('not configured') || errorMsg.includes('Google Script')) {
            alert('⚠️ Google Sheets Sync Not Set Up\n\n' +
              'To save records, you need to set up Google Apps Script:\n\n' +
              '1. Open: https://docs.google.com/spreadsheets/d/1Dp4UGkT8h-PHnEXDPbGqnnDxsvhP6zO_UvxXH4xXLu0/edit\n' +
              '2. Go to Extensions → Apps Script\n' +
              '3. Copy the script from SETUP_GOOGLE_SHEETS_NOW.md\n' +
              '4. Deploy as Web App\n' +
              '5. Add the URL to environment variables\n\n' +
              'For now, records will be stored locally only.');
            // Don't block - let them know but continue
            console.warn('Saving locally only - Google Sheets not configured');
          } else {
            alert('Failed to save to Google Sheets: ' + errorMsg);
            return;
          }
        } else {
          console.log('✅ Record added to Google Sheets');
        }
        
        // Save pending files if any (files still stored in IndexedDB for now)
        if (pendingFiles.length > 0) {
          const { saveFile } = await import('../utils/fileManager');
          for (const file of pendingFiles) {
            try {
              await saveFile(file, tempId, 'expense');
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
          originalAmount: '',
          description: '',
          entryCurrency: 'EUR',
          date: new Date().toISOString().split('T')[0],
          time: new Date().toTimeString().slice(0, 5)
        });
        
        // After successful write, fetch from Google Sheets to get latest data
        await loadExpenses();
      } catch (error) {
        console.error('Failed to add to Google Sheets:', error);
        if (!error.message || !error.message.includes('not configured')) {
          alert('Failed to save to Google Sheets: ' + (error.message || 'Unknown error'));
        }
        setLoading(false);
        return;
      } finally {
        setLoading(false);
      }
      
      // Trigger header stats update
      window.dispatchEvent(new Event('dataChanged'));
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
      // Get expense before deleting
      const expense = await db.expenses.get(id);
      if (!expense) {
        throw new Error('Expense not found');
      }
      
      // Delete from Google Sheets FIRST (primary database)
      try {
        const result = await deleteRecordFromGoogleSheets(id, 'expense');
        if (!result.success) {
          throw new Error(result.error || 'Failed to delete from Google Sheets');
        }
        console.log('✅ Record deleted from Google Sheets');
        
        // Delete associated files
        await deleteFilesForTransaction(id, 'expense');
        
        // After successful delete, fetch from Google Sheets to get latest data
        await loadExpenses();
      } catch (error) {
        console.error('Failed to delete from Google Sheets:', error);
        alert('Failed to delete from Google Sheets. Please check your connection and try again.');
        return;
      }
      
      window.dispatchEvent(new Event('dataChanged'));
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  const startEdit = (expense) => {
    setEditingId(expense.id);
    // Safely parse expense date
    let expenseDate;
    try {
      const dateStr = expense.date || expense.createdAt;
      if (dateStr) {
        expenseDate = new Date(dateStr);
        if (isNaN(expenseDate.getTime())) {
          expenseDate = new Date();
        }
      } else {
        expenseDate = new Date();
      }
    } catch (e) {
      expenseDate = new Date();
    }
    setFormData({
      category: expense.category || '',
      subcategory: expense.subcategory || '',
      amount: expense.amount || '',
      originalAmount: expense.originalAmount || expense.amount || '',
      description: expense.description || '',
      entryCurrency: expense.entryCurrency || 'EUR',
      date: expenseDate.toISOString().split('T')[0],
      time: expenseDate.toTimeString().slice(0, 5)
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({
      category: '',
      subcategory: '',
      amount: '',
      originalAmount: '',
      description: '',
      entryCurrency: 'EUR',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5)
    });
  };

  const updateExpense = async (e) => {
    e.preventDefault();
    if (!formData.category || !formData.amount) {
      alert('Please fill in category and amount');
      return;
    }

    try {
      // Combine date and time into ISO string
      // Safely parse date and time
      let dateTime;
      if (formData.date && formData.time) {
        try {
          const dateObj = new Date(`${formData.date}T${formData.time}`);
          if (!isNaN(dateObj.getTime())) {
            dateTime = dateObj.toISOString();
          } else {
            dateTime = new Date().toISOString();
          }
        } catch (e) {
          dateTime = new Date().toISOString();
        }
      } else {
        dateTime = new Date().toISOString();
      }
      
      // Update in Google Sheets
      try {
        const updatedExpense = {
          id: editingId,
          category: formData.category,
          subcategory: formData.subcategory || '',
          amount: parseFloat(formData.amount),
          description: formData.description || '',
          date: dateTime,
          createdAt: dateTime
        };
        await updateRecordInGoogleSheets(updatedExpense, 'expense');
        console.log('✅ Record updated in Google Sheets');
      } catch (error) {
        console.warn('Failed to update in Google Sheets:', error);
      }
      
      await db.expenses.update(editingId, {
        category: formData.category,
        subcategory: formData.subcategory || '',
        amount: parseFloat(formData.amount), // Stored in EUR
        originalAmount: formData.originalAmount || parseFloat(formData.amount), // Original entered amount
        description: formData.description || '',
        date: dateTime,
        entryCurrency: formData.entryCurrency || 'EUR'
      });
      setEditingId(null);
      setFormData({
        category: '',
        subcategory: '',
        amount: '',
        originalAmount: '',
        description: '',
        entryCurrency: 'EUR',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5)
      });
      await loadExpenses();
      // Trigger header stats update
      // Update in Google Sheets
      try {
        const updatedExpense = await db.expenses.get(editingId);
        if (updatedExpense) {
          await updateRecordInGoogleSheets(updatedExpense, 'expense');
          console.log('✅ Record updated in Google Sheets');
        }
      } catch (error) {
        console.warn('Failed to update in Google Sheets:', error);
      }
      
      window.dispatchEvent(new Event('dataChanged'));
    } catch (error) {
      console.error('Error updating expense:', error);
      alert('Error updating expense');
    }
  };


  const filteredExpenses = useMemo(() => {
    let filtered = expenses;
    
    // Filter by date range
    if (startDate || endDate) {
      filtered = filtered.filter(expense => {
        // Safely parse expense date
        let expenseDate;
        try {
          const dateStr = expense.date || expense.createdAt;
          if (dateStr) {
            expenseDate = new Date(dateStr);
            if (isNaN(expenseDate.getTime())) {
              expenseDate = new Date();
            }
          } else {
            expenseDate = new Date();
          }
        } catch (e) {
          expenseDate = new Date();
        }
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
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(expense => 
        (expense.category || '').toLowerCase().includes(query) ||
        (expense.subcategory || '').toLowerCase().includes(query) ||
        (expense.description || '').toLowerCase().includes(query) ||
        (expense.amount || 0).toString().includes(query)
      );
    }
    
    return filtered;
  }, [expenses, startDate, endDate, categoryFilter, searchQuery]);

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
      // Safely parse date
      let date;
      try {
        const dateStr = expense.date || expense.createdAt;
        if (dateStr) {
          date = new Date(dateStr);
          if (isNaN(date.getTime())) {
            date = new Date();
          }
        } else {
          date = new Date();
        }
      } catch (e) {
        date = new Date();
      }
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthly[monthKey]) {
        monthly[monthKey] = { month: monthKey, amount: 0 };
      }
      monthly[monthKey].amount += expense.amount || 0;
    });
    return Object.values(monthly).sort((a, b) => a.month.localeCompare(b.month));
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
          <div className={`expense-form-card ${editingId ? 'editing' : ''}`}>
            <h2>{editingId ? 'Edit Expense' : 'Add Expense'}</h2>
            <form onSubmit={editingId ? updateExpense : addExpense}>
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
              <AmountInput
                value={formData.amount}
                entryCurrency={formData.entryCurrency}
                onChange={(data) => {
                  setFormData({
                    ...formData,
                    amount: data.amount,
                    entryCurrency: data.entryCurrency,
                    originalAmount: data.originalAmount
                  });
                }}
                label="Amount"
                required={true}
              />
              <div className="form-group">
                <label>Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>
              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Time</label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    required
                  />
                </div>
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
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="submit-btn">
                  {editingId ? 'Update Expense' : 'Add Expense'}
                </button>
                {editingId && (
                  <button type="button" onClick={cancelEdit} className="cancel-btn" style={{
                    padding: '10px 20px',
                    background: '#e2e8f0',
                    color: '#475569',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    Cancel
                  </button>
                )}
              </div>
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
        <CompactControls
          viewType={expenseView}
          onViewChange={setExpenseView}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          categoryFilter={categoryFilter}
          onCategoryFilterChange={setCategoryFilter}
          categories={categories}
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onClearFilters={() => {
            setStartDate('');
            setEndDate('');
            setCategoryFilter('all');
            setSearchQuery('');
          }}
        />
        
        <TableView
          title={`All Expenses${(startDate || endDate || categoryFilter !== 'all' || searchQuery) ? ' (Filtered)' : ''}`}
          onRowDoubleClick={(row) => setSelectedRecordModal(row)}
          data={filteredExpenses
            .sort((a, b) => {
              // Safely parse dates for sorting
              const dateA = a.date || a.createdAt;
              const dateB = b.date || b.createdAt;
              try {
                const dateObjA = dateA ? new Date(dateA) : new Date(0);
                const dateObjB = dateB ? new Date(dateB) : new Date(0);
                return (isNaN(dateObjB.getTime()) ? 0 : dateObjB.getTime()) - (isNaN(dateObjA.getTime()) ? 0 : dateObjA.getTime());
              } catch (e) {
                return 0;
              }
            })
            .map(expense => {
              // Safely parse dates for display
              let displayDate;
              try {
                const dateStr = expense.date || expense.createdAt;
                if (dateStr) {
                  displayDate = new Date(dateStr);
                  if (isNaN(displayDate.getTime())) {
                    displayDate = new Date();
                  }
                } else {
                  displayDate = new Date();
                }
              } catch (e) {
                displayDate = new Date();
              }
              
              return {
                ...expense,
                formattedDate: displayDate.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                }),
                formattedTime: displayDate.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit'
                })
              };
            })}
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
                    title="Edit expense"
                  >
                    <Edit2 size={14} />
                  </button>
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
          showBulkDelete={true}
          onBulkDelete={async (ids) => {
            if (window.confirm(`Delete ${ids.length} selected expense(s)?`)) {
              try {
                for (const id of ids) {
                  await deleteFilesForTransaction(id, 'expense');
                  await db.expenses.delete(id);
                }
                await loadExpenses();
                window.dispatchEvent(new Event('dataChanged'));
              } catch (error) {
                console.error('Error deleting expenses:', error);
                alert('Error deleting some expenses');
              }
            }
          }}
          chartContent={
            expenseView === 'chart' ? (
              <div className="expense-charts-in-table">
                <div className="chart-card">
                  <h3>Expenses by Category</h3>
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={120}
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
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={monthlyExpenseData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatAmount(value)} />
                      <Line type="monotone" dataKey="amount" stroke="#ef4444" strokeWidth={3} />
                    </LineChart>
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

      {selectedRecordModal && (
        <RecordModal
          record={selectedRecordModal}
          recordType="Expense"
          onClose={() => setSelectedRecordModal(null)}
          onUpdate={async (updatedData) => {
            try {
              await db.expenses.update(selectedRecordModal.id, updatedData);
              await loadExpenses();
              
              // Update in Google Sheets
              try {
                const updatedExpense = await db.expenses.get(selectedRecordModal.id);
                if (updatedExpense) {
                  await updateRecordInGoogleSheets(updatedExpense, 'expense');
                  console.log('✅ Record updated in Google Sheets');
                }
              } catch (error) {
                console.warn('Failed to update in Google Sheets:', error);
              }
              
              setSelectedRecordModal(null);
              window.dispatchEvent(new Event('dataChanged'));
            } catch (error) {
              console.error('Error updating expense:', error);
              alert('Error updating expense');
            }
          }}
          onDelete={async (id) => {
            try {
              await deleteFilesForTransaction(id, 'expense');
              await db.expenses.delete(id);
              await loadExpenses();
              // Trigger header stats update
              window.dispatchEvent(new Event('dataChanged'));
            } catch (error) {
              console.error('Error deleting expense:', error);
            }
          }}
          formComponent={ExpenseModalForm}
          formatAmount={formatAmount}
        />
      )}
    </div>
  );
};

export default ExpenseCalculator;

