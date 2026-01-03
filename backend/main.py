from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import os
from excel_storage import (
    load_all_data, save_transaction, backup_excel_file,
    EXCEL_FILE, load_excel_file
)

app = FastAPI(title="Budget Calculator API")

# CORS middleware for Electron app and Docker
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:8000",
        "http://frontend:80",
        "http://frontend:3000",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Transaction(BaseModel):
    id: Optional[int] = None
    type: str  # 'income' or 'expense'
    category: str
    amount: float
    description: str
    date: Optional[str] = None

# Excel storage is now handled by excel_storage.py

@app.get("/")
def read_root():
    return {"message": "Budget Calculator API", "version": "1.0.0"}

@app.get("/api/transactions")
def get_transactions():
    """Get all transactions from Excel"""
    data = load_all_data()
    return data.get("transactions", [])

@app.post("/api/transactions")
def create_transaction(transaction: Transaction):
    """Create a new transaction and save to Excel"""
    transaction_dict = transaction.dict()
    transaction_dict["Type"] = transaction_dict.pop("type", "expense")
    transaction_dict["Category"] = transaction_dict.pop("category", "Other")
    transaction_dict["Amount"] = transaction_dict.pop("amount", 0)
    transaction_dict["Description"] = transaction_dict.pop("description", "")
    transaction_dict["Date"] = transaction_dict.pop("date") or datetime.now().strftime('%Y-%m-%d')
    
    saved = save_transaction(transaction_dict)
    return saved

@app.put("/api/transactions/{transaction_id}")
def update_transaction(transaction_id: int, transaction: Transaction):
    """Update a transaction in Excel"""
    wb = load_excel_file()
    from excel_storage import get_sheet_data, save_sheet_data
    
    transactions = get_sheet_data(wb, 'Transactions')
    
    for i, t in enumerate(transactions):
        if t.get('ID') == transaction_id:
            transaction_dict = transaction.dict()
            transaction_dict['ID'] = transaction_id
            transaction_dict["Type"] = transaction_dict.pop("type", "expense")
            transaction_dict["Category"] = transaction_dict.pop("category", "Other")
            transaction_dict["Amount"] = transaction_dict.pop("amount", 0)
            transaction_dict["Description"] = transaction_dict.pop("description", "")
            transaction_dict["Date"] = transaction_dict.pop("date") or t.get("Date", datetime.now().strftime('%Y-%m-%d'))
            transaction_dict["Time"] = t.get("Time", datetime.now().strftime('%H:%M:%S'))
            transaction_dict["Created At"] = t.get("Created At", datetime.now().isoformat())
            
            transactions[i] = transaction_dict
            headers = ['ID', 'Date', 'Time', 'Type', 'Category', 'Subcategory', 'Amount', 'Description', 'Created At']
            save_sheet_data(wb, 'Transactions', transactions, headers)
            from excel_storage import update_summary
            update_summary(wb)
            return transaction_dict
    
    raise HTTPException(status_code=404, detail="Transaction not found")

@app.delete("/api/transactions/{transaction_id}")
def delete_transaction(transaction_id: int):
    """Delete a transaction from Excel"""
    wb = load_excel_file()
    from excel_storage import get_sheet_data, save_sheet_data
    
    transactions = get_sheet_data(wb, 'Transactions')
    original_length = len(transactions)
    transactions = [t for t in transactions if t.get('ID') != transaction_id]
    
    if len(transactions) == original_length:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    headers = ['ID', 'Date', 'Time', 'Type', 'Category', 'Subcategory', 'Amount', 'Description', 'Created At']
    save_sheet_data(wb, 'Transactions', transactions, headers)
    from excel_storage import update_summary
    update_summary(wb)
    
    return {"message": "Transaction deleted successfully"}

@app.get("/api/summary")
def get_summary():
    """Get budget summary from Excel"""
    data = load_all_data()
    summary = data.get("summary", [])
    
    # Convert summary to dict
    summary_dict = {item.get("Metric", ""): item.get("Value", "") for item in summary}
    
    return summary_dict

@app.get("/api/excel/download")
def download_excel():
    """Download the Excel file"""
    if os.path.exists(EXCEL_FILE):
        return FileResponse(
            EXCEL_FILE,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            filename="budget_data.xlsx"
        )
    raise HTTPException(status_code=404, detail="Excel file not found")

@app.post("/api/excel/backup")
def create_backup():
    """Create a backup of the Excel file"""
    backup_path = backup_excel_file()
    if backup_path:
        return {"message": "Backup created", "file": backup_path}
    raise HTTPException(status_code=500, detail="Failed to create backup")

@app.get("/api/excel/all-data")
def get_all_data():
    """Get all data from Excel (transactions, expenses, savings, budgets)"""
    return load_all_data()

@app.post("/api/google-sheets/sync")
def sync_to_google_sheets():
    """Sync all data to Google Sheets"""
    from google_sheets import sync_to_google_sheets
    result = sync_to_google_sheets()
    return result

@app.post("/api/google-sheets/import")
def import_from_google_sheets():
    """Import data from Google Sheets"""
    from google_sheets import sync_from_google_sheets
    result = sync_from_google_sheets()
    return result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

