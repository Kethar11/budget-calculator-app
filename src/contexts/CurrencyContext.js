import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrencySettings } from '../utils/currency';

const CurrencyContext = createContext();

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within CurrencyProvider');
  }
  return context;
};

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState('EUR');
  const [eurToInrRate, setEurToInrRate] = useState(105);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await getCurrencySettings();
      setCurrency(settings.currency);
      setEurToInrRate(settings.eurToInrRate);
    } catch (error) {
      console.error('Error loading currency settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = (newCurrency, newRate) => {
    setCurrency(newCurrency);
    setEurToInrRate(newRate);
  };

  const convertAmount = (eurAmount) => {
    if (currency === 'EUR') {
      return eurAmount;
    }
    // Convert EUR to selected currency
    if (currency === 'INR') {
      return eurAmount * eurToInrRate;
    }
    // For other currencies, you can add more conversion rates
    return eurAmount;
  };

  const formatAmount = (eurAmount) => {
    const converted = convertAmount(eurAmount);
    const symbols = {
      'INR': '₹',
      'EUR': '€',
      'USD': '$'
    };
    const symbol = symbols[currency] || currency;
    return `${symbol}${Math.abs(converted).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  const formatAmountWithSign = (eurAmount, showSign = false) => {
    const formatted = formatAmount(eurAmount);
    if (showSign && eurAmount !== 0) {
      return `${eurAmount >= 0 ? '+' : '-'}${formatted}`;
    }
    return formatted;
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        eurToInrRate,
        loading,
        updateSettings,
        convertAmount,
        formatAmount,
        formatAmountWithSign,
        reloadSettings: loadSettings
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

