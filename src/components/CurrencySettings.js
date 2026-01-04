import React, { useState, useEffect } from 'react';
import { Settings, Save, RefreshCw } from 'lucide-react';
import { getCurrencySettings, updateCurrencySettings, formatCurrency } from '../utils/currency';
import { useCurrency } from '../contexts/CurrencyContext';
import './CurrencySettings.css';

const CurrencySettings = ({ onCurrencyChange }) => {
  const { currency: contextCurrency, eurToInrRate: contextRate, updateSettings, reloadSettings } = useCurrency();
  const [showSettings, setShowSettings] = useState(false);
  const [currency, setCurrency] = useState(contextCurrency);
  const [eurToInrRate, setEurToInrRate] = useState(contextRate);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setCurrency(contextCurrency);
    setEurToInrRate(contextRate);
  }, [contextCurrency, contextRate]);

  const handleSave = async () => {
    setSaving(true);
    const success = await updateCurrencySettings(currency, eurToInrRate);
    if (success) {
      updateSettings(currency, eurToInrRate);
      await reloadSettings();
      if (onCurrencyChange) {
        onCurrencyChange({ currency, eurToInrRate });
      }
      setShowSettings(false);
      // Force page reload to update all components
      window.location.reload();
    } else {
      alert('Error saving currency settings');
    }
    setSaving(false);
  };

  return (
    <>
      <button 
        className="currency-settings-btn"
        onClick={() => setShowSettings(!showSettings)}
        title="Currency Settings"
      >
        <Settings size={18} />
        <span>{currency}</span>
      </button>

      {showSettings && (
        <div className="currency-settings-modal" onClick={() => setShowSettings(false)}>
          <div className="currency-settings-content" onClick={(e) => e.stopPropagation()}>
            <div className="currency-settings-header">
              <h3>
                <Settings size={20} />
                Currency Settings
              </h3>
              <button 
                className="close-btn"
                onClick={() => setShowSettings(false)}
              >
                ×
              </button>
            </div>

            <div className="currency-settings-body">
              <div className="currency-form-group">
                <label>Display Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="currency-select"
                >
                  <option value="INR">INR (₹) - Indian Rupee</option>
                  <option value="EUR">EUR (€) - Euro</option>
                  <option value="USD">USD ($) - US Dollar</option>
                </select>
              </div>

              <div className="currency-form-group">
                <label>EUR to INR Conversion Rate</label>
                <div className="rate-input-wrapper">
                  <span className="rate-label">1 EUR =</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={eurToInrRate}
                    onChange={(e) => setEurToInrRate(parseFloat(e.target.value) || 0)}
                    className="rate-input"
                  />
                  <span className="rate-label">INR</span>
                </div>
                <p className="rate-hint">
                  Default: 105. Update this when exchange rate changes.
                </p>
              </div>

              <div className="currency-preview">
                <div className="preview-item">
                  <span>Example:</span>
                  <strong>€100 = {formatCurrency(100 * eurToInrRate, currency)}</strong>
                </div>
              </div>

              <div className="currency-settings-actions">
                <button
                  className="save-btn"
                  onClick={handleSave}
                  disabled={saving || !eurToInrRate}
                >
                  {saving ? (
                    <>
                      <RefreshCw size={16} className="spinning" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Save & Update All
                    </>
                  )}
                </button>
                <button
                  className="cancel-btn"
                  onClick={() => setShowSettings(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CurrencySettings;

