import React, { useState } from 'react';
import { List, BarChart3 } from 'lucide-react';
import './TableView.css';

const TableView = ({ data, columns, viewType, onViewChange, title, emptyMessage, chartContent, onRowClick, onRowDoubleClick }) => {
  const [selectedRowId, setSelectedRowId] = useState(null);
  if (data.length === 0) {
    return (
      <div className="table-view-container">
        <div className="table-header-compact">
          <h3>{title}</h3>
          <div className="view-toggle-compact">
            <button
              className={`toggle-btn-compact ${viewType === 'list' ? 'active' : ''}`}
              onClick={() => onViewChange('list')}
              title="List View"
            >
              <List size={18} />
            </button>
            <button
              className={`toggle-btn-compact ${viewType === 'chart' ? 'active' : ''}`}
              onClick={() => onViewChange('chart')}
              title="Chart View"
            >
              <BarChart3 size={18} />
            </button>
          </div>
        </div>
        <div className="empty-state">{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div className="table-view-container">
      <div className="table-header-compact">
        <h3>{title}</h3>
        <div className="view-toggle-compact">
          <button
            className={`toggle-btn-compact ${viewType === 'list' ? 'active' : ''}`}
            onClick={() => onViewChange('list')}
            title="List View"
          >
            <List size={18} />
          </button>
          <button
            className={`toggle-btn-compact ${viewType === 'chart' ? 'active' : ''}`}
            onClick={() => onViewChange('chart')}
            title="Chart View"
          >
            <BarChart3 size={18} />
          </button>
        </div>
      </div>
      
      <div className="table-content-area">
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
                {data.map((row, rowIndex) => {
                  const rowId = row.id || rowIndex;
                  const isSelected = selectedRowId === rowId;
                  return (
                    <tr 
                      key={rowIndex}
                      className={isSelected ? 'selected-row' : ''}
                      onClick={() => {
                        setSelectedRowId(rowId);
                        if (onRowClick) {
                          onRowClick(row);
                        }
                      }}
                      onDoubleClick={() => {
                        if (onRowDoubleClick) {
                          onRowDoubleClick(row);
                        }
                      }}
                      style={{ cursor: 'pointer' }}
                      title="Double-click to view/edit"
                    >
                      {columns.map((col, colIndex) => (
                        <td key={colIndex}>
                          {col.render ? col.render(row[col.key], row) : row[col.key]}
                        </td>
                      ))}
                    </tr>
                  );
                })}
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
    </div>
  );
};

export default TableView;

