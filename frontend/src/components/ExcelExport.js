import React from 'react';
import * as XLSX from 'xlsx';
import './ExcelExport.css';

const ExcelExport = ({ transactions }) => {
  const exportToExcel = () => {
    if (transactions.length === 0) {
      alert('No transactions to export');
      return;
    }

    const data = transactions.map(t => ({
      'Date': new Date(t.date || t.createdAt).toLocaleDateString(),
      'Type': t.type.charAt(0).toUpperCase() + t.type.slice(1),
      'Category': t.category,
      'Description': t.description,
      'Amount': t.amount,
      'Balance': transactions
        .filter(tr => new Date(tr.date || tr.createdAt) <= new Date(t.date || t.createdAt))
        .reduce((sum, tr) => {
          return sum + (tr.type === 'income' ? tr.amount : -tr.amount);
        }, 0)
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
    
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `budget_transactions_${new Date().toISOString().split('T')[0]}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importFromExcel = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Process imported data
        const importedTransactions = jsonData.map(row => ({
          type: (row.Type || '').toLowerCase() || 'expense',
          category: row.Category || 'Other',
          amount: parseFloat(row.Amount) || 0,
          description: row.Description || '',
          date: row.Date ? new Date(row.Date).toISOString() : new Date().toISOString()
        }));

        // Trigger import callback (you might want to add this to App.js)
        if (window.handleExcelImport) {
          window.handleExcelImport(importedTransactions);
        } else {
          alert(`Imported ${importedTransactions.length} transactions. Please add import handler in App.js`);
        }
      } catch (error) {
        console.error('Error importing Excel:', error);
        alert('Error importing Excel file. Please check the format.');
      }
    };
    reader.readAsArrayBuffer(file);
    event.target.value = ''; // Reset input
  };

  return (
    <div className="excel-export-card">
      <h2>Excel Operations</h2>
      <div className="excel-buttons">
        <button onClick={exportToExcel} className="excel-btn export-btn">
          📥 Export to Excel
        </button>
        <label className="excel-btn import-btn">
          📤 Import from Excel
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={importFromExcel}
            style={{ display: 'none' }}
          />
        </label>
      </div>
      <p className="excel-hint">
        Export your transactions or import from an Excel file
      </p>
    </div>
  );
};

export default ExcelExport;

