import React, { useState, useEffect } from 'react';
import { Bell, Plus, Edit2, Trash2, CheckCircle, Circle, Calendar, Clock, AlertCircle, Search } from 'lucide-react';
import { db } from '../utils/database';
import './Reminders.css';

const Reminders = () => {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'active', 'completed'
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    reminderDate: '',
    reminderTime: '',
    priority: 'medium' // 'low', 'medium', 'high'
  });

  useEffect(() => {
    loadReminders();
  }, []);

  const loadReminders = async () => {
    try {
      const allReminders = await db.reminders.orderBy('reminderDate').toArray();
      setReminders(allReminders);
    } catch (error) {
      console.error('Error loading reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const reminderData = {
        ...formData,
        isCompleted: false,
        createdAt: editingReminder ? editingReminder.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (editingReminder) {
        await db.reminders.update(editingReminder.id, reminderData);
      } else {
        await db.reminders.add(reminderData);
      }

      resetForm();
      loadReminders();
    } catch (error) {
      console.error('Error saving reminder:', error);
      alert('Error saving reminder');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this reminder?')) {
      try {
        await db.reminders.delete(id);
        loadReminders();
      } catch (error) {
        console.error('Error deleting reminder:', error);
        alert('Error deleting reminder');
      }
    }
  };

  const handleToggleComplete = async (reminder) => {
    try {
      await db.reminders.update(reminder.id, {
        isCompleted: !reminder.isCompleted,
        updatedAt: new Date().toISOString()
      });
      loadReminders();
    } catch (error) {
      console.error('Error updating reminder:', error);
    }
  };

  const handleEdit = (reminder) => {
    setEditingReminder(reminder);
    setFormData({
      title: reminder.title,
      description: reminder.description || '',
      reminderDate: reminder.reminderDate || '',
      reminderTime: reminder.reminderTime || '',
      priority: reminder.priority || 'medium'
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      reminderDate: '',
      reminderTime: '',
      priority: 'medium'
    });
    setEditingReminder(null);
    setShowForm(false);
  };

  const filteredReminders = reminders.filter(reminder => {
    const matchesSearch = reminder.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (reminder.description && reminder.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesFilter = filterStatus === 'all' ||
                         (filterStatus === 'active' && !reminder.isCompleted) ||
                         (filterStatus === 'completed' && reminder.isCompleted);
    
    return matchesSearch && matchesFilter;
  });

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#64748b';
    }
  };

  const getPriorityLabel = (priority) => {
    return priority.charAt(0).toUpperCase() + priority.slice(1);
  };

  const isOverdue = (reminder) => {
    if (reminder.isCompleted || !reminder.reminderDate) return false;
    const reminderDateTime = new Date(`${reminder.reminderDate}T${reminder.reminderTime || '23:59'}`);
    return reminderDateTime < new Date();
  };

  if (loading) {
    return <div className="loading">Loading reminders...</div>;
  }

  return (
    <div className="reminders-container">
      <div className="reminders-header">
        <div className="header-title">
          <Bell size={24} />
          <h2>Reminders & Notes</h2>
        </div>
        <button className="add-reminder-btn" onClick={() => setShowForm(!showForm)}>
          <Plus size={20} />
          {showForm ? 'Cancel' : 'Add Reminder'}
        </button>
      </div>

      {showForm && (
        <div className="reminder-form-card">
          <h3>{editingReminder ? 'Edit Reminder' : 'New Reminder'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter reminder title"
                required
              />
            </div>

            <div className="form-group">
              <label>Description / Notes</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Add notes or description..."
                rows="4"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>
                  <Calendar size={16} />
                  Date
                </label>
                <input
                  type="date"
                  value={formData.reminderDate}
                  onChange={(e) => setFormData({ ...formData, reminderDate: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>
                  <Clock size={16} />
                  Time
                </label>
                <input
                  type="time"
                  value={formData.reminderTime}
                  onChange={(e) => setFormData({ ...formData, reminderTime: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="form-actions">
              <button type="submit" className="submit-btn">
                {editingReminder ? 'Update Reminder' : 'Add Reminder'}
              </button>
              <button type="button" className="cancel-btn" onClick={resetForm}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="reminders-filters">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search reminders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
            onClick={() => setFilterStatus('all')}
          >
            All ({reminders.length})
          </button>
          <button
            className={`filter-btn ${filterStatus === 'active' ? 'active' : ''}`}
            onClick={() => setFilterStatus('active')}
          >
            Active ({reminders.filter(r => !r.isCompleted).length})
          </button>
          <button
            className={`filter-btn ${filterStatus === 'completed' ? 'active' : ''}`}
            onClick={() => setFilterStatus('completed')}
          >
            Completed ({reminders.filter(r => r.isCompleted).length})
          </button>
        </div>
      </div>

      <div className="reminders-list">
        {filteredReminders.length === 0 ? (
          <div className="empty-state">
            <Bell size={48} />
            <p>No reminders found</p>
            <p className="empty-hint">Click "Add Reminder" to create your first reminder or note</p>
          </div>
        ) : (
          filteredReminders.map(reminder => {
            const overdue = isOverdue(reminder);
            return (
              <div
                key={reminder.id}
                className={`reminder-card ${reminder.isCompleted ? 'completed' : ''} ${overdue ? 'overdue' : ''}`}
              >
                <div className="reminder-checkbox" onClick={() => handleToggleComplete(reminder)}>
                  {reminder.isCompleted ? (
                    <CheckCircle size={24} className="checked" />
                  ) : (
                    <Circle size={24} />
                  )}
                </div>

                <div className="reminder-content">
                  <div className="reminder-header">
                    <h4 className={reminder.isCompleted ? 'strikethrough' : ''}>{reminder.title}</h4>
                    <div className="reminder-priority" style={{ backgroundColor: getPriorityColor(reminder.priority) + '20', color: getPriorityColor(reminder.priority) }}>
                      {getPriorityLabel(reminder.priority)}
                    </div>
                  </div>

                  {reminder.description && (
                    <p className={`reminder-description ${reminder.isCompleted ? 'strikethrough' : ''}`}>
                      {reminder.description}
                    </p>
                  )}

                  <div className="reminder-meta">
                    {reminder.reminderDate && (
                      <div className="meta-item">
                        <Calendar size={14} />
                        <span>{new Date(reminder.reminderDate).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}</span>
                      </div>
                    )}
                    {reminder.reminderTime && (
                      <div className="meta-item">
                        <Clock size={14} />
                        <span>{reminder.reminderTime}</span>
                      </div>
                    )}
                    {overdue && !reminder.isCompleted && (
                      <div className="meta-item overdue-badge">
                        <AlertCircle size={14} />
                        <span>Overdue</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="reminder-actions">
                  <button
                    className="action-btn edit-btn"
                    onClick={() => handleEdit(reminder)}
                    title="Edit"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    className="action-btn delete-btn"
                    onClick={() => handleDelete(reminder.id)}
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Reminders;

