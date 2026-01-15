import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Trash2, Search, File, Edit2 } from 'lucide-react';
import { db } from '../utils/database';
import TableView from './TableView';
import DateRangePicker from './DateRangePicker';
import FileUpload from './FileUpload';
import FileLinksModal from './FileLinksModal';
import { getFilesForTransaction, deleteFilesForTransaction } from '../utils/fileManager';
import { useCurrency } from '../contexts/CurrencyContext';
import { writeToGoogleSheets } from '../utils/googleSheetsDirect';
// Removed Electron storage
import AmountInput from './AmountInput';
import RecordModal from './RecordModal';
import SavingsModalForm from './SavingsModalForm';
import * as XLSX from 'xlsx';
import './SavingsCalculator.css';

const SavingsCalculator = () => {
  const { formatAmount } = useCurrency();
  const [savings, setSavings] = useState([]);
  const [formData, setFormData] = useState({
    accountType: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    maturityDate: '',
    interestRate: '',
    description: '',
    entryCurrency: 'EUR'
  });
  const [loading, setLoading] = useState(true);
  const [savingsView, setSavingsView] = useState('list');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [accountTypeFilter, setAccountTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [savingsFiles, setSavingsFiles] = useState({});
  const [selectedFileModal, setSelectedFileModal] = useState(null); // { transactionId, files }
  const [editingId, setEditingId] = useState(null); // ID of savings being edited
  const [selectedRecordModal, setSelectedRecordModal] = useState(null);

  useEffect(() => {
    loadSavings();
  }, []);

  useEffect(() => {
    const loadFilesForAll = async () => {
      const filesMap = {};
      for (const saving of savings) {
        if (saving.id) {
          const files = await getFilesForTransaction(saving.id, 'savings');
          if (files.length > 0) {
            filesMap[saving.id] = files;
          }
        }
      }
      setSavingsFiles(filesMap);
    };
    if (savings.length > 0) {
      loadFilesForAll();
    }
  }, [savings]);

  const loadSavings = async () => {
    try {
      const allSavings = await db.savings.toArray();
      setSavings(allSavings);
    } catch (error) {
      console.error('Error loading savings:', error);
    } finally {
      setLoading(false);
    }
  };

  const addSavings = async (e) => {
    e.preventDefault();
    if (!formData.accountType || !formData.amount || !formData.date) {
      alert('Please fill in account type, amount, and date');
      return;
    }

    try {
      const savingId = await db.savings.add({
        ...formData,
        amount: parseFloat(formData.amount),
        interestRate: parseFloat(formData.interestRate) || 0,
        date: formData.date,
        maturityDate: formData.maturityDate || '',
        createdAt: new Date().toISOString(),
        files: [],
        entryCurrency: formData.entryCurrency || 'EUR'
      });
      setFormData({
        accountType: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        maturityDate: '',
        interestRate: '',
        description: ''
      });
      await loadSavings();
      
      // Auto-sync to Google Sheets (downloads Excel file)
      try {
        const allTransactions = await db.transactions.toArray();
        const allExpenses = await db.expenses.toArray();
        await writeToGoogleSheets(allTransactions, allExpenses);
        console.log('✅ Auto-synced to Google Sheets (Excel file downloaded)');
      } catch (excelError) {
        console.warn('Auto-sync to Google Sheets failed:', excelError);
      }
      
      // Trigger data change event
      window.dispatchEvent(new Event('dataChanged'));
      // Auto-sync to Electron storage
      // Removed Electron storage
    } catch (error) {
      console.error('Error adding savings:', error);
      alert('Error adding savings');
    }
  };

  const deleteSavings = async (id) => {
    try {
      // Delete associated files first
      await deleteFilesForTransaction(id, 'savings');
      // Then delete the savings entry
      await db.savings.delete(id);
      await loadSavings();
    } catch (error) {
      console.error('Error deleting savings:', error);
    }
  };

  const startEdit = (saving) => {
    setEditingId(saving.id);
    setFormData({
      accountType: saving.accountType || '',
      amount: saving.amount || '',
      date: saving.date ? new Date(saving.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      maturityDate: saving.maturityDate ? new Date(saving.maturityDate).toISOString().split('T')[0] : '',
      interestRate: saving.interestRate || '',
      description: saving.description || '',
      entryCurrency: saving.entryCurrency || 'EUR'
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({
      accountType: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      maturityDate: '',
      interestRate: '',
      description: '',
      entryCurrency: 'EUR'
    });
  };

  const updateSavings = async (e) => {
    e.preventDefault();
    if (!formData.accountType || !formData.amount || !formData.date) {
      alert('Please fill in account type, amount, and date');
      return;
    }

    try {
      await db.savings.update(editingId, {
        ...formData,
        amount: parseFloat(formData.amount),
        interestRate: parseFloat(formData.interestRate) || 0,
        date: formData.date,
        maturityDate: formData.maturityDate || '',
        entryCurrency: formData.entryCurrency || 'EUR'
      });
      setEditingId(null);
      setFormData({
        accountType: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        maturityDate: '',
        interestRate: '',
        description: ''
      });
      await loadSavings();
      // Auto-sync to backend
      const updatedSaving = await db.savings.get(editingId);
      if (updatedSaving) {
        // Auto-sync to Google Sheets (downloads Excel file)
        try {
          const allTransactions = await db.transactions.toArray();
          const allExpenses = await db.expenses.toArray();
          await writeToGoogleSheets(allTransactions, allExpenses);
          console.log('✅ Auto-synced to Google Sheets (Excel file downloaded)');
        } catch (excelError) {
          console.warn('Auto-sync to Google Sheets failed:', excelError);
        }
        window.dispatchEvent(new Event('dataChanged'));
      }
    } catch (error) {
      console.error('Error updating savings:', error);
      alert('Error updating savings');
    }
  };

  const accountTypes = [
    'Livret A',
    'Fixed Deposit',
    'PPF (India)',
    'Senior Citizen Scheme',
    'Dad Savings',
    'Recurring Deposit',
    'Mutual Fund',
    'Other'
  ];

  const filteredSavings = useMemo(() => {
    let filtered = savings;
    
    // Filter by date range
    if (startDate || endDate) {
      filtered = filtered.filter(saving => {
        const savingDate = new Date(saving.date || saving.createdAt);
        const savingDateStr = savingDate.toISOString().split('T')[0];
        
        if (startDate && endDate) {
          return savingDateStr >= startDate && savingDateStr <= endDate;
        } else if (startDate) {
          return savingDateStr >= startDate;
        } else if (endDate) {
          return savingDateStr <= endDate;
        }
        return true;
      });
    }
    
    // Filter by account type
    if (accountTypeFilter !== 'all') {
      filtered = filtered.filter(saving => saving.accountType === accountTypeFilter);
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(saving => 
        (saving.accountType || '').toLowerCase().includes(query) ||
        (saving.description || '').toLowerCase().includes(query) ||
        (saving.amount || 0).toString().includes(query)
      );
    }
    
    return filtered;
  }, [savings, startDate, endDate, accountTypeFilter, searchQuery]);

  const totalSavings = useMemo(() => {
    return filteredSavings.reduce((sum, s) => sum + (s.amount || 0), 0);
  }, [filteredSavings]);

  const savingsByAccount = useMemo(() => {
    const accounts = {};
    filteredSavings.forEach(saving => {
      const account = saving.accountType || 'Other';
      accounts[account] = (accounts[account] || 0) + (saving.amount || 0);
    });
    return Object.entries(accounts).map(([name, value]) => ({
      name,
      value: parseFloat(value.toFixed(2))
    })).sort((a, b) => b.value - a.value);
  }, [filteredSavings]);

  const monthlySavingsData = useMemo(() => {
    const monthly = {};
    filteredSavings.forEach(saving => {
      const date = new Date(saving.date || saving.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthly[monthKey]) {
        monthly[monthKey] = { month: monthKey, amount: 0 };
      }
      monthly[monthKey].amount += saving.amount || 0;
    });
    return Object.values(monthly).sort((a, b) => a.month.localeCompare(b.month));
  }, [filteredSavings]);

  // Removed unused exportToExcel function - using ExcelSync component instead

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="savings-calculator">
      <div className="savings-grid">
        <div className="savings-form-section">
          <div className={`savings-form-card ${editingId ? 'editing' : ''}`}>
            <h2>{editingId ? 'Edit Savings' : 'Add Savings'}</h2>
            <form onSubmit={editingId ? updateSavings : addSavings}>
              <div className="form-group">
                <label>Account Type</label>
                <select
                  value={formData.accountType}
                  onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
                  required
                >
                  <option value="">Select account type</option>
                  {accountTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <AmountInput
                value={formData.amount}
                entryCurrency={formData.entryCurrency}
                onChange={(data) => {
                  setFormData({
                    ...formData,
                    amount: data.amount,
                    entryCurrency: data.entryCurrency
                  });
                }}
                label="Amount"
                required={true}
              />
              <div className="form-group">
                <label>Date of Deposit</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Maturity Date (Optional)</label>
                <input
                  type="date"
                  value={formData.maturityDate}
                  onChange={(e) => setFormData({ ...formData, maturityDate: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Interest Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.interestRate}
                  onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                  placeholder="e.g., 3.5"
                />
              </div>
              <div className="form-group">
                <label>Description (Optional)</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g., Dad's savings account"
                />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="submit-btn">
                  {editingId ? 'Update Savings' : 'Add Savings'}
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

        <div className="savings-summary-section">
          <div className="savings-summary-card">
            <h2>Savings Summary</h2>
            <div className="summary-stats">
              <div className="stat-item">
                <div className="stat-label">Total Savings</div>
                <div className="stat-value positive">{formatAmount(totalSavings)}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Number of Deposits</div>
                <div className="stat-value">{filteredSavings.length}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Average Deposit</div>
                <div className="stat-value">
                  {formatAmount(filteredSavings.length > 0 ? (totalSavings / filteredSavings.length) : 0)}
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Top Account Type</div>
                <div className="stat-value">
                  {savingsByAccount.length > 0 ? savingsByAccount[0].name : 'N/A'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="savings-list-section">
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
        
        <div className="savings-filters">
          <div className="filter-row">
            <div className="filter-group">
              <label>Search</label>
              <div className="search-input-wrapper">
                <Search size={18} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search by account type, description, or amount..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>
            </div>
            <div className="filter-group">
              <label>Filter by Account Type</label>
              <select
                value={accountTypeFilter}
                onChange={(e) => setAccountTypeFilter(e.target.value)}
                className="account-filter-select"
              >
                <option value="all">All Account Types</option>
                {accountTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="quick-filter-buttons">
            <button
              className={`quick-filter-btn ${accountTypeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setAccountTypeFilter('all')}
            >
              All
            </button>
            {accountTypes.slice(0, 4).map(type => (
              <button
                key={type}
                className={`quick-filter-btn ${accountTypeFilter === type ? 'active' : ''}`}
                onClick={() => setAccountTypeFilter(type)}
              >
                {type}
              </button>
            ))}
            {(startDate || endDate || accountTypeFilter !== 'all' || searchQuery) && (
              <button
                className="clear-filters-btn"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setAccountTypeFilter('all');
                  setSearchQuery('');
                }}
              >
                Clear All Filters
              </button>
            )}
          </div>
        </div>
        
        <TableView
          title={`Your Savings${(startDate || endDate || accountTypeFilter !== 'all' || searchQuery) ? ' (Filtered)' : ''}`}
          onRowDoubleClick={(row) => setSelectedRecordModal(row)}
          data={filteredSavings
            .sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt))
            .map(saving => ({
              ...saving,
              formattedDate: new Date(saving.date || saving.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              }),
              formattedMaturityDate: saving.maturityDate ? new Date(saving.maturityDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              }) : 'N/A'
            }))}
          columns={[
            { key: 'accountType', header: 'Account Type' },
            { key: 'id', header: 'Files', render: (val) => {
              const files = savingsFiles[val] || [];
              if (files.length === 0) return <span style={{ color: '#94a3b8' }}>No files</span>;
              return (
                <button
                  onClick={() => setSelectedFileModal({ transactionId: val, files, transactionType: 'savings' })}
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
            { key: 'amount', header: 'Amount', render: (val) => formatAmount(val) },
            { key: 'formattedDate', header: 'Deposit Date' },
            { key: 'formattedMaturityDate', header: 'Maturity Date' },
            { key: 'interestRate', header: 'Interest (%)', render: (val) => val ? `${val}%` : 'N/A' },
            { key: 'description', header: 'Description', render: (val) => val || 'N/A' },
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
                    title="Edit savings"
                  >
                    <Edit2 size={14} />
                  </button>
                  <FileUpload
                    transactionId={val}
                    transactionType="savings"
                    onFilesChange={async () => {
                      const files = await getFilesForTransaction(val, 'savings');
                      setSavingsFiles(prev => ({ ...prev, [val]: files }));
                    }}
                    existingFiles={savingsFiles[val] || []}
                    compact={true}
                  />
                  <button
                    className="delete-btn-table"
                    onClick={() => {
                      if (window.confirm('Delete this savings deposit?')) {
                        deleteSavings(val);
                      }
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )
            }
          ]}
          viewType={savingsView}
          onViewChange={setSavingsView}
          emptyMessage="No savings deposits yet. Add one above!"
          showBulkDelete={true}
          onBulkDelete={async (ids) => {
            if (window.confirm(`Delete ${ids.length} selected savings deposit(s)?`)) {
              try {
                for (const id of ids) {
                  await deleteFilesForTransaction(id, 'savings');
                  await db.savings.delete(id);
                }
                await loadSavings();
                window.dispatchEvent(new Event('dataChanged'));
              } catch (error) {
                console.error('Error deleting savings:', error);
                alert('Error deleting some savings deposits');
              }
            }
          }}
          chartContent={
            savingsView === 'chart' && filteredSavings.length > 0 ? (
              <div className="savings-charts-in-table">
                <div className="chart-card">
                  <h3>Savings by Account Type</h3>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={savingsByAccount}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatAmount(value)} />
                      <Bar dataKey="value" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="chart-card">
                  <h3>Monthly Savings Trend</h3>
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={monthlySavingsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatAmount(value)} />
                      <Line type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={3} />
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
          transactionCategory={selectedFileModal.accountType}
          transactionDescription={selectedFileModal.description}
          onClose={() => setSelectedFileModal(null)}
        />
      )}

      {selectedRecordModal && (
        <RecordModal
          record={selectedRecordModal}
          recordType="Savings"
          onClose={() => setSelectedRecordModal(null)}
          onUpdate={async (updatedData) => {
            try {
              await db.savings.update(selectedRecordModal.id, updatedData);
              await loadSavings();
              const updatedSaving = await db.savings.get(selectedRecordModal.id);
              if (updatedSaving) {
                // Auto-sync to Google Sheets (downloads Excel file)
        try {
          const allTransactions = await db.transactions.toArray();
          const allExpenses = await db.expenses.toArray();
          await writeToGoogleSheets(allTransactions, allExpenses);
          console.log('✅ Auto-synced to Google Sheets (Excel file downloaded)');
        } catch (excelError) {
          console.warn('Auto-sync to Google Sheets failed:', excelError);
        }
        window.dispatchEvent(new Event('dataChanged'));
              }
              // Removed Electron storage
              setSelectedRecordModal(null);
            } catch (error) {
              console.error('Error updating savings:', error);
              alert('Error updating savings');
            }
          }}
          onDelete={async (id) => {
            try {
              await deleteFilesForTransaction(id, 'savings');
              await db.savings.delete(id);
              await loadSavings();
            } catch (error) {
              console.error('Error deleting savings:', error);
            }
          }}
          formComponent={SavingsModalForm}
          formatAmount={formatAmount}
        />
      )}
    </div>
  );
};

export default SavingsCalculator;
