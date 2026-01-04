import React, { useState, useEffect } from 'react';
import { Calendar, Clock, X } from 'lucide-react';
import './BudgetForm.css';

const BudgetForm = ({ onAdd, editingTransaction, onCancel }) => {
  const [formData, setFormData] = useState({
    type: 'expense',
    category: '',
    subcategory: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5)
  });

  useEffect(() => {
    if (editingTransaction) {
      const date = new Date(editingTransaction.date || editingTransaction.createdAt);
      setFormData({
        type: editingTransaction.type || 'expense',
        category: editingTransaction.category || '',
        subcategory: editingTransaction.subcategory || '',
        amount: editingTransaction.amount || '',
        description: editingTransaction.description || '',
        date: date.toISOString().split('T')[0],
        time: date.toTimeString().slice(0, 5)
      });
    } else {
      setFormData({
        type: 'expense',
        category: '',
        subcategory: '',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5)
      });
    }
  }, [editingTransaction]);

  const categories = {
    income: ['Salary', 'Freelance', 'Investment', 'Bonus', 'Rental Income', 'Other'],
    expense: [
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
    ]
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.category || !formData.amount || !formData.description) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const dateTime = new Date(`${formData.date}T${formData.time}`);
      await onAdd({
        ...formData,
        amount: parseFloat(formData.amount),
        date: dateTime.toISOString()
      });
      if (!editingTransaction) {
        setFormData({
          type: 'expense',
          category: '',
          subcategory: '',
          amount: '',
          description: '',
          date: new Date().toISOString().split('T')[0],
          time: new Date().toTimeString().slice(0, 5)
        });
      }
    } catch (error) {
      alert(editingTransaction ? 'Error updating transaction' : 'Error adding transaction');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'type' ? { category: '' } : {})
    }));
  };

  return (
    <div className={`budget-form-card ${editingTransaction ? 'editing' : ''}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>{editingTransaction ? 'Edit Transaction' : 'Add Transaction'}</h2>
        {editingTransaction && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '8px 12px',
              background: '#e2e8f0',
              color: '#475569',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '14px'
            }}
          >
            <X size={16} />
            Cancel
          </button>
        )}
      </div>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Type</label>
          <div className="radio-group">
            <label className="radio-label">
              <input
                type="radio"
                name="type"
                value="income"
                checked={formData.type === 'income'}
                onChange={handleChange}
              />
              <span>Income</span>
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="type"
                value="expense"
                checked={formData.type === 'expense'}
                onChange={handleChange}
              />
              <span>Expense</span>
            </label>
          </div>
        </div>

        <div className="form-group">
          <label>Category</label>
          <select
            name="category"
            value={formData.category}
            onChange={(e) => {
              handleChange(e);
              setFormData(prev => ({ ...prev, subcategory: '' }));
            }}
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
              name="subcategory"
              value={formData.subcategory || ''}
              onChange={handleChange}
            >
              <option value="">Select subcategory (optional)</option>
              {subcategories[formData.category].map(subcat => (
                <option key={subcat} value={subcat}>{subcat}</option>
              ))}
            </select>
          </div>
        )}


        <div className="form-group">
          <label>Amount</label>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            step="0.01"
            min="0"
            required
          />
        </div>

        <div className="form-group">
          <label>
            <Calendar size={16} className="icon-inline" />
            Date
          </label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>
            <Clock size={16} className="icon-inline" />
            Time
          </label>
          <input
            type="time"
            name="time"
            value={formData.time}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Description</label>
          <input
            type="text"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
          />
        </div>

        <button type="submit" className="submit-btn">
          {editingTransaction ? 'Update Transaction' : 'Add Transaction'}
        </button>
      </form>
    </div>
  );
};

export default BudgetForm;

