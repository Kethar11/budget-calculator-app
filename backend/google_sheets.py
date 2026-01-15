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
    if not os.path.exists(CREDENTIALS_FILE):
        print(f"Warning: Google credentials file not found at {CREDENTIALS_FILE}")
        print("Google Sheets sync will be disabled. Set GOOGLE_CREDENTIALS_FILE environment variable.")
        return None
    
    try:
        creds = Credentials.from_service_account_file(CREDENTIALS_FILE, scopes=SCOPES)
        client = gspread.authorize(creds)
        return client
    except Exception as e:
        print(f"Error authenticating with Google Sheets: {e}")
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
    """Sync all Excel data to Google Sheets"""
    if not SPREADSHEET_ID and not CREDENTIALS_FILE:
        return {"status": "disabled", "message": "Google Sheets not configured"}
    
    client = get_google_client()
    if not client:
        return {"status": "error", "message": "Failed to authenticate with Google"}
    
    try:
        spreadsheet = get_or_create_spreadsheet(client, SPREADSHEET_ID)
        data = load_all_data()
        
        # Sync each sheet
        sheets_to_sync = ['Transactions', 'Expenses', 'Savings', 'Budgets', 'Summary']
        
        for sheet_name in sheets_to_sync:
            sheet_data = data.get(sheet_name.lower(), [])
            
            # Get or create worksheet
            try:
                worksheet = spreadsheet.worksheet(sheet_name)
            except:
                worksheet = spreadsheet.add_worksheet(title=sheet_name, rows=1000, cols=20)
            
            # Clear existing data
            worksheet.clear()
            
            if sheet_data:
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
                
                # Write data
                for _, row in df.iterrows():
                    worksheet.append_row([str(val) if val is not None else '' for val in row.values])
        
        return {
            "status": "success",
            "message": "Data synced to Google Sheets",
            "spreadsheet_url": spreadsheet.url,
            "spreadsheet_id": spreadsheet.id
        }
    except Exception as e:
        return {"status": "error", "message": f"Failed to sync: {str(e)}"}

def sync_from_google_sheets():
    """Import data from Google Sheets to Excel and return for frontend"""
    if not SPREADSHEET_ID and not CREDENTIALS_FILE:
        return {"status": "disabled", "message": "Google Sheets not configured"}
    
    client = get_google_client()
    if not client:
        return {"status": "error", "message": "Failed to authenticate with Google"}
    
    try:
        spreadsheet = get_or_create_spreadsheet(client, SPREADSHEET_ID)
        sheets_to_sync = ['Transactions', 'Expenses', 'Savings', 'Budgets']
        
        imported_data = {}
        
        for sheet_name in sheets_to_sync:
            try:
                worksheet = spreadsheet.worksheet(sheet_name)
                records = worksheet.get_all_records()
                imported_data[sheet_name.lower()] = records
            except Exception as e:
                print(f"Warning: Could not read sheet {sheet_name}: {e}")
                imported_data[sheet_name.lower()] = []
        
        return {
            "status": "success",
            "message": "Data imported from Google Sheets",
            "data": imported_data,
            "spreadsheet_url": spreadsheet.url
        }
    except Exception as e:
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



