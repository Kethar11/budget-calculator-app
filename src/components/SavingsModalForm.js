import React, { useState, useEffect } from 'react';
import AmountInput from './AmountInput';

/**
 * Savings Form Component for Modal (Read/Edit)
 */
const SavingsModalForm = ({ record, onSave, onCancel, readOnly = false, formatAmount }) => {
  const [formData, setFormData] = useState({
    accountType: '',
    amount: '',
    date: '',
    maturityDate: '',
    interestRate: '',
    description: '',
    entryCurrency: 'EUR'
  });

  useEffect(() => {
    if (record) {
      setFormData({
        accountType: record.accountType || '',
        amount: record.amount || '',
        date: record.date ? new Date(record.date).toISOString().split('T')[0] : '',
        maturityDate: record.maturityDate ? new Date(record.maturityDate).toISOString().split('T')[0] : '',
        interestRate: record.interestRate || '',
        description: record.description || '',
        entryCurrency: record.entryCurrency || 'EUR'
      });
    }
  }, [record]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSave) {
      onSave({
        ...formData,
        amount: parseFloat(formData.amount),
        interestRate: parseFloat(formData.interestRate) || 0
      });
    }
  };

  if (readOnly) {
    return (
      <div className="record-view-mode">
        <div className="record-field">
          <span className="record-field-label">Account Type</span>
          <span className="record-field-value">{record.accountType || 'N/A'}</span>
        </div>
        <div className="record-field">
          <span className="record-field-label">Amount</span>
          <span className="record-field-value amount">{formatAmount(record.amount)}</span>
        </div>
        <div className="record-field">
          <span className="record-field-label">Deposit Date</span>
          <span className="record-field-value">
            {record.date ? new Date(record.date).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            }) : 'N/A'}
          </span>
        </div>
        {record.maturityDate && (
          <div className="record-field">
            <span className="record-field-label">Maturity Date</span>
            <span className="record-field-value">
              {new Date(record.maturityDate).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
          </div>
        )}
        {record.interestRate && (
          <div className="record-field">
            <span className="record-field-label">Interest Rate</span>
            <span className="record-field-value">{record.interestRate}%</span>
          </div>
        )}
        {record.description && (
          <div className="record-field">
            <span className="record-field-label">Description</span>
            <span className="record-field-value">{record.description}</span>
          </div>
        )}
        {record.entryCurrency && (
          <div className="record-field">
            <span className="record-field-label">Entry Currency</span>
            <span className="record-field-value">{record.entryCurrency}</span>
          </div>
        )}
      </div>
    );
  }

  const accountTypes = ['Livret A', 'Fixed Deposit', 'PPF (India)', 'Savings Account', 'Investment Account', 'Other'];

  return (
    <form onSubmit={handleSubmit} className="modal-form">
      <div className="form-group">
        <label>Account Type *</label>
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
        <label>Date of Deposit *</label>
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

      <div className="modal-form-actions">
        <button type="submit" className="submit-btn">
          Update Savings
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="cancel-btn">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

export default SavingsModalForm;



