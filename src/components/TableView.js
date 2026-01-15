import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, List, BarChart3 } from 'lucide-react';
import './TableView.css';

const TableView = ({ data, columns, viewType, onViewChange, title, emptyMessage, chartContent, onRowClick, onRowDoubleClick }) => {
  const [selectedRowId, setSelectedRowId] = useState(null);
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
          <>
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
                  {paginatedData.map((row, rowIndex) => {
                    const rowId = row.id || startIndex + rowIndex;
                    const isSelected = selectedRowId === rowId;
                    return (
                      <tr 
                        key={rowId}
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

