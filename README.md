# Complete Financial Calculator - Budget, Savings & Expense Tracker

A comprehensive financial management web application built with React. Features beautiful charts, internal storage using IndexedDB, and Excel export functionality. **100% Open Source** - No paid services, uses only system storage.

## Features

### 💰 Budget Calculator
- Track income and expenses
- Real-time budget summary with balance calculation
- Beautiful charts: Monthly trends, category breakdowns, income sources
- Excel export functionality
- Filter and sort transactions

### 💰 Savings Calculator
- Set multiple savings goals
- Calculate months to reach your goal
- Project savings growth with interest calculations
- Visual progress tracking with charts
- Monthly contribution planning

### 💸 Expense Calculator
- Detailed expense tracking by category
- Multiple chart visualizations (pie, bar, line, area charts)
- Monthly and daily expense trends
- Category-wise expense analysis
- Average expense calculations

## Tech Stack

- **Frontend**: React 18
- **Charts**: Recharts (open source)
- **Storage**: IndexedDB via Dexie (browser storage - no backend needed!)
- **Excel**: XLSX library (open source)
- **License**: MIT

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn

## Installation

```bash
# Install dependencies
npm install
```

## Running the Application

### Development Mode

```bash
npm start
```

This will start the React development server on `http://localhost:3000`

The app will automatically open in your browser.

### Building for Production

```bash
npm run build
```

This creates an optimized production build in the `build` folder.

## Project Structure

```
.
├── public/              # Public assets
│   └── index.html
├── src/
│   ├── components/     # React components
│   │   ├── BudgetCalculator.js
│   │   ├── SavingsCalculator.js
│   │   ├── ExpenseCalculator.js
│   │   └── Navigation.js
│   ├── utils/          # Utilities
│   │   └── database.js # IndexedDB setup
│   ├── App.js          # Main app component
│   └── index.js        # Entry point
├── package.json
└── README.md
```

## Usage

### Budget Calculator
1. Click on "Budget" tab
2. Add income or expense transactions
3. View real-time summary and charts
4. Export data to Excel

### Savings Calculator
1. Click on "Savings" tab
2. Add a savings goal with current amount, target, and monthly contribution
3. View projections and progress charts
4. Track multiple savings goals

### Expense Calculator
1. Click on "Expenses" tab
2. Add expenses by category
3. View detailed analytics and trends
4. Analyze spending patterns

## Storage

**100% Local Storage** - All data is stored in your browser using IndexedDB:
- No backend required
- No database setup needed
- Data persists in your browser
- Completely private and secure
- Works offline

## Excel Export

Export your budget transactions to Excel format for external analysis:
- Click "Export to Excel" button
- File downloads automatically
- Includes all transaction details

## Charts & Visualizations

The app includes beautiful, interactive charts:
- **Pie Charts**: Category breakdowns
- **Bar Charts**: Comparisons and trends
- **Line Charts**: Time-based trends
- **Area Charts**: Savings projections

All charts are responsive and interactive.

## License

MIT License - Free to use, modify, and distribute.

## Contributing

Contributions are welcome! This is an open source project.

## Support

For issues or questions, please open an issue on GitHub.

---

**Note**: This application uses only open-source libraries and browser storage. No paid services, no external databases, no backend required. Everything runs locally in your browser!
