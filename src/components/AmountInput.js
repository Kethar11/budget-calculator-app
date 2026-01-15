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
    let newValue = e.target.value;
    
    // Only allow numbers and one decimal point
    // Remove any non-numeric characters except one decimal point
    newValue = newValue.replace(/[^0-9.]/g, '');
    
    // Ensure only one decimal point
    const parts = newValue.split('.');
    if (parts.length > 2) {
      newValue = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Limit to 2 decimal places
    if (parts.length === 2 && parts[1].length > 2) {
      newValue = parts[0] + '.' + parts[1].substring(0, 2);
    }
    
    setAmountValue(newValue);
    
    // Convert to EUR if needed
    let eurAmount = parseFloat(newValue) || 0;
    const originalAmount = parseFloat(newValue) || 0;
    if (entryCurrency === 'INR' && newValue) {
      eurAmount = convertToEUR(originalAmount, eurToInrRate);
    }
    
    // Call parent onChange with EUR amount, entry currency, and original amount
    if (onChange) {
      onChange({
        amount: eurAmount,
        entryCurrency: entryCurrency,
        originalAmount: originalAmount
      });
    }
  };

  const handleCurrencyChange = (newCurrency) => {
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
      
      {/* Currency Selector - More Prominent */}
      <div className="currency-toggle-group">
        <label className="currency-toggle-label">Select Currency:</label>
        <div className="currency-toggle-buttons">
          <button
            type="button"
            className={`currency-toggle-btn ${entryCurrency === 'EUR' ? 'active' : ''}`}
            onClick={() => handleCurrencyChange('EUR')}
          >
            <span className="currency-symbol">€</span>
            <span className="currency-name">EUR</span>
          </button>
          <button
            type="button"
            className={`currency-toggle-btn ${entryCurrency === 'INR' ? 'active' : ''}`}
            onClick={() => handleCurrencyChange('INR')}
          >
            <span className="currency-symbol">₹</span>
            <span className="currency-name">INR</span>
          </button>
        </div>
      </div>
      
      <div className="amount-input-wrapper">
        <input
          type="text"
          inputMode="decimal"
          value={amountValue}
          onChange={handleAmountChange}
          onKeyPress={(e) => {
            // Allow numbers (0-9), decimal point (.), and control keys
            const char = String.fromCharCode(e.which || e.keyCode);
            // Allow control keys (backspace, delete, tab, etc.)
            if (e.ctrlKey || e.metaKey || e.altKey) {
              return;
            }
            // Allow numbers and single decimal point
            if (!/[0-9.]/.test(char)) {
              e.preventDefault();
              return;
            }
            // Prevent multiple decimal points
            if (char === '.' && amountValue.includes('.')) {
              e.preventDefault();
            }
          }}
          className="amount-input"
          placeholder={`Enter amount in ${entryCurrency === 'EUR' ? 'EUR (€)' : 'INR (₹)'}`}
          required={required}
        />
      </div>
      {showPreview && amountValue && (
        <div className="amount-preview">
          <div className="preview-row">
            <span className="preview-label">Entered ({entryCurrency}):</span>
            <span className="preview-amount original">
              {entryCurrency === 'EUR' ? `€${parseFloat(amountValue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `₹${parseFloat(amountValue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </span>
          </div>
          {entryCurrency === 'INR' && (
            <div className="preview-row">
              <span className="preview-label">Stored (EUR):</span>
              <span className="preview-amount saved">
                €{eurAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          )}
          {displayCurrency !== entryCurrency && (
            <div className="preview-row">
              <span className="preview-label">Display ({displayCurrency}):</span>
              <span className="preview-amount display">
                {displayCurrency === 'INR' ? '₹' : displayCurrency === 'EUR' ? '€' : '$'}
                {displayAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AmountInput;

