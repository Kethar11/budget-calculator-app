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

// Version 3 - Add savings deposits schema
db.version(3).stores({
  transactions: '++id, type, category, amount, date, description, createdAt',
  savings: '++id, accountType, amount, date, maturityDate, interestRate, description, createdAt',
  expenses: '++id, category, subcategory, amount, date, description, createdAt',
  budgets: '++id, category, monthlyLimit, description, createdAt',
  recurring: '++id, type, category, amount, description, frequency, startDate, createdAt'
}).upgrade(async tx => {
  // Version 3 upgrade: Migrate old savings goals to new savings deposits if necessary
  // For this change, we're completely replacing the concept, so old data might not be directly migratable
});

// Version 4 - Add file attachments support
db.version(4).stores({
  transactions: '++id, type, category, amount, date, description, createdAt, files',
  savings: '++id, accountType, amount, date, maturityDate, interestRate, description, createdAt, files',
  expenses: '++id, category, subcategory, amount, date, description, createdAt, files',
  budgets: '++id, category, monthlyLimit, description, createdAt',
  recurring: '++id, type, category, amount, description, frequency, startDate, createdAt',
  files: '++id, transactionId, transactionType, fileName, fileType, fileSize, fileData, uploadedAt'
}).upgrade(async tx => {
  // Add files array to existing records
  await tx.table('transactions').toCollection().modify(transaction => {
    if (!transaction.files) {
      transaction.files = [];
    }
  });
  await tx.table('savings').toCollection().modify(saving => {
    if (!saving.files) {
      saving.files = [];
    }
  });
  await tx.table('expenses').toCollection().modify(expense => {
    if (!expense.files) {
      expense.files = [];
    }
  });
});

// Version 5 - Add file management (bin, rename, restore)
db.version(5).stores({
  transactions: '++id, type, category, amount, date, description, createdAt, files',
  savings: '++id, accountType, amount, date, maturityDate, interestRate, description, createdAt, files',
  expenses: '++id, category, subcategory, amount, date, description, createdAt, files',
  budgets: '++id, category, monthlyLimit, description, createdAt',
  recurring: '++id, type, category, amount, description, frequency, startDate, createdAt',
  files: '++id, transactionId, transactionType, fileName, fileType, fileSize, fileData, uploadedAt'
}).upgrade(async tx => {
  // Add bin/trash fields to existing files (non-indexed fields)
  await tx.table('files').toCollection().modify(file => {
    if (file.isDeleted === undefined) {
      file.isDeleted = false;
    }
    if (!file.originalFileName) {
      file.originalFileName = file.fileName || '';
    }
    if (!file.deletedAt) {
      file.deletedAt = null;
    }
  });
});

// Version 6 - Add buying goals
db.version(6).stores({
  transactions: '++id, type, category, amount, date, description, createdAt, files',
  savings: '++id, accountType, amount, date, maturityDate, interestRate, description, createdAt, files',
  expenses: '++id, category, subcategory, amount, date, description, createdAt, files',
  budgets: '++id, category, monthlyLimit, description, createdAt',
  recurring: '++id, type, category, amount, description, frequency, startDate, createdAt',
  files: '++id, transactionId, transactionType, fileName, fileType, fileSize, fileData, uploadedAt',
  goals: '++id, name, targetAmount, currentAmount, goalType, category, account, description, createdAt, contributions'
}).upgrade(async tx => {
  // Migration for version 6 - no data migration needed
});

export { db };

