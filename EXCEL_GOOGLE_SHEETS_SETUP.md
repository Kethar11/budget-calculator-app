# Excel & Google Sheets Integration Setup

This application now uses **Excel files as the primary storage format** instead of JSON, making all data readable and easy to backup. Additionally, you can sync all data to Google Sheets for cloud backup and collaboration.

## Features

✅ **Excel as Primary Storage**: All data is stored in a readable Excel file (`budget_data.xlsx`)  
✅ **Multiple Sheets**: Data organized in separate sheets (Transactions, Expenses, Savings, Budgets, Summary)  
✅ **Automatic Backups**: Timestamped backups created automatically  
✅ **Google Sheets Sync**: One-click sync to Google Sheets for cloud backup  
✅ **Comprehensive Export**: Export all data (transactions, expenses, savings, budgets) in one Excel file  

## Excel File Structure

The Excel file contains the following sheets:

1. **Transactions**: All income and expense transactions
2. **Expenses**: Detailed expense records
3. **Savings**: Savings account deposits and investments
4. **Budgets**: Monthly budget limits by category
5. **Summary**: Real-time summary statistics

## Setting Up Google Sheets Integration

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Google Sheets API
   - Google Drive API

### Step 2: Create Service Account

1. Navigate to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **Service Account**
3. Fill in the service account details
4. Click **Create and Continue**
5. Grant the service account access (optional)
6. Click **Done**

### Step 3: Create and Download Key

1. Click on the created service account
2. Go to the **Keys** tab
3. Click **Add Key** > **Create new key**
4. Select **JSON** format
5. Download the JSON file
6. Save it as `credentials.json` in the `backend/` directory

### Step 4: Configure Environment Variables

Create a `.env` file in the `backend/` directory:

```env
GOOGLE_CREDENTIALS_FILE=credentials.json
GOOGLE_SHEET_ID=your_spreadsheet_id_here  # Optional: if you want to use existing sheet
```

### Step 5: Share Google Sheet (if using existing sheet)

If you want to use an existing Google Sheet:
1. Open the Google Sheet
2. Click **Share**
3. Add the service account email (found in `credentials.json` as `client_email`)
4. Give it **Editor** permissions

## Usage

### Export All Data to Excel

1. Click **Export All Data to Excel** button
2. A comprehensive Excel file will be downloaded with all your data
3. File includes: Transactions, Expenses, Savings, Budgets, and Summary sheets

### Download from Backend

1. Click **Download from Backend** button
2. Downloads the Excel file that the backend uses as primary storage
3. This is the same file that gets updated automatically when you add/edit data

### Sync to Google Sheets

1. Click **Sync to Google Sheets** button
2. All data will be synced to a new or existing Google Sheet
3. A link to the Google Sheet will be displayed
4. The sheet will be automatically updated with all your data

## Automatic Backups

The system automatically creates timestamped backups in the `backend/backups/` directory:
- Format: `budget_data_backup_YYYYMMDD_HHMMSS.xlsx`
- Created automatically when data is modified
- Can be manually triggered via API: `POST /api/excel/backup`

## API Endpoints

### Excel Operations

- `GET /api/excel/download` - Download the Excel file
- `POST /api/excel/backup` - Create a backup
- `GET /api/excel/all-data` - Get all data from Excel

### Google Sheets Operations

- `POST /api/google-sheets/sync` - Sync all data to Google Sheets
- `POST /api/google-sheets/import` - Import data from Google Sheets

## Data Format

### Transactions Sheet
| ID | Date | Time | Type | Category | Subcategory | Amount | Description | Created At |
|---|---|---|---|---|---|---|---|---|
| 1 | 2024-01-15 | 10:30:00 | Income | Salary | | 5000.00 | Monthly salary | 2024-01-15T10:30:00 |

### Expenses Sheet
| ID | Date | Time | Category | Subcategory | Amount | Description | Created At |
|---|---|---|---|---|---|---|---|
| 1 | 2024-01-15 | 14:20:00 | Food | Groceries | 150.00 | Weekly groceries | 2024-01-15T14:20:00 |

### Savings Sheet
| ID | Date | Time | Account Type | Amount | Maturity Date | Interest Rate | Description | Created At |
|---|---|---|---|---|---|---|---|---|
| 1 | 2024-01-15 | 09:00:00 | Savings Account | 1000.00 | 2025-01-15 | 3.5% | Emergency fund | 2024-01-15T09:00:00 |

### Budgets Sheet
| ID | Category | Monthly Limit | Description | Created At |
|---|---|---|---|---|
| 1 | Food | 500.00 | Monthly food budget | 2024-01-15T08:00:00 |

### Summary Sheet
| Metric | Value | Last Updated |
|---|---|---|
| Total Income | €5000.00 | 2024-01-15T10:30:00 |
| Total Expenses (Transactions) | €150.00 | 2024-01-15T14:20:00 |
| Current Balance | €4850.00 | 2024-01-15T14:20:00 |

## Benefits of Excel Storage

1. **Readable Format**: Open and view data in Excel, Google Sheets, or any spreadsheet application
2. **Easy Backup**: Simply copy the Excel file to backup location
3. **Portable**: Share Excel files easily via email, cloud storage, etc.
4. **Professional**: Formatted with headers, colors, and proper structure
5. **Compatible**: Works with all spreadsheet software
6. **Version Control**: Easy to track changes and maintain history

## Troubleshooting

### Google Sheets Sync Not Working

1. Check that `credentials.json` exists in `backend/` directory
2. Verify Google Sheets API and Drive API are enabled
3. Check that service account has proper permissions
4. Review backend logs for error messages

### Excel File Not Found

1. The Excel file is created automatically on first use
2. Check that the backend has write permissions in the directory
3. Verify the file path in `backend/excel_storage.py`

### Data Not Syncing

1. Ensure backend is running
2. Check network connectivity
3. Verify API endpoints are accessible
4. Review browser console for errors

## Security Notes

- Keep `credentials.json` secure and never commit it to version control
- Add `credentials.json` to `.gitignore`
- The service account key provides access to Google Sheets - protect it
- Excel files contain sensitive financial data - store securely



