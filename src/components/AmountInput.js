import React, { useState, useEffect } from 'react';
import { useCurrency } from '../contexts/CurrencyContext';
import { convertToEUR, convertToINR } from '../utils/currency';
import './AmountInput.css';

/**
 * Amount Input Component with Currency Selector
 * - Default currency: EUR
 * - Allows selecting EUR or INR
 * - Converts INR to EUR when saving
 * - Displays converted amount preview
 */
const AmountInput = ({ value, onChange, label = 'Amount', required = true, showPreview = true, entryCurrency: propEntryCurrency }) => {
  const { eurToInrRate, currency: displayCurrency } = useCurrency();
  const [entryCurrency, setEntryCurrency] = useState(propEntryCurrency || 'EUR');
  const [amountValue, setAmountValue] = useState('');
  
  // Initialize amount value when component mounts or value changes
  useEffect(() => {
    if (value !== undefined && value !== null && value !== '') {
      // If we have a saved entryCurrency, use it to display the original amount
      if (propEntryCurrency === 'INR') {
        // Convert EUR back to INR for display
        const inrAmount = convertToINR(parseFloat(value), eurToInrRate);
        setAmountValue(inrAmount.toString());
        setEntryCurrency('INR');
      } else {
        setAmountValue(value.toString());
        setEntryCurrency('EUR');
      }
    } else {
      setAmountValue('');
      setEntryCurrency('EUR');
    }
  }, [value, propEntryCurrency, eurToInrRate]);

  const handleAmountChange = (e) => {
    const newValue = e.target.value;
    setAmountValue(newValue);
    
    // Convert to EUR if needed
    let eurAmount = parseFloat(newValue) || 0;
    if (entryCurrency === 'INR' && newValue) {
      eurAmount = convertToEUR(parseFloat(newValue), eurToInrRate);
    }
    
    // Call parent onChange with EUR amount and entry currency
    if (onChange) {
      onChange({
        amount: eurAmount,
        entryCurrency: entryCurrency,
        originalAmount: parseFloat(newValue) || 0
      });
    }
  };

  const handleCurrencyChange = (e) => {
    const newCurrency = e.target.value;
    setEntryCurrency(newCurrency);
    
    // Recalculate EUR amount
    let eurAmount = parseFloat(amountValue) || 0;
    if (newCurrency === 'INR' && amountValue) {
      eurAmount = convertToEUR(parseFloat(amountValue), eurToInrRate);
    }
    
    if (onChange) {
      onChange({
        amount: eurAmount,
        entryCurrency: newCurrency,
        originalAmount: parseFloat(amountValue) || 0
      });
    }
  };

  // Calculate preview
  const eurAmount = entryCurrency === 'INR' && amountValue 
    ? convertToEUR(parseFloat(amountValue), eurToInrRate)
    : (parseFloat(amountValue) || 0);

  const displayAmount = displayCurrency === 'EUR' 
    ? eurAmount 
    : (displayCurrency === 'INR' ? eurAmount * eurToInrRate : eurAmount);

  return (
    <div className="amount-input-group">
      <label>{label} {required && '*'}</label>
      <div className="amount-input-wrapper">
        <div className="currency-selector-wrapper">
          <select
            value={entryCurrency}
            onChange={handleCurrencyChange}
            className="currency-selector"
            title="Select currency for this entry"
          >
            <option value="EUR">EUR (€)</option>
            <option value="INR">INR (₹)</option>
          </select>
        </div>
        <input
          type="number"
          step="0.01"
          min="0"
          value={amountValue}
          onChange={handleAmountChange}
          className="amount-input"
          placeholder="0.00"
          required={required}
        />
      </div>
      {showPreview && amountValue && (
        <div className="amount-preview">
          <span className="preview-label">Entered:</span>
          <span className="preview-amount">
            {entryCurrency === 'EUR' ? `€${parseFloat(amountValue).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `₹${parseFloat(amountValue).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          </span>
          {entryCurrency === 'INR' && (
            <>
              <span className="preview-separator">→</span>
              <span className="preview-label">Saved as:</span>
              <span className="preview-amount saved">
                €{eurAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </>
          )}
          {displayCurrency !== 'EUR' && (
            <>
              <span className="preview-separator">|</span>
              <span className="preview-label">Display:</span>
              <span className="preview-amount display">
                {displayCurrency === 'INR' ? '₹' : '$'}
                {displayAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AmountInput;

