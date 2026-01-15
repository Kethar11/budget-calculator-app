"""
Excel-based storage system for Budget Calculator
Stores all data in readable Excel format with multiple sheets
"""
import os
from datetime import datetime
from typing import List, Dict, Optional
import pandas as pd
from openpyxl import load_workbook, Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

EXCEL_FILE = "budget_data.xlsx"
BACKUP_DIR = "backups"

def ensure_backup_dir():
    """Create backup directory if it doesn't exist"""
    if not os.path.exists(BACKUP_DIR):
        os.makedirs(BACKUP_DIR)

def create_excel_file():
    """Create a new Excel file with proper structure - organized by month"""
    wb = Workbook()
    
    # Remove default sheet
    if 'Sheet' in wb.sheetnames:
        wb.remove(wb['Sheet'])
    
    # Create main summary sheets
    sheets = {
        'All Transactions': ['ID', 'Date', 'Time', 'Type', 'Category', 'Subcategory', 'Amount', 'Description', 'Created At'],
        'All Expenses': ['ID', 'Date', 'Time', 'Category', 'Subcategory', 'Amount', 'Description', 'Created At'],
        'All Savings': ['ID', 'Date', 'Time', 'Account Type', 'Amount', 'Maturity Date', 'Interest Rate', 'Description', 'Created At'],
        'Budgets': ['ID', 'Category', 'Monthly Limit', 'Description', 'Created At'],
        'Summary': ['Metric', 'Value', 'Last Updated']
    }
    
    # Create monthly sheets for current year and next year
    from datetime import datetime
    current_year = datetime.now().year
    months = ['January', 'February', 'March', 'April', 'May', 'June', 
              'July', 'August', 'September', 'October', 'November', 'December']
    
    for year in [current_year, current_year + 1]:
        for month in months:
            sheet_name = f"{month} {year}"
            sheets[sheet_name] = ['ID', 'Date', 'Time', 'Type', 'Category', 'Subcategory', 'Amount', 'Description', 'Created At']
    
    # Header styles
    header_fill = PatternFill(start_color="4472C4", end_color="4472C4", fill_type="solid")
    header_font = Font(bold=True, color="FFFFFF", size=11)
    border = Border(
        left=Side(style='thin'),
        right=Side(style='thin'),
        top=Side(style='thin'),
        bottom=Side(style='thin')
    )
    
    for sheet_name, headers in sheets.items():
        ws = wb.create_sheet(sheet_name)
        
        # Set headers
        for col_num, header in enumerate(headers, 1):
            cell = ws.cell(row=1, column=col_num, value=header)
            cell.fill = header_fill
            cell.font = header_font
            cell.alignment = Alignment(horizontal='center', vertical='center')
            cell.border = border
        
        # Auto-adjust column widths
        for col_num in range(1, len(headers) + 1):
            ws.column_dimensions[get_column_letter(col_num)].width = 15
    
    wb.save(EXCEL_FILE)
    return wb

def load_excel_file():
    """Load existing Excel file or create new one"""
    if os.path.exists(EXCEL_FILE):
        return load_workbook(EXCEL_FILE)
    else:
        return create_excel_file()

def get_sheet_data(wb, sheet_name: str) -> List[Dict]:
    """Get all data from a sheet as list of dictionaries"""
    if sheet_name not in wb.sheetnames:
        return []
    
    ws = wb[sheet_name]
    data = []
    
    # Skip header row
    for row in ws.iter_rows(min_row=2, values_only=False):
        row_data = {}
        headers = [cell.value for cell in ws[1]]
        
        for idx, cell in enumerate(row):
            if idx < len(headers) and headers[idx]:
                row_data[headers[idx]] = cell.value
        
        # Only add non-empty rows
        if any(row_data.values()):
            data.append(row_data)
    
    return data

def save_sheet_data(wb, sheet_name: str, data: List[Dict], headers: List[str]):
    """Save data to a sheet"""
    if sheet_name not in wb.sheetnames:
        ws = wb.create_sheet(sheet_name)
        # Add headers
        for col_num, header in enumerate(headers, 1):
            cell = ws.cell(row=1, column=col_num, value=header)
            cell.fill = PatternFill(start_color="4472C4", end_color="4472C4", fill_type="solid")
            cell.font = Font(bold=True, color="FFFFFF", size=11)
    else:
        ws = wb[sheet_name]
        # Clear existing data (keep headers)
        ws.delete_rows(2, ws.max_row)
    
    # Write data
    for row_num, row_data in enumerate(data, 2):
        for col_num, header in enumerate(headers, 1):
            value = row_data.get(header, '')
            cell = ws.cell(row=row_num, column=col_num, value=value)
            cell.border = Border(
                left=Side(style='thin'),
                right=Side(style='thin'),
                top=Side(style='thin'),
                bottom=Side(style='thin')
            )
    
    # Auto-adjust column widths
    for col_num in range(1, len(headers) + 1):
        max_length = max(
            len(str(ws.cell(row=row_num, column=col_num).value or ''))
            for row_num in range(1, ws.max_row + 1)
        )
        ws.column_dimensions[get_column_letter(col_num)].width = min(max_length + 2, 30)
    
    wb.save(EXCEL_FILE)

def backup_excel_file():
    """Create a timestamped backup of the Excel file"""
    ensure_backup_dir()
    if os.path.exists(EXCEL_FILE):
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_file = os.path.join(BACKUP_DIR, f"budget_data_backup_{timestamp}.xlsx")
        import shutil
        shutil.copy2(EXCEL_FILE, backup_file)
        return backup_file
    return None

def load_all_data():
    """Load all data from Excel file - combines main sheets and monthly sheets"""
    wb = load_excel_file()
    
    # Load from main sheets (preferred)
    transactions = get_sheet_data(wb, 'All Transactions')
    expenses = get_sheet_data(wb, 'All Expenses')
    savings = get_sheet_data(wb, 'All Savings')
    
    # If main sheets don't exist, try old sheet names for backward compatibility
    if not transactions:
        transactions = get_sheet_data(wb, 'Transactions')
    if not expenses:
        expenses = get_sheet_data(wb, 'Expenses')
    if not savings:
        savings = get_sheet_data(wb, 'Savings')
    
    # Also load from monthly sheets and merge (avoid duplicates by ID)
    from datetime import datetime
    current_year = datetime.now().year
    months = ['January', 'February', 'March', 'April', 'May', 'June', 
              'July', 'August', 'September', 'October', 'November', 'December']
    
    transaction_ids = {t.get('ID') for t in transactions if t.get('ID')}
    expense_ids = {e.get('ID') for e in expenses if e.get('ID')}
    
    for year in [current_year - 1, current_year, current_year + 1]:
        for month in months:
            sheet_name = f"{month} {year}"
            if sheet_name in wb.sheetnames:
                month_transactions = get_sheet_data(wb, sheet_name)
                for t in month_transactions:
                    if t.get('ID') and t.get('ID') not in transaction_ids:
                        transactions.append(t)
                        transaction_ids.add(t.get('ID'))
                
                month_expenses = get_sheet_data(wb, sheet_name)
                for e in month_expenses:
                    if e.get('ID') and e.get('ID') not in expense_ids:
                        expenses.append(e)
                        expense_ids.add(e.get('ID'))
    
    return {
        'transactions': transactions,
        'expenses': expenses,
        'savings': savings,
        'budgets': get_sheet_data(wb, 'Budgets'),
        'summary': get_sheet_data(wb, 'Summary')
    }

def save_transaction(transaction: Dict):
    """Save a transaction to Excel - saves to main sheet and monthly sheet"""
    wb = load_excel_file()
    transactions = get_sheet_data(wb, 'All Transactions')
    if not transactions:
        transactions = get_sheet_data(wb, 'Transactions')  # Backward compatibility
    
    # Generate ID if not present
    if not transaction.get('ID'):
        if transactions:
            max_id = max(int(t.get('ID', 0) or 0) for t in transactions)
            transaction['ID'] = max_id + 1
        else:
            transaction['ID'] = 1
    
    # Set timestamps
    now = datetime.now()
    if not transaction.get('Date'):
        transaction['Date'] = now.strftime('%Y-%m-%d')
    if not transaction.get('Time'):
        transaction['Time'] = now.strftime('%H:%M:%S')
    if not transaction.get('Created At'):
        transaction['Created At'] = now.isoformat()
    
    # Check if updating existing
    existing_idx = None
    for idx, t in enumerate(transactions):
        if t.get('ID') == transaction['ID']:
            existing_idx = idx
            break
    
    if existing_idx is not None:
        transactions[existing_idx] = transaction
    else:
        transactions.append(transaction)
    
    headers = ['ID', 'Date', 'Time', 'Type', 'Category', 'Subcategory', 'Amount', 'Description', 'Created At']
    
    # Save to main sheet and monthly sheet
    save_to_monthly_sheet(wb, [transaction], 'Transactions', headers)
    
    # Update summary
    update_summary(wb)
    
    return transaction

def update_summary(wb):
    """Update summary sheet with current statistics"""
    transactions = get_sheet_data(wb, 'All Transactions')
    if not transactions:
        transactions = get_sheet_data(wb, 'Transactions')  # Backward compatibility
    
    expenses = get_sheet_data(wb, 'All Expenses')
    if not expenses:
        expenses = get_sheet_data(wb, 'Expenses')  # Backward compatibility
    
    savings = get_sheet_data(wb, 'All Savings')
    if not savings:
        savings = get_sheet_data(wb, 'Savings')  # Backward compatibility
    
    budgets = get_sheet_data(wb, 'Budgets')
    
    income = sum(float(t.get('Amount', 0) or 0) for t in transactions if t.get('Type', '').lower() == 'income')
    expense_total = sum(float(t.get('Amount', 0) or 0) for t in transactions if t.get('Type', '').lower() == 'expense')
    expense_records = sum(float(e.get('Amount', 0) or 0) for e in expenses)
    savings_total = sum(float(s.get('Amount', 0) or 0) for s in savings)
    balance = income - expense_total
    
    summary_data = [
        {'Metric': 'Total Income', 'Value': f'€{income:.2f}', 'Last Updated': datetime.now().isoformat()},
        {'Metric': 'Total Expenses (Transactions)', 'Value': f'€{expense_total:.2f}', 'Last Updated': datetime.now().isoformat()},
        {'Metric': 'Total Expenses (Records)', 'Value': f'€{expense_records:.2f}', 'Last Updated': datetime.now().isoformat()},
        {'Metric': 'Total Savings', 'Value': f'€{savings_total:.2f}', 'Last Updated': datetime.now().isoformat()},
        {'Metric': 'Current Balance', 'Value': f'€{balance:.2f}', 'Last Updated': datetime.now().isoformat()},
        {'Metric': 'Total Transactions', 'Value': len(transactions), 'Last Updated': datetime.now().isoformat()},
        {'Metric': 'Total Expense Records', 'Value': len(expenses), 'Last Updated': datetime.now().isoformat()},
        {'Metric': 'Total Savings Records', 'Value': len(savings), 'Last Updated': datetime.now().isoformat()},
        {'Metric': 'Total Budgets Set', 'Value': len(budgets), 'Last Updated': datetime.now().isoformat()},
    ]
    
    headers = ['Metric', 'Value', 'Last Updated']
    save_sheet_data(wb, 'Summary', summary_data, headers)

def get_month_sheet_name(date_str):
    """Get month sheet name from date string"""
    try:
        from datetime import datetime
        date_obj = datetime.strptime(date_str.split('T')[0], '%Y-%m-%d')
        months = ['January', 'February', 'March', 'April', 'May', 'June', 
                  'July', 'August', 'September', 'October', 'November', 'December']
        return f"{months[date_obj.month - 1]} {date_obj.year}"
    except:
        # Default to current month if parsing fails
        from datetime import datetime
        now = datetime.now()
        months = ['January', 'February', 'March', 'April', 'May', 'June', 
                  'July', 'August', 'September', 'October', 'November', 'December']
        return f"{months[now.month - 1]} {now.year}"

def save_to_monthly_sheet(wb, data, sheet_base_name, headers):
    """Save data to both main sheet and monthly sheet"""
    # Save to main "All Transactions" or "All Expenses" sheet
    save_sheet_data(wb, f'All {sheet_base_name}', data, headers)
    
    # Also save to monthly sheets
    monthly_data = {}
    for item in data:
        date_str = item.get('Date', item.get('Created At', ''))
        if date_str:
            month_sheet = get_month_sheet_name(date_str)
            if month_sheet not in monthly_data:
                monthly_data[month_sheet] = []
            monthly_data[month_sheet].append(item)
    
    # Save to each monthly sheet
    for month_sheet, month_items in monthly_data.items():
        # Get or create monthly sheet
        if month_sheet not in wb.sheetnames:
            ws = wb.create_sheet(month_sheet)
            # Add headers
            for col_num, header in enumerate(headers, 1):
                cell = ws.cell(row=1, column=col_num, value=header)
                cell.fill = PatternFill(start_color="4472C4", end_color="4472C4", fill_type="solid")
                cell.font = Font(bold=True, color="FFFFFF", size=11)
        else:
            ws = wb[month_sheet]
            # Clear existing data (keep headers)
            ws.delete_rows(2, ws.max_row)
        
        # Write data
        for row_num, row_data in enumerate(month_items, 2):
            for col_num, header in enumerate(headers, 1):
                value = row_data.get(header, '')
                cell = ws.cell(row=row_num, column=col_num, value=value)
                cell.border = Border(
                    left=Side(style='thin'),
                    right=Side(style='thin'),
                    top=Side(style='thin'),
                    bottom=Side(style='thin')
                )
        
        # Auto-adjust column widths
        for col_num in range(1, len(headers) + 1):
            max_length = max(
                len(str(ws.cell(row=row_num, column=col_num).value or ''))
                for row_num in range(1, ws.max_row + 1)
            )
            ws.column_dimensions[get_column_letter(col_num)].width = min(max_length + 2, 30)
    
    wb.save(EXCEL_FILE)

def save_all_data(data: Dict):
    """Save all data (transactions, expenses, savings, budgets) to Excel at once - organized by month"""
    wb = load_excel_file()
    
    # Create backup before updating
    backup_excel_file()
    
    total_records = 0
    
    # Save transactions (to main sheet and monthly sheets)
    if 'transactions' in data and data['transactions']:
        transactions = data['transactions']
        headers = ['ID', 'Date', 'Time', 'Type', 'Category', 'Subcategory', 'Amount', 'Description', 'Created At']
        save_to_monthly_sheet(wb, transactions, 'Transactions', headers)
        total_records += len(transactions)
    
    # Save expenses (to main sheet and monthly sheets)
    if 'expenses' in data and data['expenses']:
        expenses = data['expenses']
        headers = ['ID', 'Date', 'Time', 'Category', 'Subcategory', 'Amount', 'Description', 'Created At']
        save_to_monthly_sheet(wb, expenses, 'Expenses', headers)
        total_records += len(expenses)
    
    # Save savings (to main sheet only - not monthly)
    if 'savings' in data and data['savings']:
        savings = data['savings']
        headers = ['ID', 'Date', 'Time', 'Account Type', 'Amount', 'Maturity Date', 'Interest Rate', 'Description', 'Created At']
        save_sheet_data(wb, 'All Savings', savings, headers)
        total_records += len(savings)
    
    # Save budgets
    if 'budgets' in data and data['budgets']:
        budgets = data['budgets']
        headers = ['ID', 'Category', 'Monthly Limit', 'Description', 'Created At']
        save_sheet_data(wb, 'Budgets', budgets, headers)
        total_records += len(budgets)
    
    # Update summary
    update_summary(wb)
    
    return {"total_records": total_records, "status": "success"}



