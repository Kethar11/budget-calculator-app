import Dexie from 'dexie';

const db = new Dexie('FinancialCalculatorDB');

db.version(1).stores({
  transactions: '++id, type, category, amount, date, description, createdAt',
  savings: '++id, goal, currentAmount, targetAmount, monthlyContribution, interestRate, date, createdAt',
  expenses: '++id, category, amount, date, description, createdAt'
});

export { db };

