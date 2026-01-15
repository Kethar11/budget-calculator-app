import React from 'react';
import { Calendar, X } from 'lucide-react';
import './DateRangePicker.css';

const DateRangePicker = ({ startDate, endDate, onStartDateChange, onEndDateChange, onClear }) => {
  return (
    <div className="date-range-picker">
      <div className="date-range-header">
        <Calendar size={18} className="icon-inline" />
        <span className="date-range-label">Filter by Date Range</span>
        {onClear && (startDate || endDate) && (
          <button className="clear-date-btn" onClick={onClear}>
            <X size={14} />
            Clear
          </button>
        )}
      </div>
      <div className="date-inputs">
        <div className="date-input-group">
          <label>From Date</label>
          <input
            type="date"
            value={startDate || ''}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="date-input"
          />
        </div>
        <div className="date-separator">→</div>
        <div className="date-input-group">
          <label>To Date</label>
          <input
            type="date"
            value={endDate || ''}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="date-input"
            min={startDate || undefined}
          />
        </div>
      </div>
    </div>
  );
};

export default DateRangePicker;




