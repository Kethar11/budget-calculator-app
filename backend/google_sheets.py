"""
Google Sheets integration for Budget Calculator
Syncs all data to Google Sheets for cloud backup and collaboration
"""
import os
import gspread
from google.oauth2.service_account import Credentials
from typing import List, Dict, Optional
from excel_storage import load_all_data, EXCEL_FILE
import pandas as pd
from datetime import datetime

# Google Sheets configuration
SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive'
]

# Default to user's Google Sheet if not set
SPREADSHEET_ID = os.getenv('GOOGLE_SHEET_ID', '1Dp4UGkT8h-PHnEXDPbGqnnDxsvhP6zO_UvxXH4xXLu0')
CREDENTIALS_FILE = os.getenv('GOOGLE_CREDENTIALS_FILE', 'credentials.json')

def get_google_client():
    """Get authenticated Google Sheets client"""
    # Try service account first (if credentials.json exists)
    if os.path.exists(CREDENTIALS_FILE):
        try:
            creds = Credentials.from_service_account_file(CREDENTIALS_FILE, scopes=SCOPES)
            client = gspread.authorize(creds)
            print("✅ Using service account credentials")
            return client
        except Exception as e:
            print(f"⚠️  Error with service account: {e}")
    
    # For public sheets, we can try using gspread without credentials
    # But this requires the sheet to be shared with "Anyone with the link can edit"
    print(f"⚠️  No credentials.json found. Trying public sheet access...")
    print(f"📝 Make sure your Google Sheet is shared as 'Anyone with the link can edit'")
    print(f"🔗 Sheet ID: {SPREADSHEET_ID}")
    
    # Return None - we'll handle public sheets differently if needed
    return None

def get_or_create_spreadsheet(client, spreadsheet_id: Optional[str] = None):
    """Get existing spreadsheet or create new one"""
    if spreadsheet_id:
        try:
            return client.open_by_key(spreadsheet_id)
        except:
            pass
    
    # Create new spreadsheet
    spreadsheet = client.create('Budget Calculator Data')
    spreadsheet.share('', perm_type='anyone', role='writer')  # Make it accessible
    return spreadsheet

def sync_to_google_sheets():
    """Sync all Excel data to Google Sheets - UPDATED: Only Income and Expense"""
    if not SPREADSHEET_ID:
        return {"status": "disabled", "message": "Google Sheet ID not configured"}
    
    try:
        client = get_google_client()
        if not client:
            return {
                "status": "info", 
                "message": "Google Sheets sync is optional. Excel sync works without it! To enable: See GOOGLE_SHEETS_SIMPLE.md (5 min setup)."
            }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Google Sheets authentication failed: {str(e)}. Please setup credentials.json (see GOOGLE_SHEETS_QUICK_SETUP.md). Excel sync works without it!"
        }
    
    try:
        spreadsheet = get_or_create_spreadsheet(client, SPREADSHEET_ID)
        data = load_all_data()
        
        # UPDATED: Sync only Income and Expense sheets (matching Excel structure)
        sheets_to_sync = {
            'Income': data.get('transactions', []),
            'Expense': data.get('expenses', []),
            'Summary': data.get('summary', [])
        }
        
        total_rows = 0
        
        for sheet_name, sheet_data in sheets_to_sync.items():
            # Filter Income transactions
            if sheet_name == 'Income':
                sheet_data = [t for t in sheet_data if (t.get('Type') or '').lower() == 'income']
            
            # Get or create worksheet
            try:
                worksheet = spreadsheet.worksheet(sheet_name)
            except:
                worksheet = spreadsheet.add_worksheet(title=sheet_name, rows=1000, cols=20)
            
            # Clear existing data
            worksheet.clear()
            
            if sheet_data and len(sheet_data) > 0:
                # Convert to DataFrame for easier handling
                df = pd.DataFrame(sheet_data)
                
                # Write headers
                headers = list(df.columns)
                worksheet.append_row(headers)
                
                # Format header row
                worksheet.format('1:1', {
                    'backgroundColor': {'red': 0.26, 'green': 0.45, 'blue': 0.76},
                    'textFormat': {'bold': True, 'foregroundColor': {'red': 1, 'green': 1, 'blue': 1}}
                })
                
                # Write data rows
                for _, row in df.iterrows():
                    row_values = [str(val) if val is not None else '' for val in row.values]
                    worksheet.append_row(row_values)
                    total_rows += 1
        
        return {
            "status": "success",
            "message": f"Data synced to Google Sheets successfully! {total_rows} rows updated.",
            "spreadsheet_url": f"https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit",
            "spreadsheet_id": SPREADSHEET_ID,
            "rows_updated": total_rows
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"status": "error", "message": f"Failed to sync: {str(e)}"}

def sync_from_google_sheets():
    """Import data from Google Sheets to Excel and return for frontend - UPDATED: Only Income and Expense"""
    if not SPREADSHEET_ID:
        return {"status": "disabled", "message": "Google Sheet ID not configured"}
    
    client = get_google_client()
    if not client:
        return {"status": "error", "message": "Failed to authenticate with Google. Please setup credentials.json"}
    
    try:
        spreadsheet = get_or_create_spreadsheet(client, SPREADSHEET_ID)
        sheets_to_sync = ['Income', 'Expense']  # UPDATED: Only Income and Expense
        
        imported_data = {
            'transactions': [],
            'expenses': []
        }
        
        # Import Income sheet
        try:
            worksheet = spreadsheet.worksheet('Income')
            records = worksheet.get_all_records()
            # Convert to transactions format
            for record in records:
                record['Type'] = 'Income'
                imported_data['transactions'].append(record)
        except Exception as e:
            print(f"Warning: Could not read Income sheet: {e}")
        
        # Import Expense sheet
        try:
            worksheet = spreadsheet.worksheet('Expense')
            records = worksheet.get_all_records()
            imported_data['expenses'] = records
        except Exception as e:
            print(f"Warning: Could not read Expense sheet: {e}")
        
        return {
            "status": "success",
            "message": f"Data imported from Google Sheets: {len(imported_data['transactions'])} transactions, {len(imported_data['expenses'])} expenses",
            "data": imported_data,
            "spreadsheet_url": f"https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}/edit"
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"status": "error", "message": f"Failed to import: {str(e)}"}

def upload_file_to_google_sheets(file_data: Dict):
    """Upload file metadata to Google Sheets Files sheet"""
    client = get_google_client()
    if not client:
        return {"status": "error", "message": "Failed to authenticate with Google"}
    
    try:
        spreadsheet = get_or_create_spreadsheet(client, SPREADSHEET_ID)
        
        # Get or create Files worksheet
        try:
            worksheet = spreadsheet.worksheet('Files')
        except:
            worksheet = spreadsheet.add_worksheet(title='Files', rows=1000, cols=10)
            # Add headers if new sheet
            headers = ['File ID', 'File Name', 'File Type', 'File Size (bytes)', 'Transaction ID', 'Transaction Type', 'Uploaded At', 'File Data (Base64)']
            worksheet.append_row(headers)
            worksheet.format('1:1', {
                'backgroundColor': {'red': 0.26, 'green': 0.45, 'blue': 0.76},
                'textFormat': {'bold': True, 'foregroundColor': {'red': 1, 'green': 1, 'blue': 1}}
            })
        
        # Append file data
        row = [
            str(file_data.get('fileId', '')),
            file_data.get('fileName', ''),
            file_data.get('fileType', ''),
            str(file_data.get('fileSize', 0)),
            str(file_data.get('transactionId', '')),
            file_data.get('transactionType', ''),
            file_data.get('uploadedAt', ''),
            file_data.get('fileData', '')[:100] + '...' if len(file_data.get('fileData', '')) > 100 else file_data.get('fileData', '')  # Truncate base64 for display
        ]
        worksheet.append_row(row)
        
        return {
            "status": "success",
            "message": "File metadata synced to Google Sheets",
            "spreadsheet_url": spreadsheet.url
        }
    except Exception as e:
        return {"status": "error", "message": f"Failed to upload file to Google Sheets: {str(e)}"}



