import Dexie from 'dexie';

const db = new Dexie('BudgetCalculatorDB');

db.version(1).stores({
  transactions: '++id, type, category, amount, date, description, createdAt'
});

export { db };

