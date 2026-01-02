import React, { useState, useEffect, useMemo } from 'react';
import { Target, TrendingUp, AlertCircle, Lightbulb, CheckCircle } from 'lucide-react';
import { db } from '../utils/database';
import './BudgetPlanner.css';

const BudgetPlanner = ({ transactions }) => {
  const [budgets, setBudgets] = useState([]);
  const [formData, setFormData] = useState({
    category: '',
    monthlyLimit: '',
    description: ''
  });
  const [recurringTransactions, setRecurringTransactions] = useState([]);
  const [recurringForm, setRecurringForm] = useState({
    type: 'expense',
    category: '',
    amount: '',
    description: '',
    frequency: 'monthly',
    startDate: ''
  });
  const [showRecommendations, setShowRecommendations] = useState(true);

  useEffect(() => {
    loadBudgets();
    loadRecurring();
  }, []);

  const loadBudgets = async () => {
    try {
      // Check if budgets table exists
      if (db.budgets) {
        const allBudgets = await db.budgets.toArray();
        setBudgets(allBudgets);
      } else {
        setBudgets([]);
      }
    } catch (error) {
      console.error('Error loading budgets:', error);
      setBudgets([]);
    }
  };

  const loadRecurring = async () => {
    try {
      if (db.recurring) {
        const allRecurring = await db.recurring.toArray();
        setRecurringTransactions(allRecurring);
      } else {
        setRecurringTransactions([]);
      }
    } catch (error) {
      console.error('Error loading recurring:', error);
      setRecurringTransactions([]);
    }
  };

  const addBudget = async (e) => {
    e.preventDefault();
    if (!formData.category || !formData.monthlyLimit) {
      alert('Please fill in category and monthly limit');
      return;
    }

    try {
      if (db.budgets) {
        await db.budgets.add({
          ...formData,
          monthlyLimit: parseFloat(formData.monthlyLimit),
          createdAt: new Date().toISOString()
        });
        setFormData({ category: '', monthlyLimit: '', description: '' });
        await loadBudgets();
      } else {
        alert('Budget feature is not available. Please refresh the page.');
      }
    } catch (error) {
      console.error('Error adding budget:', error);
      alert('Error adding budget. Please try again.');
    }
  };

  const budgetVsActual = useMemo(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthTransactions = transactions.filter(t => {
      const date = new Date(t.date || t.createdAt);
      return date.toISOString().slice(0, 7) === currentMonth && t.type === 'expense';
    });

    return budgets.map(budget => {
      const actual = monthTransactions
        .filter(t => t.category === budget.category)
        .reduce((sum, t) => sum + (t.amount || 0), 0);
      const remaining = budget.monthlyLimit - actual;
      const percentage = (actual / budget.monthlyLimit) * 100;

      return {
        ...budget,
        actual,
        remaining,
        percentage: Math.min(percentage, 100),
        isOverBudget: actual > budget.monthlyLimit
      };
    });
  }, [budgets, transactions]);

  // Calculate recommended budgets based on spending patterns
  const recommendedBudgets = useMemo(() => {
    if (transactions.length === 0) return [];

    // Get last 3 months of expense data
    const now = new Date();
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    
    const recentExpenses = transactions.filter(t => {
      const date = new Date(t.date || t.createdAt);
      return t.type === 'expense' && date >= threeMonthsAgo;
    });

    // Calculate average spending per category
    const categorySpending = {};
    const categoryCounts = {};
    
    recentExpenses.forEach(t => {
      const category = t.category || 'Other';
      categorySpending[category] = (categorySpending[category] || 0) + (t.amount || 0);
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });

    // Generate recommendations (add 20% buffer for recommended budget)
    const recommendations = Object.entries(categorySpending)
      .map(([category, total]) => {
        const months = Math.max(1, Math.floor((now - threeMonthsAgo) / (1000 * 60 * 60 * 24 * 30)));
        const avgMonthly = total / months;
        const recommended = Math.ceil(avgMonthly * 1.2); // 20% buffer
        
        // Only recommend if not already budgeted and spending is significant (>50€/month)
        const alreadyBudgeted = budgets.some(b => b.category === category);
        
        return {
          category,
          recommendedAmount: recommended,
          averageSpending: avgMonthly,
          transactionCount: categoryCounts[category],
          alreadyBudgeted
        };
      })
      .filter(rec => !rec.alreadyBudgeted && rec.recommendedAmount >= 50)
      .sort((a, b) => b.recommendedAmount - a.recommendedAmount)
      .slice(0, 5); // Top 5 recommendations

    return recommendations;
  }, [transactions, budgets]);

  const applyRecommendation = async (category, amount) => {
    try {
      if (db.budgets) {
        await db.budgets.add({
          category,
          monthlyLimit: amount,
          description: 'Recommended budget based on spending patterns',
          createdAt: new Date().toISOString()
        });
        await loadBudgets();
        // Show success message
        alert(`Budget of €${amount.toFixed(2)} set for ${category}!`);
      }
    } catch (error) {
      console.error('Error applying recommendation:', error);
      alert('Error setting recommended budget. Please try again.');
    }
  };

  const categories = [
    'Fixed Expenses',
    'Food',
    'Transport',
    'Lifestyle',
    'Shopping',
    'Travel',
    'Donation',
    'Savings & Investments',
    'Send Money to Parents',
    'Other'
  ];

  return (
    <div className="budget-planner">
      {showRecommendations && recommendedBudgets.length > 0 && (
        <div className="recommendations-card">
          <div className="recommendations-header">
            <h3>
              <Lightbulb size={20} className="icon-inline" />
              Recommended Budgets
            </h3>
            <button 
              className="close-recommendations"
              onClick={() => setShowRecommendations(false)}
              title="Hide recommendations"
            >
              ×
            </button>
          </div>
          <p className="recommendations-description">
            Based on your spending patterns over the last 3 months, here are suggested budgets:
          </p>
          <div className="recommendations-list">
            {recommendedBudgets.map((rec, index) => (
              <div key={index} className="recommendation-item">
                <div className="recommendation-info">
                  <div className="recommendation-category">{rec.category}</div>
                  <div className="recommendation-details">
                    <span>Avg: €{rec.averageSpending.toFixed(2)}/month</span>
                    <span>•</span>
                    <span>{rec.transactionCount} transactions</span>
                  </div>
                </div>
                <div className="recommendation-action">
                  <div className="recommended-amount">
                    Recommended: €{rec.recommendedAmount.toFixed(2)}
                  </div>
                  <button
                    className="apply-recommendation-btn"
                    onClick={() => applyRecommendation(rec.category, rec.recommendedAmount)}
                  >
                    <CheckCircle size={16} />
                    Apply
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="planner-grid">
        <div className="planner-form-section">
          <div className="planner-card">
            <h3>
              <Target size={20} className="icon-inline" />
              Set Monthly Budget
            </h3>
            <form onSubmit={addBudget}>
              <div className="form-group">
                <label>Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                >
                  <option value="">Select category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Monthly Limit (€)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.monthlyLimit}
                  onChange={(e) => setFormData({ ...formData, monthlyLimit: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description (Optional)</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <button type="submit" className="submit-btn">Set Budget</button>
            </form>
          </div>
        </div>

        <div className="budget-status-section">
          <div className="planner-card">
            <h3>
              <TrendingUp size={20} className="icon-inline" />
              Budget vs Actual
            </h3>
            {budgetVsActual.length === 0 ? (
              <div className="empty-state">No budgets set yet. Set a budget above!</div>
            ) : (
              <div className="budget-list">
                {budgetVsActual.map(budget => (
                  <div key={budget.id} className={`budget-item ${budget.isOverBudget ? 'over-budget' : ''}`}>
                    <div className="budget-header">
                      <span className="budget-category">{budget.category}</span>
                      <span className={`budget-status ${budget.isOverBudget ? 'warning' : 'good'}`}>
                        {budget.isOverBudget ? (
                          <>
                            <AlertCircle size={14} className="icon-inline" />
                            Over Budget
                          </>
                        ) : (
                          <>
                            <TrendingUp size={14} className="icon-inline" />
                            On Track
                          </>
                        )}
                      </span>
                    </div>
                    <div className="budget-progress">
                      <div className="progress-bar-container">
                        <div
                          className={`progress-bar ${budget.isOverBudget ? 'over' : ''}`}
                          style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                        ></div>
                      </div>
                      <div className="budget-amounts">
                        <span>Spent: €{budget.actual.toFixed(2)}</span>
                        <span>Limit: €{budget.monthlyLimit.toFixed(2)}</span>
                        <span className={budget.remaining >= 0 ? 'positive' : 'negative'}>
                          {budget.remaining >= 0 ? 'Remaining: ' : 'Over by: '}
                          €{Math.abs(budget.remaining).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetPlanner;

