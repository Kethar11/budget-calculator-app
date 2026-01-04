import { db } from './database';

// Default currency settings
const DEFAULT_CURRENCY = 'EUR';
const DEFAULT_EUR_TO_INR_RATE = 105;

/**
 * Get currency settings from database
 */
export const getCurrencySettings = async () => {
  try {
    const currencySetting = await db.settings.get(1);
    const rateSetting = await db.settings.get(2);
    
    return {
      currency: currencySetting?.value || DEFAULT_CURRENCY,
      eurToInrRate: parseFloat(rateSetting?.value) || DEFAULT_EUR_TO_INR_RATE
    };
  } catch (error) {
    console.error('Error loading currency settings:', error);
    return {
      currency: DEFAULT_CURRENCY,
      eurToInrRate: DEFAULT_EUR_TO_INR_RATE
    };
  }
};

/**
 * Update currency settings
 */
export const updateCurrencySettings = async (currency, eurToInrRate) => {
  try {
    await db.settings.put({ id: 1, key: 'currency', value: currency, updatedAt: new Date().toISOString() });
    await db.settings.put({ id: 2, key: 'eurToInrRate', value: eurToInrRate, updatedAt: new Date().toISOString() });
    return true;
  } catch (error) {
    console.error('Error updating currency settings:', error);
    return false;
  }
};

/**
 * Convert EUR amount to INR
 */
export const convertToINR = (eurAmount, rate) => {
  return eurAmount * rate;
};

/**
 * Convert INR amount to EUR
 */
export const convertToEUR = (inrAmount, rate) => {
  return inrAmount / rate;
};

/**
 * Format amount with currency symbol
 */
export const formatCurrency = (amount, currency = 'INR') => {
  const symbols = {
    'INR': '₹',
    'EUR': '€',
    'USD': '$'
  };
  
  const symbol = symbols[currency] || currency;
  
  // Format number with commas
  const formatted = Math.abs(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  return `${symbol}${formatted}`;
};

/**
 * Format amount with sign (+ or -)
 */
export const formatCurrencyWithSign = (amount, currency = 'INR', showSign = false) => {
  const formatted = formatCurrency(amount, currency);
  if (showSign && amount !== 0) {
    return `${amount >= 0 ? '+' : '-'}${formatted}`;
  }
  return formatted;
};

