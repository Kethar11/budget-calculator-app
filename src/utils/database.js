import Dexie from 'dexie';

const db = new Dexie('FinancialCalculatorDB');

// Version 1 - Initial schema
db.version(1).stores({
  transactions: '++id, type, category, amount, date, description, createdAt',
  savings: '++id, goal, currentAmount, targetAmount, monthlyContribution, interestRate, date, createdAt',
  expenses: '++id, category, amount, date, description, createdAt'
});

// Version 2 - Add subcategory to expenses and add budgets/recurring
db.version(2).stores({
  transactions: '++id, type, category, amount, date, description, createdAt',
  savings: '++id, goal, currentAmount, targetAmount, monthlyContribution, interestRate, date, createdAt',
  expenses: '++id, category, subcategory, amount, date, description, createdAt',
  budgets: '++id, category, monthlyLimit, description, createdAt',
  recurring: '++id, type, category, amount, description, frequency, startDate, createdAt'
}).upgrade(tx => {
  // Migrate existing expenses to include subcategory field
  return tx.table('expenses').toCollection().modify(expense => {
    if (!expense.subcategory) {
      expense.subcategory = '';
    }
  });
});

export { db };

