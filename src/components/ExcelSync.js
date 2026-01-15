import React, { useState } from 'react';
import { Download, Upload, RefreshCw, FileSpreadsheet, CheckCircle, AlertCircle, X } from 'lucide-react';
import { db } from '../utils/database';
import './ExcelSync.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

const ExcelSync = () => {
  const [syncing, setSyncing] = useState(false);
  const [status, setStatus] = useState(null);

  // Fetch data from Excel (backend)
  const fetchFromExcel = async () => {
    setSyncing(true);
    setStatus(null);
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/excel/all-data`);
      if (!response.ok) {
        throw new Error('Failed to fetch from Excel');
      }
      
      const data = await response.json();
      
      // Import transactions
      if (data.transactions && Array.isArray(data.transactions)) {
        for (const t of data.transactions) {
          try {
            const existing = await db.transactions.get(t.ID);
            if (!existing) {
              await db.transactions.add({
                id: t.ID,
                type: (t.Type || 'expense').toLowerCase(),
                category: t.Category || '',
                subcategory: t.Subcategory || '',
                amount: parseFloat(t.Amount) || 0,
                description: t.Description || '',
                date: t.Date || t['Created At'] || new Date().toISOString(),
                createdAt: t['Created At'] || new Date().toISOString(),
                files: []
              });
            }
          } catch (error) {
            console.error('Error importing transaction:', error);
          }
        }
      }

      // Import expenses
      if (data.expenses && Array.isArray(data.expenses)) {
        for (const e of data.expenses) {
          try {
            const existing = await db.expenses.get(e.ID);
            if (!existing) {
              await db.expenses.add({
                id: e.ID,
                category: e.Category || '',
                subcategory: e.Subcategory || '',
                amount: parseFloat(e.Amount) || 0,
                description: e.Description || '',
                date: e.Date || e['Created At'] || new Date().toISOString(),
                createdAt: e['Created At'] || new Date().toISOString(),
                files: []
              });
            }
          } catch (error) {
            console.error('Error importing expense:', error);
          }
        }
      }

      // Import savings
      if (data.savings && Array.isArray(data.savings)) {
        for (const s of data.savings) {
          try {
            const existing = await db.savings.get(s.ID);
            if (!existing) {
              await db.savings.add({
                id: s.ID,
                accountType: s['Account Type'] || s.accountType || '',
                amount: parseFloat(s.Amount) || 0,
                date: s.Date || s['Deposit Date'] || new Date().toISOString(),
                maturityDate: s['Maturity Date'] || s.maturityDate || '',
                interestRate: parseFloat(s['Interest Rate'] || s.interestRate || 0),
                description: s.Description || '',
                createdAt: s['Created At'] || new Date().toISOString(),
                files: []
              });
            }
          } catch (error) {
            console.error('Error importing saving:', error);
          }
        }
      }

      setStatus({ type: 'success', message: 'Data fetched from Excel successfully!' });
      window.dispatchEvent(new Event('dataChanged'));
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => setStatus(null), 3000);
    } catch (error) {
      console.error('Error fetching from Excel:', error);
      setStatus({ type: 'error', message: 'Failed to fetch from Excel. Make sure backend is running.' });
    } finally {
      setSyncing(false);
    }
  };

  // Update Excel with current data
  const updateExcel = async () => {
    setSyncing(true);
    setStatus(null);
    
    try {
      // Get all data from IndexedDB
      const transactions = await db.transactions.toArray();
      const expenses = await db.expenses.toArray();
      const savings = await db.savings.toArray();
      const budgets = await db.budgets.toArray();

      // Send to backend to update Excel
      const response = await fetch(`${BACKEND_URL}/api/excel/update-all`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactions: transactions.map(t => ({
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
          expenses: expenses.map(e => ({
            ID: e.id,
            Date: e.date ? new Date(e.date).toISOString().split('T')[0] : '',
            Time: e.date ? new Date(e.date).toTimeString().slice(0, 8) : '',
            Category: e.category || '',
            Subcategory: e.subcategory || '',
            Amount: e.amount || 0,
            Description: e.description || '',
            'Created At': e.createdAt || new Date().toISOString()
          })),
          savings: savings.map(s => ({
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
          budgets: budgets.map(b => ({
            ID: b.id,
            Category: b.category || '',
            'Monthly Limit': b.monthlyLimit || 0,
            Description: b.description || '',
            'Created At': b.createdAt || new Date().toISOString()
          }))
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update Excel');
      }

      const result = await response.json();
      setStatus({ type: 'success', message: 'Excel updated successfully!' });
      window.dispatchEvent(new Event('dataChanged'));
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => setStatus(null), 3000);
    } catch (error) {
      console.error('Error updating Excel:', error);
      setStatus({ type: 'error', message: 'Failed to update Excel. Make sure backend is running.' });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="excel-sync-container">
      <div className="excel-sync-header">
        <FileSpreadsheet size={20} />
        <span>Excel Sync</span>
      </div>
      
      <div className="excel-sync-buttons">
        <button
          className="excel-sync-btn fetch-btn"
          onClick={fetchFromExcel}
          disabled={syncing}
          title="Fetch data from Excel sheet"
        >
          <Download size={18} />
          {syncing ? 'Fetching...' : 'Fetch from Excel'}
        </button>
        
        <button
          className="excel-sync-btn update-btn"
          onClick={updateExcel}
          disabled={syncing}
          title="Update Excel sheet with current data"
        >
          <Upload size={18} />
          {syncing ? 'Updating...' : 'Update Excel'}
        </button>
      </div>

      {status && (
        <div className={`excel-sync-status ${status.type}`}>
          {status.type === 'success' ? (
            <CheckCircle size={16} />
          ) : (
            <AlertCircle size={16} />
          )}
          <span>{status.message}</span>
          <button
            className="status-close-btn"
            onClick={() => setStatus(null)}
            title="Close"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export default ExcelSync;

