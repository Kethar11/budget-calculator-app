import React, { useState, useEffect } from 'react';
import { useCurrency } from '../contexts/CurrencyContext';
import AmountInput from './AmountInput';
import { File } from 'lucide-react';

/**
 * Expense Form Component for Modal (Read/Edit)
 */
const ExpenseModalForm = ({ record, onSave, onCancel, readOnly = false, formatAmount }) => {
  const [formData, setFormData] = useState({
    category: '',
    subcategory: '',
    amount: '',
    description: '',
    entryCurrency: 'EUR',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5)
  });

  useEffect(() => {
    if (record) {
      const recordDate = record.date ? new Date(record.date) : new Date(record.createdAt);
      setFormData({
        category: record.category || '',
        subcategory: record.subcategory || '',
        amount: record.amount || '',
        description: record.description || '',
        entryCurrency: record.entryCurrency || 'EUR',
        date: recordDate.toISOString().split('T')[0],
        time: recordDate.toTimeString().slice(0, 5)
      });
    }
  }, [record]);

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
    'Fixed Expenses': ['Rent', 'Electricity', 'Water', 'Internet', 'Phone/Internet', 'House Insurance', 'Groceries'],
    'Food': ['Groceries', 'Food Outside', 'Restaurant', 'Takeaway', 'Coffee/Tea', 'Snacks'],
    'Transport': ['Public Transport', 'Taxi/Uber', 'Fuel', 'Car Maintenance', 'Parking', 'Bike/Scooter'],
    'Lifestyle': ['Movie', 'Entertainment', 'Fitness/Badminton', 'Gym/Basic Fit', 'Hobbies', 'Temu', 'Subscriptions'],
    'Shopping': ['Dress/Clothing', 'Tools', 'Electronics', 'Home & Kitchen', 'Books', 'Beauty & Personal Care', 'Sports & Outdoors', 'Accessories', 'Other Shopping'],
    'Travel': ['Flight', 'Hotel', 'Train', 'Food & Dining', 'Activities', 'Shopping', 'Other Travel'],
    'Donation': ['Charity', 'Religious', 'Education', 'Medical', 'Other Donation'],
    'Savings & Investments': ['Savings Deposit', 'Investment', 'Emergency Fund'],
    'Send Money to Parents': [],
    'Other': []
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSave) {
      // Combine date and time into ISO string
      const dateTime = formData.date && formData.time 
        ? new Date(`${formData.date}T${formData.time}`).toISOString()
        : new Date().toISOString();
      
      onSave({
        ...formData,
        amount: parseFloat(formData.amount),
        date: dateTime
      });
    }
  };

  if (readOnly) {
    const date = record.date ? new Date(record.date) : new Date(record.createdAt);
    return (
      <div className="record-view-mode">
        <div className="record-field">
          <span className="record-field-label">Category</span>
          <span className="record-field-value">{record.category || 'N/A'}</span>
        </div>
        {record.subcategory && (
          <div className="record-field">
            <span className="record-field-label">Subcategory</span>
            <span className="record-field-value">{record.subcategory}</span>
          </div>
        )}
        <div className="record-field">
          <span className="record-field-label">Amount</span>
          <span className="record-field-value amount">{formatAmount(record.amount)}</span>
        </div>
        <div className="record-field">
          <span className="record-field-label">Description</span>
          <span className="record-field-value">{record.description || 'No description'}</span>
        </div>
        <div className="record-field">
          <span className="record-field-label">Date</span>
          <span className="record-field-value">{date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</span>
        </div>
        <div className="record-field">
          <span className="record-field-label">Time</span>
          <span className="record-field-value">{date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}</span>
        </div>
        {record.entryCurrency && (
          <div className="record-field">
            <span className="record-field-label">Entry Currency</span>
            <span className="record-field-value">{record.entryCurrency}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="modal-form">
      <div className="form-group">
        <label>Category *</label>
        <select
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value, subcategory: '' })}
          required
          disabled={readOnly}
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
            disabled={readOnly}
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
            entryCurrency: data.entryCurrency
          });
        }}
        label="Amount"
        required={true}
      />

      <div className="form-group">
        <label>Description *</label>
        <input
          type="text"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
          disabled={readOnly}
        />
      </div>

      <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
        <div className="form-group">
          <label>Date *</label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
            disabled={readOnly}
          />
        </div>
        <div className="form-group">
          <label>Time *</label>
          <input
            type="time"
            value={formData.time}
            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
            required
            disabled={readOnly}
          />
        </div>
      </div>

      <div className="modal-form-actions">
        <button type="submit" className="submit-btn">
          Update Expense
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

export default ExpenseModalForm;

