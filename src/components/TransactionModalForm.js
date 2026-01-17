import React, { useState, useEffect } from 'react';
import AmountInput from './AmountInput';
import { Calendar, Clock } from 'lucide-react';

/**
 * Transaction Form Component for Modal (Read/Edit)
 */
const TransactionModalForm = ({ record, onSave, onCancel, readOnly = false, formatAmount }) => {
  const [formData, setFormData] = useState({
    type: 'expense',
    category: '',
    subcategory: '',
    amount: '',
    description: '',
    date: '',
    time: '',
    entryCurrency: 'EUR'
  });

  useEffect(() => {
    if (record) {
      const date = new Date(record.date || record.createdAt);
      setFormData({
        type: record.type || 'expense',
        category: record.category || '',
        subcategory: record.subcategory || '',
        amount: record.amount || '',
        description: record.description || '',
        date: date.toISOString().split('T')[0],
        time: date.toTimeString().slice(0, 5),
        entryCurrency: record.entryCurrency || 'EUR'
      });
    }
  }, [record]);

  const categories = {
    income: ['Salary', 'Freelance', 'Investment', 'Bonus', 'Rental Income', 'Other'],
    expense: ['Fixed Expenses', 'Food', 'Transport', 'Lifestyle', 'Shopping', 'Travel', 'Donation', 'Savings & Investments', 'Send Money to Parents', 'Other']
  };

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
      const dateTime = new Date(`${formData.date}T${formData.time}`);
      onSave({
        ...formData,
        amount: parseFloat(formData.amount),
        date: dateTime.toISOString()
      });
    }
  };

  if (readOnly) {
    const date = record.date ? new Date(record.date) : new Date(record.createdAt);
    return (
      <div className="record-view-mode">
        <div className="record-field">
          <span className="record-field-label">Type</span>
          <span className={`record-field-value ${record.type === 'income' ? 'positive' : 'negative'}`}>
            {record.type ? record.type.charAt(0).toUpperCase() + record.type.slice(1) : 'N/A'}
          </span>
        </div>
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
          <span className={`record-field-value amount ${record.type === 'income' ? 'positive' : 'negative'}`}>
            {formatAmount(record.amount)}
          </span>
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
        <label>Type *</label>
        <div className="radio-group">
          <label className="radio-label">
            <input
              type="radio"
              name="type"
              value="income"
              checked={formData.type === 'income'}
              onChange={(e) => setFormData({ ...formData, type: e.target.value, category: '' })}
            />
            <span>Income</span>
          </label>
          <label className="radio-label">
            <input
              type="radio"
              name="type"
              value="expense"
              checked={formData.type === 'expense'}
              onChange={(e) => setFormData({ ...formData, type: e.target.value, category: '' })}
            />
            <span>Expense</span>
          </label>
        </div>
      </div>

      <div className="form-group">
        <label>Category *</label>
        <select
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value, subcategory: '' })}
          required
        >
          <option value="">Select category</option>
          {categories[formData.type].map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {formData.type === 'expense' && formData.category && subcategories[formData.category] && subcategories[formData.category].length > 0 && (
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
            entryCurrency: data.entryCurrency
          });
        }}
        label="Amount"
        required={true}
      />

      <div className="form-group">
        <label><Calendar size={16} className="icon-inline" /> Date *</label>
        <input
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          required
        />
      </div>

      <div className="form-group">
        <label><Clock size={16} className="icon-inline" /> Time *</label>
        <input
          type="time"
          value={formData.time}
          onChange={(e) => setFormData({ ...formData, time: e.target.value })}
          required
        />
      </div>

      <div className="form-group">
        <label>Description *</label>
        <input
          type="text"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
        />
      </div>

      <div className="modal-form-actions">
        <button type="submit" className="submit-btn">
          Update Transaction
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

export default TransactionModalForm;




