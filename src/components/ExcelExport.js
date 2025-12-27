import React from 'react';
import { Download } from 'lucide-react';
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
      'Amount': t.amount
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

  return (
    <div className="excel-export-card">
      <h2>Excel Operations</h2>
      <div className="excel-buttons">
        <button onClick={exportToExcel} className="excel-btn export-btn">
          <Download size={18} className="icon-inline" />
          Export to Excel
        </button>
      </div>
      <p className="excel-hint">
        Export your transactions to Excel for external analysis
      </p>
    </div>
  );
};

export default ExcelExport;

