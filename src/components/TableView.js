import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, List, BarChart3, Trash2 } from 'lucide-react';
import './TableView.css';

const TableView = ({ data, columns, viewType, onViewChange, title, emptyMessage, chartContent, onRowClick, onRowDoubleClick, onBulkDelete, showBulkDelete = false }) => {
  const [selectedRowId, setSelectedRowId] = useState(null);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(20);

  // Pagination logic
  const totalPages = Math.ceil(data.length / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = startIndex + recordsPerPage;
  const paginatedData = useMemo(() => {
    return data.slice(startIndex, endIndex);
  }, [data, startIndex, endIndex]);

  // Reset to page 1 when data changes
  React.useEffect(() => {
    setCurrentPage(1);
    setSelectedRows(new Set()); // Clear selections when data changes
  }, [data.length]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
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
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {showBulkDelete && selectedRows.size > 0 && (
            <button
              className="bulk-delete-btn"
              onClick={() => {
                if (window.confirm(`Delete ${selectedRows.size} selected record(s)?`)) {
                  onBulkDelete(Array.from(selectedRows));
                  setSelectedRows(new Set());
                }
              }}
              style={{
                padding: '6px 12px',
                background: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '13px',
                fontWeight: '500'
              }}
              title={`Delete ${selectedRows.size} selected`}
            >
              <Trash2 size={16} />
              Delete ({selectedRows.size})
            </button>
          )}
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
      </div>
      
      <div className="table-content-area">
        {viewType === 'list' ? (
          <>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    {showBulkDelete && (
                      <th style={{ width: '40px' }}>
                        <input
                          type="checkbox"
                          checked={paginatedData.length > 0 && paginatedData.every(row => {
                            const rowId = row.id || data.findIndex(r => r === row);
                            return selectedRows.has(rowId);
                          })}
                          onChange={(e) => {
                            if (e.target.checked) {
                              const newSelected = new Set(selectedRows);
                              paginatedData.forEach(row => {
                                const rowId = row.id || data.findIndex(r => r === row);
                                newSelected.add(rowId);
                              });
                              setSelectedRows(newSelected);
                            } else {
                              const newSelected = new Set(selectedRows);
                              paginatedData.forEach(row => {
                                const rowId = row.id || data.findIndex(r => r === row);
                                newSelected.delete(rowId);
                              });
                              setSelectedRows(newSelected);
                            }
                          }}
                          title="Select all on this page"
                        />
                      </th>
                    )}
                    {columns.map((col, index) => (
                      <th key={index}>{col.header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.map((row, rowIndex) => {
                    const rowId = row.id || data.findIndex(r => r === row);
                    const isSelected = selectedRowId === rowId;
                    const isBulkSelected = selectedRows.has(rowId);
                    return (
                      <tr 
                        key={rowId}
                        className={`${isSelected ? 'selected-row' : ''} ${isBulkSelected ? 'bulk-selected-row' : ''}`}
                        onClick={(e) => {
                          // Don't trigger row click if clicking checkbox
                          if (e.target.type !== 'checkbox') {
                            setSelectedRowId(rowId);
                            if (onRowClick) {
                              onRowClick(row);
                            }
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
                        {showBulkDelete && (
                          <td onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isBulkSelected}
                              onChange={(e) => {
                                const newSelected = new Set(selectedRows);
                                if (e.target.checked) {
                                  newSelected.add(rowId);
                                } else {
                                  newSelected.delete(rowId);
                                }
                                setSelectedRows(newSelected);
                              }}
                            />
                          </td>
                        )}
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
            
            {data.length > 0 && (
              <div className="pagination-controls">
                <div className="pagination-info">
                  <span>Showing {startIndex + 1}-{Math.min(endIndex, data.length)} of {data.length}</span>
                  <select
                    value={recordsPerPage}
                    onChange={(e) => {
                      setRecordsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="records-per-page-select"
                  >
                    <option value={10}>10 per page</option>
                    <option value={20}>20 per page</option>
                    <option value={50}>50 per page</option>
                    <option value={100}>100 per page</option>
                  </select>
                </div>
                
                <div className="pagination-buttons">
                  <button
                    className="pagination-btn"
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                    title="First page"
                  >
                    <ChevronsLeft size={16} />
                  </button>
                  <button
                    className="pagination-btn"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    title="Previous page"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  
                  <span className="page-numbers">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          className={`pagination-btn page-number ${currentPage === pageNum ? 'active' : ''}`}
                          onClick={() => handlePageChange(pageNum)}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </span>
                  
                  <button
                    className="pagination-btn"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    title="Next page"
                  >
                    <ChevronRight size={16} />
                  </button>
                  <button
                    className="pagination-btn"
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    title="Last page"
                  >
                    <ChevronsRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
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

