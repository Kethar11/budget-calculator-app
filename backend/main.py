from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import json
import os

app = FastAPI(title="Budget Calculator API")

# CORS middleware for Electron app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data storage file (simple JSON file for persistence)
DATA_FILE = "budget_data.json"

class Transaction(BaseModel):
    id: Optional[int] = None
    type: str  # 'income' or 'expense'
    category: str
    amount: float
    description: str
    date: Optional[str] = None

def load_data():
    """Load transactions from JSON file"""
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, 'r') as f:
            return json.load(f)
    return {"transactions": []}

def save_data(data):
    """Save transactions to JSON file"""
    with open(DATA_FILE, 'w') as f:
        json.dump(data, f, indent=2)

@app.get("/")
def read_root():
    return {"message": "Budget Calculator API", "version": "1.0.0"}

@app.get("/api/transactions", response_model=List[Transaction])
def get_transactions():
    """Get all transactions"""
    data = load_data()
    return data.get("transactions", [])

@app.post("/api/transactions", response_model=Transaction)
def create_transaction(transaction: Transaction):
    """Create a new transaction"""
    data = load_data()
    transactions = data.get("transactions", [])
    
    # Generate ID
    if transactions:
        new_id = max(t.get("id", 0) for t in transactions) + 1
    else:
        new_id = 1
    
    transaction_dict = transaction.dict()
    transaction_dict["id"] = new_id
    transaction_dict["date"] = transaction.date or datetime.now().isoformat()
    
    transactions.append(transaction_dict)
    data["transactions"] = transactions
    save_data(data)
    
    return transaction_dict

@app.put("/api/transactions/{transaction_id}", response_model=Transaction)
def update_transaction(transaction_id: int, transaction: Transaction):
    """Update a transaction"""
    data = load_data()
    transactions = data.get("transactions", [])
    
    for i, t in enumerate(transactions):
        if t.get("id") == transaction_id:
            transaction_dict = transaction.dict()
            transaction_dict["id"] = transaction_id
            transaction_dict["date"] = transaction.date or transactions[i].get("date")
            transactions[i] = transaction_dict
            data["transactions"] = transactions
            save_data(data)
            return transaction_dict
    
    raise HTTPException(status_code=404, detail="Transaction not found")

@app.delete("/api/transactions/{transaction_id}")
def delete_transaction(transaction_id: int):
    """Delete a transaction"""
    data = load_data()
    transactions = data.get("transactions", [])
    
    original_length = len(transactions)
    transactions = [t for t in transactions if t.get("id") != transaction_id]
    
    if len(transactions) == original_length:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    data["transactions"] = transactions
    save_data(data)
    
    return {"message": "Transaction deleted successfully"}

@app.get("/api/summary")
def get_summary():
    """Get budget summary"""
    data = load_data()
    transactions = data.get("transactions", [])
    
    income = sum(t.get("amount", 0) for t in transactions if t.get("type") == "income")
    expenses = sum(t.get("amount", 0) for t in transactions if t.get("type") == "expense")
    balance = income - expenses
    
    return {
        "income": income,
        "expenses": expenses,
        "balance": balance,
        "total_transactions": len(transactions)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

