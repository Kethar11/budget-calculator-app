import React, { useState, useEffect } from 'react';
import { Download, FileSpreadsheet, FileText, Calendar, CheckSquare, X } from 'lucide-react';
import * as XLSX from 'xlsx';
import { db } from '../utils/database';
import { useCurrency } from '../contexts/CurrencyContext';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import './DataExport.css';

const DataExport = () => {
  const { formatAmount, currency } = useCurrency();
  const [showModal, setShowModal] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [exportOptions, setExportOptions] = useState({
    transactions: true,
    expenses: true,
    savings: true,
    goals: true,
    budgets: true,
    reminders: false,
    summary: true
  });
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    // Set default date range to last 3 months
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - 3);
    setEndDate(end.toISOString().split('T')[0]);
    setStartDate(start.toISOString().split('T')[0]);
  }, []);

  const filterByDateRange = (items, dateField = 'date') => {
    if (!startDate || !endDate) return items;
    return items.filter(item => {
      const itemDate = new Date(item[dateField] || item.createdAt);
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      return itemDate >= start && itemDate <= end;
    });
  };

  const exportToExcel = async () => {
    setExporting(true);
    try {
      const wb = XLSX.utils.book_new();
      
      // Load all data
      const allTransactions = await db.transactions.toArray();
      const allExpenses = await db.expenses.toArray();
      const allSavings = await db.savings.toArray();
      const allGoals = await db.goals.toArray();
      const allBudgets = await db.budgets.toArray();
      const allReminders = await db.reminders.toArray();

      // Filter by date range
      const transactions = filterByDateRange(allTransactions);
      const expenses = filterByDateRange(allExpenses);
      const savings = filterByDateRange(allSavings);
      const reminders = filterByDateRange(allReminders, 'reminderDate');

      // Summary Sheet
      if (exportOptions.summary) {
        const totalIncome = transactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + (t.amount || 0), 0);
        const totalExpenses = transactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + (t.amount || 0), 0);
        const totalSavingsAmount = savings.reduce((sum, s) => sum + (s.amount || 0), 0);
        const totalGoalsValue = allGoals.reduce((sum, g) => sum + (g.targetAmount || 0), 0);
        const totalGoalsSaved = allGoals.reduce((sum, g) => sum + (g.currentAmount || 0), 0);

        const summaryData = [
          ['Financial Summary', ''],
          ['Period', `${startDate || 'All Time'} to ${endDate || 'All Time'}`],
          ['', ''],
          ['Income', totalIncome],
          ['Expenses', totalExpenses],
          ['Net Balance', totalIncome - totalExpenses],
          ['', ''],
          ['Savings', totalSavingsAmount],
          ['Goals Target', totalGoalsValue],
          ['Goals Saved', totalGoalsSaved],
          ['Goals Remaining', totalGoalsValue - totalGoalsSaved],
          ['', ''],
          ['Currency', currency],
          ['Export Date', new Date().toLocaleString()]
        ];

        const ws = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, ws, 'Summary');
      }

      // Transactions Sheet
      if (exportOptions.transactions && transactions.length > 0) {
        const transactionData = transactions.map(t => ({
          'Date': new Date(t.date || t.createdAt).toLocaleDateString(),
          'Type': t.type === 'income' ? 'Income' : 'Expense',
          'Category': t.category || '',
          'Description': t.description || '',
          'Amount': t.amount || 0,
          'Currency': currency
        }));
        const ws = XLSX.utils.json_to_sheet(transactionData);
        XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
      }

      // Expenses Sheet
      if (exportOptions.expenses && expenses.length > 0) {
        const expenseData = expenses.map(e => ({
          'Date': new Date(e.date || e.createdAt).toLocaleDateString(),
          'Category': e.category || '',
          'Subcategory': e.subcategory || '',
          'Description': e.description || '',
          'Amount': e.amount || 0,
          'Currency': currency
        }));
        const ws = XLSX.utils.json_to_sheet(expenseData);
        XLSX.utils.book_append_sheet(wb, ws, 'Expenses');
      }

      // Savings Sheet
      if (exportOptions.savings && savings.length > 0) {
        const savingsData = savings.map(s => ({
          'Date': new Date(s.date || s.createdAt).toLocaleDateString(),
          'Account Type': s.accountType || '',
          'Amount': s.amount || 0,
          'Interest Rate': s.interestRate ? `${s.interestRate}%` : '',
          'Maturity Date': s.maturityDate ? new Date(s.maturityDate).toLocaleDateString() : '',
          'Description': s.description || '',
          'Currency': currency
        }));
        const ws = XLSX.utils.json_to_sheet(savingsData);
        XLSX.utils.book_append_sheet(wb, ws, 'Savings');
      }

      // Goals Sheet
      if (exportOptions.goals && allGoals.length > 0) {
        const goalsData = allGoals.map(g => ({
          'Name': g.name || '',
          'Category': g.category || '',
          'Target Amount': g.targetAmount || 0,
          'Current Amount': g.currentAmount || 0,
          'Remaining': (g.targetAmount || 0) - (g.currentAmount || 0),
          'Progress %': g.targetAmount > 0 ? ((g.currentAmount / g.targetAmount) * 100).toFixed(2) : 0,
          'Type': g.goalType || '',
          'Account': g.account || '',
          'Description': g.description || '',
          'Currency': currency
        }));
        const ws = XLSX.utils.json_to_sheet(goalsData);
        XLSX.utils.book_append_sheet(wb, ws, 'Goals');
      }

      // Budgets Sheet
      if (exportOptions.budgets && allBudgets.length > 0) {
        const budgetsData = allBudgets.map(b => ({
          'Category': b.category || '',
          'Monthly Limit': b.monthlyLimit || 0,
          'Description': b.description || '',
          'Currency': currency
        }));
        const ws = XLSX.utils.json_to_sheet(budgetsData);
        XLSX.utils.book_append_sheet(wb, ws, 'Budgets');
      }

      // Reminders Sheet
      if (exportOptions.reminders && reminders.length > 0) {
        const remindersData = reminders.map(r => ({
          'Title': r.title || '',
          'Description': r.description || '',
          'Date': r.reminderDate ? new Date(r.reminderDate).toLocaleDateString() : '',
          'Time': r.reminderTime || '',
          'Priority': r.priority || '',
          'Status': r.isCompleted ? 'Completed' : 'Active'
        }));
        const ws = XLSX.utils.json_to_sheet(remindersData);
        XLSX.utils.book_append_sheet(wb, ws, 'Reminders');
      }

      // Generate filename
      const dateStr = startDate && endDate 
        ? `${startDate}_to_${endDate}` 
        : 'all_time';
      const filename = `budget_report_${dateStr}_${new Date().toISOString().split('T')[0]}.xlsx`;

      // Write file
      XLSX.writeFile(wb, filename);
      setShowModal(false);
      alert('Excel file downloaded successfully!');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Error exporting to Excel. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const exportToPDF = async () => {
    setExporting(true);
    try {
      const doc = new jsPDF();
      let yPosition = 20;

      // Load all data
      const allTransactions = await db.transactions.toArray();
      const allExpenses = await db.expenses.toArray();
      const allSavings = await db.savings.toArray();
      const allGoals = await db.goals.toArray();
      const allBudgets = await db.budgets.toArray();
      const allReminders = await db.reminders.toArray();

      // Filter by date range
      const transactions = filterByDateRange(allTransactions);
      const expenses = filterByDateRange(allExpenses);
      const savings = filterByDateRange(allSavings);
      const reminders = filterByDateRange(allReminders, 'reminderDate');

      // Title
      doc.setFontSize(18);
      doc.text('Financial Report', 14, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      const periodText = startDate && endDate 
        ? `Period: ${startDate} to ${endDate}`
        : 'Period: All Time';
      doc.text(periodText, 14, yPosition);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, yPosition + 5);
      doc.text(`Currency: ${currency}`, 14, yPosition + 10);
      yPosition += 20;

      // Summary Section
      if (exportOptions.summary) {
        const totalIncome = transactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + (t.amount || 0), 0);
        const totalExpenses = transactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + (t.amount || 0), 0);
        const totalSavingsAmount = savings.reduce((sum, s) => sum + (s.amount || 0), 0);
        const totalGoalsValue = allGoals.reduce((sum, g) => sum + (g.targetAmount || 0), 0);
        const totalGoalsSaved = allGoals.reduce((sum, g) => sum + (g.currentAmount || 0), 0);

        doc.setFontSize(14);
        doc.text('Summary', 14, yPosition);
        yPosition += 8;

        const summaryData = [
          ['Total Income', formatAmount(totalIncome)],
          ['Total Expenses', formatAmount(totalExpenses)],
          ['Net Balance', formatAmount(totalIncome - totalExpenses)],
          ['Total Savings', formatAmount(totalSavingsAmount)],
          ['Goals Target', formatAmount(totalGoalsValue)],
          ['Goals Saved', formatAmount(totalGoalsSaved)],
          ['Goals Remaining', formatAmount(totalGoalsValue - totalGoalsSaved)]
        ];

        doc.autoTable({
          startY: yPosition,
          head: [['Item', 'Amount']],
          body: summaryData,
          theme: 'striped',
          headStyles: { fillColor: [102, 126, 234] }
        });
        yPosition = doc.lastAutoTable.finalY + 15;
      }

      // Transactions Table
      if (exportOptions.transactions && transactions.length > 0) {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
        doc.setFontSize(14);
        doc.text('Transactions', 14, yPosition);
        yPosition += 8;

        const transactionData = transactions.map(t => [
          new Date(t.date || t.createdAt).toLocaleDateString(),
          t.type === 'income' ? 'Income' : 'Expense',
          t.category || '',
          t.description || '',
          formatAmount(t.amount || 0)
        ]);

        doc.autoTable({
          startY: yPosition,
          head: [['Date', 'Type', 'Category', 'Description', 'Amount']],
          body: transactionData,
          theme: 'striped',
          headStyles: { fillColor: [102, 126, 234] }
        });
        yPosition = doc.lastAutoTable.finalY + 15;
      }

      // Expenses Table
      if (exportOptions.expenses && expenses.length > 0) {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
        doc.setFontSize(14);
        doc.text('Expenses', 14, yPosition);
        yPosition += 8;

        const expenseData = expenses.map(e => [
          new Date(e.date || e.createdAt).toLocaleDateString(),
          e.category || '',
          e.subcategory || '',
          e.description || '',
          formatAmount(e.amount || 0)
        ]);

        doc.autoTable({
          startY: yPosition,
          head: [['Date', 'Category', 'Subcategory', 'Description', 'Amount']],
          body: expenseData,
          theme: 'striped',
          headStyles: { fillColor: [102, 126, 234] }
        });
        yPosition = doc.lastAutoTable.finalY + 15;
      }

      // Savings Table
      if (exportOptions.savings && savings.length > 0) {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
        doc.setFontSize(14);
        doc.text('Savings', 14, yPosition);
        yPosition += 8;

        const savingsData = savings.map(s => [
          new Date(s.date || s.createdAt).toLocaleDateString(),
          s.accountType || '',
          formatAmount(s.amount || 0),
          s.interestRate ? `${s.interestRate}%` : '',
          s.maturityDate ? new Date(s.maturityDate).toLocaleDateString() : ''
        ]);

        doc.autoTable({
          startY: yPosition,
          head: [['Date', 'Account Type', 'Amount', 'Interest Rate', 'Maturity Date']],
          body: savingsData,
          theme: 'striped',
          headStyles: { fillColor: [102, 126, 234] }
        });
        yPosition = doc.lastAutoTable.finalY + 15;
      }

      // Goals Table
      if (exportOptions.goals && allGoals.length > 0) {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
        doc.setFontSize(14);
        doc.text('Goals', 14, yPosition);
        yPosition += 8;

        const goalsData = allGoals.map(g => [
          g.name || '',
          g.category || '',
          formatAmount(g.targetAmount || 0),
          formatAmount(g.currentAmount || 0),
          formatAmount((g.targetAmount || 0) - (g.currentAmount || 0)),
          g.targetAmount > 0 ? `${((g.currentAmount / g.targetAmount) * 100).toFixed(1)}%` : '0%'
        ]);

        doc.autoTable({
          startY: yPosition,
          head: [['Name', 'Category', 'Target', 'Saved', 'Remaining', 'Progress']],
          body: goalsData,
          theme: 'striped',
          headStyles: { fillColor: [102, 126, 234] }
        });
      }

      // Generate filename
      const dateStr = startDate && endDate 
        ? `${startDate}_to_${endDate}` 
        : 'all_time';
      const filename = `budget_report_${dateStr}_${new Date().toISOString().split('T')[0]}.pdf`;

      doc.save(filename);
      setShowModal(false);
      alert('PDF file downloaded successfully!');
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      alert('Error exporting to PDF. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const toggleOption = (option) => {
    setExportOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  return (
    <>
      <button 
        className="export-btn"
        onClick={() => setShowModal(true)}
        title="Export Data"
      >
        <Download size={18} />
        <span>Export</span>
      </button>

      {showModal && (
        <div className="export-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="export-modal" onClick={(e) => e.stopPropagation()}>
            <div className="export-modal-header">
              <h2>Export Financial Data</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="export-modal-body">
              <div className="export-section">
                <h3>
                  <Calendar size={18} />
                  Date Range
                </h3>
                <div className="date-range-inputs">
                  <div>
                    <label>Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label>End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
                <p className="hint">Leave empty for all time data</p>
              </div>

              <div className="export-section">
                <h3>
                  <CheckSquare size={18} />
                  Select Data to Export
                </h3>
                <div className="export-options">
                  {Object.entries(exportOptions).map(([key, value]) => (
                    <label key={key} className="export-option">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={() => toggleOption(key)}
                      />
                      <span>{key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="export-actions">
                <button
                  className="export-action-btn excel-btn"
                  onClick={exportToExcel}
                  disabled={exporting || !Object.values(exportOptions).some(v => v)}
                >
                  <FileSpreadsheet size={18} />
                  {exporting ? 'Exporting...' : 'Export to Excel'}
                </button>
                <button
                  className="export-action-btn pdf-btn"
                  onClick={exportToPDF}
                  disabled={exporting || !Object.values(exportOptions).some(v => v)}
                >
                  <FileText size={18} />
                  {exporting ? 'Exporting...' : 'Export to PDF'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DataExport;

