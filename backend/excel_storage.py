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
    """Create a new Excel file with proper structure"""
    wb = Workbook()
    
    # Remove default sheet
    if 'Sheet' in wb.sheetnames:
        wb.remove(wb['Sheet'])
    
    # Create sheets
    sheets = {
        'Transactions': ['ID', 'Date', 'Time', 'Type', 'Category', 'Subcategory', 'Amount', 'Description', 'Created At'],
        'Expenses': ['ID', 'Date', 'Time', 'Category', 'Subcategory', 'Amount', 'Description', 'Created At'],
        'Savings': ['ID', 'Date', 'Time', 'Account Type', 'Amount', 'Maturity Date', 'Interest Rate', 'Description', 'Created At'],
        'Budgets': ['ID', 'Category', 'Monthly Limit', 'Description', 'Created At'],
        'Summary': ['Metric', 'Value', 'Last Updated']
    }
    
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
    """Load all data from Excel file"""
    wb = load_excel_file()
    
    return {
        'transactions': get_sheet_data(wb, 'Transactions'),
        'expenses': get_sheet_data(wb, 'Expenses'),
        'savings': get_sheet_data(wb, 'Savings'),
        'budgets': get_sheet_data(wb, 'Budgets'),
        'summary': get_sheet_data(wb, 'Summary')
    }

def save_transaction(transaction: Dict):
    """Save a transaction to Excel"""
    wb = load_excel_file()
    transactions = get_sheet_data(wb, 'Transactions')
    
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
    save_sheet_data(wb, 'Transactions', transactions, headers)
    
    # Update summary
    update_summary(wb)
    
    return transaction

def update_summary(wb):
    """Update summary sheet with current statistics"""
    transactions = get_sheet_data(wb, 'Transactions')
    expenses = get_sheet_data(wb, 'Expenses')
    savings = get_sheet_data(wb, 'Savings')
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

