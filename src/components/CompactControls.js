import React from 'react';
import { List, BarChart3, Search, Filter, Calendar, X } from 'lucide-react';
import './CompactControls.css';

const CompactControls = ({
  viewType,
  onViewChange,
  searchQuery,
  onSearchChange,
  categoryFilter,
  onCategoryFilterChange,
  categories,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onClearFilters,
  showFilters = true,
  showDateRange = true,
  showSearch = true,
  showViewToggle = true
}) => {
  const hasActiveFilters = startDate || endDate || categoryFilter !== 'all' || searchQuery;

  return (
    <div className="compact-controls-bar">
      <div className="controls-left">
        {showViewToggle && (
          <div className="control-group view-toggle-group">
            <button
              className={`control-btn ${viewType === 'list' ? 'active' : ''}`}
              onClick={() => onViewChange('list')}
              title="List View"
            >
              <List size={16} />
              <span>List</span>
            </button>
            <button
              className={`control-btn ${viewType === 'chart' ? 'active' : ''}`}
              onClick={() => onViewChange('chart')}
              title="Chart View"
            >
              <BarChart3 size={16} />
              <span>Charts</span>
            </button>
          </div>
        )}

        {showSearch && (
          <div className="control-group search-group">
            <Search size={16} className="control-icon" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="compact-search-input"
            />
          </div>
        )}

        {showFilters && (
          <div className="control-group filter-group">
            <Filter size={16} className="control-icon" />
            <select
              value={categoryFilter}
              onChange={(e) => onCategoryFilterChange(e.target.value)}
              className="compact-select"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        )}

        {showDateRange && (
          <div className="control-group date-group">
            <Calendar size={16} className="control-icon" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="compact-date-input"
              placeholder="From"
            />
            <span className="date-separator">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="compact-date-input"
              placeholder="To"
            />
          </div>
        )}
      </div>

      <div className="controls-right">
        {hasActiveFilters && (
          <button
            className="control-btn clear-btn"
            onClick={onClearFilters}
            title="Clear All Filters"
          >
            <X size={16} />
            <span>Clear</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default CompactControls;




