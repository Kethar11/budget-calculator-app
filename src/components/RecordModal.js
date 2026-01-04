import React, { useState } from 'react';
import { X, Edit2, Eye } from 'lucide-react';
import './RecordModal.css';

/**
 * Generic Record Modal Component
 * Supports both read and edit modes
 */
const RecordModal = ({ record, recordType, onClose, onUpdate, onDelete, formComponent: FormComponent, formatAmount }) => {
  const [isEditMode, setIsEditMode] = useState(false);

  if (!record) return null;

  const handleClose = () => {
    setIsEditMode(false);
    onClose();
  };

  const handleUpdate = async (updatedData) => {
    await onUpdate(updatedData);
    setIsEditMode(false);
  };

  const handleDelete = async () => {
    if (window.confirm(`Delete this ${recordType}?`)) {
      if (onDelete) {
        await onDelete(record.id);
      }
      handleClose();
    }
  };

  return (
    <div className="record-modal-overlay" onClick={handleClose}>
      <div className="record-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="record-modal-header">
          <h2>
            {isEditMode ? `Edit ${recordType}` : `View ${recordType}`}
          </h2>
          <div className="record-modal-actions">
            {!isEditMode && (
              <button
                className="modal-edit-btn"
                onClick={() => setIsEditMode(true)}
                title="Edit record"
              >
                <Edit2 size={18} />
                Edit
              </button>
            )}
            <button
              className="modal-close-btn"
              onClick={handleClose}
              title="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="record-modal-body">
          {isEditMode ? (
            <FormComponent
              record={record}
              onSave={handleUpdate}
              onCancel={() => setIsEditMode(false)}
              formatAmount={formatAmount}
            />
          ) : (
            <div className="record-view-mode">
              {FormComponent && (
                <FormComponent
                  record={record}
                  readOnly={true}
                  formatAmount={formatAmount}
                />
              )}
              {onDelete && (
                <div className="record-modal-footer">
                  <button
                    className="modal-delete-btn"
                    onClick={handleDelete}
                    title={`Delete ${recordType}`}
                  >
                    Delete {recordType}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecordModal;

