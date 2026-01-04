import React, { useState, useEffect, useMemo } from 'react';
import { Target, Plus, Trash2, Wallet, CheckCircle, ExternalLink, Link as LinkIcon, Edit2, X } from 'lucide-react';
import { db } from '../utils/database';
import { useCurrency } from '../contexts/CurrencyContext';
import './BuyingGoals.css';

const BuyingGoals = () => {
  const { formatAmount } = useCurrency();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    targetAmount: '',
    goalType: 'small',
    category: '',
    account: '',
    description: '',
    link: ''
  });
  const [contributionForm, setContributionForm] = useState({
    goalId: null,
    amount: '',
    account: ''
  });
  const [editingId, setEditingId] = useState(null); // ID of goal being edited

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      const allGoals = await db.goals.toArray();
      setGoals(allGoals);
    } catch (error) {
      console.error('Error loading goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGoalTypeInfo = (amount) => {
    const numAmount = parseFloat(amount) || 0;
    if (numAmount < 500) return { type: 'small', label: 'Small Goal', color: '#10b981' };
    if (numAmount < 5000) return { type: 'medium', label: 'Medium Goal', color: '#f59e0b' };
    return { type: 'large', label: 'Large Goal', color: '#ef4444' };
  };

  const addGoal = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.targetAmount) {
      alert('Please fill in goal name and target amount');
      return;
    }

    try {
      const goalTypeInfo = getGoalTypeInfo(formData.targetAmount);
      await db.goals.add({
        name: formData.name,
        targetAmount: parseFloat(formData.targetAmount),
        currentAmount: 0,
        goalType: goalTypeInfo.type,
        category: formData.category || '',
        account: formData.account || '',
        description: formData.description || '',
        link: formData.link || '',
        createdAt: new Date().toISOString(),
        contributions: []
      });
      setFormData({
        name: '',
        targetAmount: '',
        goalType: 'small',
        category: '',
        account: '',
        description: '',
        link: ''
      });
      setShowForm(false);
      await loadGoals();
    } catch (error) {
      console.error('Error adding goal:', error);
      alert('Error adding goal');
    }
  };

  const addContribution = async (goalId) => {
    if (!contributionForm.amount) {
      alert('Please enter contribution amount');
      return;
    }

    try {
      const goal = await db.goals.get(goalId);
      if (!goal) return;

      const contribution = {
        amount: parseFloat(contributionForm.amount),
        account: contributionForm.account || '',
        date: new Date().toISOString()
      };

      const updatedContributions = [...(goal.contributions || []), contribution];
      const newCurrentAmount = goal.currentAmount + contribution.amount;

      await db.goals.update(goalId, {
        currentAmount: newCurrentAmount,
        contributions: updatedContributions,
        account: contributionForm.account || goal.account
      });

      setContributionForm({ goalId: null, amount: '', account: '' });
      await loadGoals();
    } catch (error) {
      console.error('Error adding contribution:', error);
      alert('Error adding contribution');
    }
  };

  const deleteGoal = async (id) => {
    if (window.confirm('Delete this goal?')) {
      try {
        await db.goals.delete(id);
        await loadGoals();
      } catch (error) {
        console.error('Error deleting goal:', error);
      }
    }
  };

  const startEdit = (goal) => {
    setEditingId(goal.id);
    setShowForm(true);
    setFormData({
      name: goal.name || '',
      targetAmount: goal.targetAmount || '',
      goalType: getGoalTypeInfo(goal.targetAmount).type,
      category: goal.category || '',
      account: goal.account || '',
      description: goal.description || '',
      link: goal.link || ''
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setShowForm(false);
    setFormData({
      name: '',
      targetAmount: '',
      goalType: 'small',
      category: '',
      account: '',
      description: '',
      link: ''
    });
  };

  const updateGoal = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.targetAmount) {
      alert('Please fill in goal name and target amount');
      return;
    }

    try {
      const goalTypeInfo = getGoalTypeInfo(formData.targetAmount);
      await db.goals.update(editingId, {
        name: formData.name,
        targetAmount: parseFloat(formData.targetAmount),
        goalType: goalTypeInfo.type,
        category: formData.category || '',
        account: formData.account || '',
        description: formData.description || '',
        link: formData.link || ''
      });
      cancelEdit();
      await loadGoals();
    } catch (error) {
      console.error('Error updating goal:', error);
      alert('Error updating goal');
    }
  };

  const goalTypes = ['small', 'medium', 'large'];
  const filteredGoals = useMemo(() => {
    return goals;
  }, [goals]);

  const goalsByType = useMemo(() => {
    const grouped = { small: [], medium: [], large: [] };
    filteredGoals.forEach(goal => {
      const typeInfo = getGoalTypeInfo(goal.targetAmount);
      grouped[typeInfo.type].push(goal);
    });
    return grouped;
  }, [filteredGoals]);

  const totalGoalsValue = useMemo(() => {
    return goals.reduce((sum, g) => sum + (g.targetAmount || 0), 0);
  }, [goals]);

  const totalSaved = useMemo(() => {
    return goals.reduce((sum, g) => sum + (g.currentAmount || 0), 0);
  }, [goals]);

  if (loading) {
    return <div className="loading">Loading goals...</div>;
  }

  return (
    <div className="buying-goals">
      <div className="goals-header">
        <div className="goals-title-section">
          <h2>
            <Target size={24} className="icon-inline" />
            Goals
          </h2>
          <p className="goals-subtitle">Track your purchase goals and savings progress</p>
        </div>
        <button className="add-goal-btn" onClick={() => setShowForm(!showForm)}>
          <Plus size={18} />
          Add Goal
        </button>
      </div>

      <div className="goals-summary">
        <div className="summary-card">
          <div className="summary-label">Total Goals Value</div>
          <div className="summary-value">{formatAmount(totalGoalsValue)}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Total Saved</div>
          <div className="summary-value positive">{formatAmount(totalSaved)}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Remaining</div>
          <div className="summary-value">{formatAmount(totalGoalsValue - totalSaved)}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Progress</div>
          <div className="summary-value">
            {totalGoalsValue > 0 ? ((totalSaved / totalGoalsValue) * 100).toFixed(1) : 0}%
          </div>
        </div>
      </div>

      {showForm && (
        <div className={`goal-form-card ${editingId ? 'editing' : ''}`}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3>{editingId ? 'Edit Goal' : 'Add New Goal'}</h3>
            <button
              type="button"
              onClick={cancelEdit}
              style={{
                padding: '6px 12px',
                background: '#e2e8f0',
                color: '#475569',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '14px'
              }}
            >
              <X size={16} />
              Cancel
            </button>
          </div>
          <form onSubmit={editingId ? updateGoal : addGoal}>
            <div className="form-row">
              <div className="form-group">
                <label>Goal Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., New Laptop, Vacation, Car"
                  required
                />
              </div>
              <div className="form-group">
                <label>Target Amount *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.targetAmount}
                  onChange={(e) => {
                    const amount = e.target.value;
                    setFormData({ 
                      ...formData, 
                      targetAmount: amount,
                      goalType: getGoalTypeInfo(amount).type
                    });
                  }}
                  required
                />
                <div className="goal-type-indicator">
                  Type: <span style={{ color: getGoalTypeInfo(formData.targetAmount).color, fontWeight: 'bold' }}>
                    {getGoalTypeInfo(formData.targetAmount).label}
                  </span>
                </div>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Electronics, Travel, Vehicle"
                />
              </div>
              <div className="form-group">
                <label>Account</label>
                <input
                  type="text"
                  value={formData.account}
                  onChange={(e) => setFormData({ ...formData, account: e.target.value })}
                  placeholder="e.g., Savings Account, Checking"
                />
              </div>
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Additional notes about this goal..."
                rows="3"
              />
            </div>
            <div className="form-group">
              <label>
                <LinkIcon size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                Reference Link (URL)
              </label>
              <input
                type="url"
                value={formData.link}
                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                placeholder="https://example.com/product-link"
              />
              <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                Add a link to where you can buy this item (Amazon, store website, etc.)
              </p>
            </div>
            <div className="form-actions">
              <button type="submit" className="submit-btn">
                {editingId ? 'Update Goal' : 'Add Goal'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="goals-by-type">
        {['small', 'medium', 'large'].map(type => {
          const typeInfo = {
            small: { label: 'Small Goals', color: '#10b981', icon: Target },
            medium: { label: 'Medium Goals', color: '#f59e0b', icon: Target },
            large: { label: 'Large Goals', color: '#ef4444', icon: Target }
          }[type];
          const TypeIcon = typeInfo.icon;

          const typeGoals = goalsByType[type] || [];

          if (typeGoals.length === 0) return null;

          return (
            <div key={type} className="goal-type-section">
              <h3 className="goal-type-header" style={{ borderLeftColor: typeInfo.color }}>
                <TypeIcon size={20} style={{ marginRight: '8px', verticalAlign: 'middle', color: typeInfo.color }} />
                {typeInfo.label} ({typeGoals.length})
              </h3>
              <div className="goals-grid">
                {typeGoals.map(goal => {
                  const progress = (goal.currentAmount / goal.targetAmount) * 100;
                  const isComplete = goal.currentAmount >= goal.targetAmount;

                  return (
                    <div key={goal.id} className={`goal-card ${isComplete ? 'complete' : ''}`}>
                      <div className="goal-card-header">
                        <div>
                          <h4>{goal.name}</h4>
                          {goal.category && <span className="goal-category">{goal.category}</span>}
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <button
                            className="edit-goal-btn"
                            onClick={() => startEdit(goal)}
                            title="Edit goal"
                            style={{
                              padding: '6px 10px',
                              background: '#3b82f6',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '12px'
                            }}
                          >
                            <Edit2 size={14} />
                          </button>
                          {goal.link && (
                            <a
                              href={goal.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="goal-link-btn"
                              title="Open product link"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink size={16} />
                              <span>View Link</span>
                            </a>
                          )}
                          <button
                            className="delete-goal-btn"
                            onClick={() => deleteGoal(goal.id)}
                            title="Delete goal"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      <div className="goal-amounts">
                        <div className="goal-amount-row">
                          <span>Target:</span>
                          <strong>{formatAmount(goal.targetAmount)}</strong>
                        </div>
                        <div className="goal-amount-row">
                          <span>Saved:</span>
                          <strong className={goal.currentAmount >= goal.targetAmount ? 'positive' : ''}>
                            {formatAmount(goal.currentAmount)}
                          </strong>
                        </div>
                        <div className="goal-amount-row">
                          <span>Remaining:</span>
                          <strong>{formatAmount(Math.max(0, goal.targetAmount - goal.currentAmount))}</strong>
                        </div>
                      </div>

                      <div className="goal-progress">
                        <div className="progress-bar-container">
                          <div
                            className="progress-bar"
                            style={{
                              width: `${Math.min(progress, 100)}%`,
                              backgroundColor: isComplete ? '#10b981' : typeInfo.color
                            }}
                          />
                        </div>
                        <div className="progress-text">{progress.toFixed(1)}%</div>
                      </div>

                      {goal.account && (
                        <div className="goal-account">
                          <Wallet size={14} />
                          <span>{goal.account}</span>
                        </div>
                      )}

                      {contributionForm.goalId === goal.id ? (
                        <div className="contribution-form">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Amount"
                            value={contributionForm.amount}
                            onChange={(e) => setContributionForm({ ...contributionForm, amount: e.target.value })}
                            className="contribution-input"
                          />
                          <input
                            type="text"
                            placeholder="Account (optional)"
                            value={contributionForm.account}
                            onChange={(e) => setContributionForm({ ...contributionForm, account: e.target.value })}
                            className="contribution-input"
                          />
                          <div className="contribution-actions">
                            <button
                              className="add-contribution-btn"
                              onClick={() => addContribution(goal.id)}
                            >
                              Add
                            </button>
                            <button
                              className="cancel-contribution-btn"
                              onClick={() => setContributionForm({ goalId: null, amount: '', account: '' })}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          className="add-contribution-toggle"
                          onClick={() => setContributionForm({ goalId: goal.id, amount: '', account: goal.account || '' })}
                        >
                          <Plus size={14} />
                          Add Contribution
                        </button>
                      )}

                      {goal.contributions && goal.contributions.length > 0 && (
                        <div className="contributions-list">
                          <div className="contributions-header">Contributions:</div>
                          {goal.contributions.slice(-5).map((contrib, idx) => (
                            <div key={idx} className="contribution-item">
                              <span>{formatAmount(contrib.amount)}</span>
                              {contrib.account && <span className="contrib-account">{contrib.account}</span>}
                              <span className="contrib-date">
                                {new Date(contrib.date).toLocaleDateString()}
                              </span>
                            </div>
                          ))}
                          {goal.contributions.length > 5 && (
                            <div className="more-contributions">
                              +{goal.contributions.length - 5} more
                            </div>
                          )}
                        </div>
                      )}

                      {isComplete && (
                        <div className="goal-complete-badge">
                          <CheckCircle size={16} />
                          Goal Achieved!
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {goals.length === 0 && (
        <div className="empty-goals">
          <Target size={48} />
          <h3>No goals yet</h3>
          <p>Create your first buying goal to start tracking your savings progress!</p>
          <button className="create-first-goal-btn" onClick={() => setShowForm(true)}>
            <Plus size={18} />
            Create Your First Goal
          </button>
        </div>
      )}
    </div>
  );
};

export default BuyingGoals;

