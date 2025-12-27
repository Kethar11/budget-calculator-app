import React from 'react';
import { List, BarChart3 } from 'lucide-react';
import './TableView.css';

const TableView = ({ data, columns, viewType, onViewChange, title, emptyMessage, chartContent }) => {
  if (data.length === 0) {
    return (
      <div className="table-view-container">
        <div className="table-header">
          <h3>{title}</h3>
          <div className="view-toggle">
            <button
              className={`toggle-btn ${viewType === 'list' ? 'active' : ''}`}
              onClick={() => onViewChange('list')}
            >
              <List size={16} />
              List
            </button>
            <button
              className={`toggle-btn ${viewType === 'chart' ? 'active' : ''}`}
              onClick={() => onViewChange('chart')}
            >
              <BarChart3 size={16} />
              Chart
            </button>
          </div>
        </div>
        <div className="empty-state">{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div className="table-view-container">
      <div className="table-header">
        <h3>{title}</h3>
        <div className="view-toggle">
          <button
            className={`toggle-btn ${viewType === 'list' ? 'active' : ''}`}
            onClick={() => onViewChange('list')}
          >
            <List size={16} />
            List
          </button>
          <button
            className={`toggle-btn ${viewType === 'chart' ? 'active' : ''}`}
            onClick={() => onViewChange('chart')}
          >
            <BarChart3 size={16} />
            Chart
          </button>
        </div>
      </div>
      
      {viewType === 'list' ? (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                {columns.map((col, index) => (
                  <th key={index}>{col.header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {columns.map((col, colIndex) => (
                    <td key={colIndex}>
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        chartContent || (
          <div className="chart-placeholder">
            <p>Switch to Chart view to see visualizations</p>
          </div>
        )
      )}
    </div>
  );
};

export default TableView;

