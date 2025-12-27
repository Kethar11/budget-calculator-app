import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { db } from '../utils/database';
import './SavingsCalculator.css';

const SavingsCalculator = () => {
  const [savings, setSavings] = useState([]);
  const [formData, setFormData] = useState({
    goal: '',
    currentAmount: '',
    targetAmount: '',
    monthlyContribution: '',
    interestRate: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSavings();
  }, []);

  const loadSavings = async () => {
    try {
      const allSavings = await db.savings.toArray();
      setSavings(allSavings);
    } catch (error) {
      console.error('Error loading savings:', error);
    } finally {
      setLoading(false);
    }
  };

  const addSavingsGoal = async (e) => {
    e.preventDefault();
    if (!formData.goal || !formData.currentAmount || !formData.targetAmount || !formData.monthlyContribution) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      await db.savings.add({
        ...formData,
        currentAmount: parseFloat(formData.currentAmount),
        targetAmount: parseFloat(formData.targetAmount),
        monthlyContribution: parseFloat(formData.monthlyContribution),
        interestRate: parseFloat(formData.interestRate) || 0,
        date: new Date().toISOString(),
        createdAt: new Date().toISOString()
      });
      setFormData({
        goal: '',
        currentAmount: '',
        targetAmount: '',
        monthlyContribution: '',
        interestRate: ''
      });
      await loadSavings();
    } catch (error) {
      console.error('Error adding savings goal:', error);
      alert('Error adding savings goal');
    }
  };

  const deleteSavingsGoal = async (id) => {
    try {
      await db.savings.delete(id);
      await loadSavings();
    } catch (error) {
      console.error('Error deleting savings goal:', error);
    }
  };

  const calculateSavingsProjection = (saving) => {
    const monthlyRate = (saving.interestRate || 0) / 100 / 12;
    const months = [];
    let current = saving.currentAmount;
    const target = saving.targetAmount;
    const monthly = saving.monthlyContribution;
    
    let month = 0;
    while (current < target && month < 120) { // Max 10 years
      current = current * (1 + monthlyRate) + monthly;
      months.push({
        month: month + 1,
        amount: parseFloat(current.toFixed(2)),
        target: target
      });
      month++;
      if (current >= target) break;
    }
    
    return {
      monthsToGoal: month,
      finalAmount: parseFloat(current.toFixed(2)),
      projection: months
    };
  };

  const savingsProjections = useMemo(() => {
    return savings.map(saving => ({
      ...saving,
      projection: calculateSavingsProjection(saving)
    }));
  }, [savings]);

  const totalSavings = useMemo(() => {
    return savings.reduce((sum, s) => sum + (s.currentAmount || 0), 0);
  }, [savings]);

  const totalTarget = useMemo(() => {
    return savings.reduce((sum, s) => sum + (s.targetAmount || 0), 0);
  }, [savings]);

  const progressData = savings.map(s => ({
    name: s.goal,
    current: s.currentAmount,
    target: s.targetAmount,
    remaining: s.targetAmount - s.currentAmount
  }));

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="savings-calculator">
      <div className="savings-grid">
        <div className="savings-form-section">
          <div className="savings-form-card">
            <h2>Add Savings Goal</h2>
            <form onSubmit={addSavingsGoal}>
              <div className="form-group">
                <label>Goal Name</label>
                <input
                  type="text"
                  value={formData.goal}
                  onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Current Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.currentAmount}
                  onChange={(e) => setFormData({ ...formData, currentAmount: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Target Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.targetAmount}
                  onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Monthly Contribution ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.monthlyContribution}
                  onChange={(e) => setFormData({ ...formData, monthlyContribution: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Annual Interest Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.interestRate}
                  onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                />
              </div>
              <button type="submit" className="submit-btn">Add Savings Goal</button>
            </form>
          </div>
        </div>

        <div className="savings-summary-section">
          <div className="savings-summary-card">
            <h2>Savings Summary</h2>
            <div className="summary-stats">
              <div className="stat-item">
                <div className="stat-label">Total Current Savings</div>
                <div className="stat-value positive">${totalSavings.toFixed(2)}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Total Target</div>
                <div className="stat-value">${totalTarget.toFixed(2)}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Remaining to Save</div>
                <div className="stat-value negative">${(totalTarget - totalSavings).toFixed(2)}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Progress</div>
                <div className="stat-value">
                  {totalTarget > 0 ? ((totalSavings / totalTarget) * 100).toFixed(1) : 0}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {savingsProjections.length > 0 && (
        <div className="savings-charts-section">
          <div className="chart-card">
            <h3>Savings Progress</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={progressData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                <Legend />
                <Bar dataKey="current" fill="#10b981" name="Current" />
                <Bar dataKey="target" fill="#667eea" name="Target" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {savingsProjections.map(saving => (
            <div key={saving.id} className="chart-card">
              <h3>{saving.goal} - Projection</h3>
              <div className="projection-info">
                <p><strong>Months to Goal:</strong> {saving.projection.monthsToGoal}</p>
                <p><strong>Final Amount:</strong> ${saving.projection.finalAmount.toFixed(2)}</p>
              </div>
              {saving.projection.projection.length > 0 && (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={saving.projection.projection}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                    <Area type="monotone" dataKey="amount" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                    <Line type="monotone" dataKey="target" stroke="#667eea" strokeWidth={2} strokeDasharray="5 5" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="savings-list-section">
        <div className="savings-list-card">
          <h2>Your Savings Goals</h2>
          {savings.length === 0 ? (
            <div className="empty-state">No savings goals yet. Add one above!</div>
          ) : (
            <div className="savings-list">
              {savings.map(saving => {
                const projection = calculateSavingsProjection(saving);
                const progress = (saving.currentAmount / saving.targetAmount) * 100;
                return (
                  <div key={saving.id} className="savings-item">
                    <div className="savings-header">
                      <h3>{saving.goal}</h3>
                      <button
                        className="delete-btn"
                        onClick={() => {
                          if (window.confirm('Delete this savings goal?')) {
                            deleteSavingsGoal(saving.id);
                          }
                        }}
                      >
                        Delete
                      </button>
                    </div>
                    <div className="savings-details">
                      <div className="detail-item">
                        <span className="detail-label">Current:</span>
                        <span className="detail-value">${saving.currentAmount.toFixed(2)}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Target:</span>
                        <span className="detail-value">${saving.targetAmount.toFixed(2)}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Monthly:</span>
                        <span className="detail-value">${saving.monthlyContribution.toFixed(2)}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Interest:</span>
                        <span className="detail-value">{saving.interestRate || 0}%</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Months to Goal:</span>
                        <span className="detail-value">{projection.monthsToGoal}</span>
                      </div>
                    </div>
                    <div className="progress-bar-container">
                      <div className="progress-bar" style={{ width: `${Math.min(progress, 100)}%` }}></div>
                      <span className="progress-text">{progress.toFixed(1)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SavingsCalculator;

