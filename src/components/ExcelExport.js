import React, { useState, useEffect } from 'react';
import { Download, Upload, RefreshCw, FileSpreadsheet, Cloud, CheckCircle, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { db } from '../utils/database';
import './ExcelExport.css';

const ExcelExport = ({ transactions }) => {
  const [expenses, setExpenses] = useState([]);
  const [savings, setSavings] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const allExpenses = await db.expenses.toArray();
      const allSavings = await db.savings.toArray();
      const allBudgets = await db.budgets.toArray();
      setExpenses(allExpenses);
      setSavings(allSavings);
      setBudgets(allBudgets);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();

    // Transactions Sheet
    if (transactions && transactions.length > 0) {
      const transactionsData = transactions.map(t => ({
        'ID': t.id || '',
        'Date': t.date ? new Date(t.date).toLocaleDateString() : new Date(t.createdAt).toLocaleDateString(),
        'Time': t.date ? new Date(t.date).toLocaleTimeString() : new Date(t.createdAt).toLocaleTimeString(),
        'Type': t.type ? t.type.charAt(0).toUpperCase() + t.type.slice(1) : '',
        'Category': t.category || '',
        'Subcategory': t.subcategory || '',
        'Amount': t.amount || 0,
        'Description': t.description || '',
        'Created At': t.createdAt ? new Date(t.createdAt).toLocaleString() : ''
      }));
      const ws1 = XLSX.utils.json_to_sheet(transactionsData);
      XLSX.utils.book_append_sheet(wb, ws1, 'Transactions');
    }

    // Expenses Sheet
    if (expenses && expenses.length > 0) {
      const expensesData = expenses.map(e => ({
        'ID': e.id || '',
        'Date': e.date ? new Date(e.date).toLocaleDateString() : new Date(e.createdAt).toLocaleDateString(),
        'Time': e.date ? new Date(e.date).toLocaleTimeString() : new Date(e.createdAt).toLocaleTimeString(),
        'Category': e.category || '',
        'Subcategory': e.subcategory || '',
        'Amount': e.amount || 0,
        'Description': e.description || '',
        'Created At': e.createdAt ? new Date(e.createdAt).toLocaleString() : ''
      }));
      const ws2 = XLSX.utils.json_to_sheet(expensesData);
      XLSX.utils.book_append_sheet(wb, ws2, 'Expenses');
    }

    // Savings Sheet
    if (savings && savings.length > 0) {
      const savingsData = savings.map(s => ({
        'ID': s.id || '',
        'Date': s.date ? new Date(s.date).toLocaleDateString() : new Date(s.createdAt).toLocaleDateString(),
        'Time': s.date ? new Date(s.date).toLocaleTimeString() : new Date(s.createdAt).toLocaleTimeString(),
        'Account Type': s.accountType || '',
        'Amount': s.amount || 0,
        'Maturity Date': s.maturityDate || '',
        'Interest Rate': s.interestRate || '',
        'Description': s.description || '',
        'Created At': s.createdAt ? new Date(s.createdAt).toLocaleString() : ''
      }));
      const ws3 = XLSX.utils.json_to_sheet(savingsData);
      XLSX.utils.book_append_sheet(wb, ws3, 'Savings');
    }

    // Budgets Sheet
    if (budgets && budgets.length > 0) {
      const budgetsData = budgets.map(b => ({
        'ID': b.id || '',
        'Category': b.category || '',
        'Monthly Limit': b.monthlyLimit || 0,
        'Description': b.description || '',
        'Created At': b.createdAt ? new Date(b.createdAt).toLocaleString() : ''
      }));
      const ws4 = XLSX.utils.json_to_sheet(budgetsData);
      XLSX.utils.book_append_sheet(wb, ws4, 'Budgets');
    }

    // Summary Sheet
    const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + (t.amount || 0), 0);
    const expenseTotal = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + (t.amount || 0), 0);
    const expenseRecords = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const savingsTotal = savings.reduce((sum, s) => sum + (s.amount || 0), 0);
    const balance = income - expenseTotal;

    const summaryData = [
      { 'Metric': 'Total Income', 'Value': `€${income.toFixed(2)}`, 'Last Updated': new Date().toLocaleString() },
      { 'Metric': 'Total Expenses (Transactions)', 'Value': `€${expenseTotal.toFixed(2)}`, 'Last Updated': new Date().toLocaleString() },
      { 'Metric': 'Total Expenses (Records)', 'Value': `€${expenseRecords.toFixed(2)}`, 'Last Updated': new Date().toLocaleString() },
      { 'Metric': 'Total Savings', 'Value': `€${savingsTotal.toFixed(2)}`, 'Last Updated': new Date().toLocaleString() },
      { 'Metric': 'Current Balance', 'Value': `€${balance.toFixed(2)}`, 'Last Updated': new Date().toLocaleString() },
      { 'Metric': 'Total Transactions', 'Value': transactions.length, 'Last Updated': new Date().toLocaleString() },
      { 'Metric': 'Total Expense Records', 'Value': expenses.length, 'Last Updated': new Date().toLocaleString() },
      { 'Metric': 'Total Savings Records', 'Value': savings.length, 'Last Updated': new Date().toLocaleString() },
      { 'Metric': 'Total Budgets Set', 'Value': budgets.length, 'Last Updated': new Date().toLocaleString() }
    ];
    const ws5 = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, ws5, 'Summary');

    // Download
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Budget_Calculator_Complete_Data_${new Date().toISOString().split('T')[0]}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const syncToGoogleSheets = async () => {
    setSyncing(true);
    setSyncStatus(null);
    
    try {
      const response = await fetch('http://localhost:8000/api/google-sheets/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      if (result.status === 'success') {
        setSyncStatus({ type: 'success', message: result.message, url: result.spreadsheet_url });
      } else {
        setSyncStatus({ type: 'error', message: result.message });
      }
    } catch (error) {
      setSyncStatus({ type: 'error', message: 'Failed to sync to Google Sheets. Make sure backend is running and Google Sheets is configured.' });
    } finally {
      setSyncing(false);
    }
  };

  const downloadFromBackend = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/excel/download');
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `budget_data_${new Date().toISOString().split('T')[0]}.xlsx`;
        link.click();
        URL.revokeObjectURL(url);
      } else {
        alert('Failed to download Excel file from backend');
      }
    } catch (error) {
      alert('Error downloading Excel file. Make sure backend is running.');
    }
  };

  return (
    <div className="excel-export-card">
      <h2>
        <FileSpreadsheet size={20} className="icon-inline" />
        Excel & Google Sheets Operations
      </h2>
      
      <div className="excel-buttons">
        <button onClick={exportToExcel} className="excel-btn export-btn">
          <Download size={18} className="icon-inline" />
          Export All Data to Excel
        </button>
        
        <button onClick={downloadFromBackend} className="excel-btn download-btn">
          <Download size={18} className="icon-inline" />
          Download from Backend
        </button>
        
        <button 
          onClick={syncToGoogleSheets} 
          className="excel-btn sync-btn"
          disabled={syncing}
        >
          {syncing ? (
            <RefreshCw size={18} className="icon-inline spinning" />
          ) : (
            <Cloud size={18} className="icon-inline" />
          )}
          {syncing ? 'Syncing...' : 'Sync to Google Sheets'}
        </button>
      </div>

      {syncStatus && (
        <div className={`sync-status ${syncStatus.type}`}>
          {syncStatus.type === 'success' ? (
            <CheckCircle size={16} />
          ) : (
            <AlertCircle size={16} />
          )}
          <span>{syncStatus.message}</span>
          {syncStatus.url && (
            <a href={syncStatus.url} target="_blank" rel="noopener noreferrer" className="sheet-link">
              Open Google Sheet
            </a>
          )}
        </div>
      )}

      <div className="excel-info">
        <p className="excel-hint">
          <strong>Export All Data:</strong> Downloads a comprehensive Excel file with all your transactions, expenses, savings, and budgets in separate sheets.
        </p>
        <p className="excel-hint">
          <strong>Download from Backend:</strong> Downloads the Excel file that the backend uses as primary storage (readable format).
        </p>
        <p className="excel-hint">
          <strong>Sync to Google Sheets:</strong> Automatically syncs all your data to Google Sheets for cloud backup and collaboration. Configure Google Sheets credentials in backend.
        </p>
      </div>
    </div>
  );
};

export default ExcelExport;

