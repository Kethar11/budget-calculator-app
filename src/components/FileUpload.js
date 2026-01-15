import React, { useState, useEffect } from 'react';
import { Upload, X, FileText, Download, Edit2, Check, Trash2 } from 'lucide-react';
import { saveFile, moveFileToBin, renameFile, downloadFile, formatFileSize, getFile } from '../utils/fileManager';
import './FileUpload.css';

const FileUpload = ({ transactionId, transactionType, onFilesChange, existingFiles = [], compact = false }) => {
  const [files, setFiles] = useState(existingFiles);
  const [uploading, setUploading] = useState(false);
  const [editingFileId, setEditingFileId] = useState(null);
  const [editFileName, setEditFileName] = useState('');

  useEffect(() => {
    setFiles(existingFiles);
  }, [existingFiles]);

  // Only accept PDFs for simplicity
  const acceptedFormats = ['application/pdf'];

  const handleFileSelect = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    const validFiles = selectedFiles.filter(file => {
      if (!acceptedFormats.includes(file.type)) {
        alert(`${file.name} is not a PDF file. Only PDF files are supported.`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        alert(`${file.name} is too large. Maximum file size is 10MB.`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setUploading(true);
    try {
      const newFileIds = [];
      for (const file of validFiles) {
        const fileId = await saveFile(file, transactionId, transactionType);
        newFileIds.push(fileId);
        
        // Sync to Google Sheets
        try {
          await syncFileToGoogleSheets(file, fileId, transactionId, transactionType);
        } catch (syncError) {
          console.warn('Failed to sync file to Google Sheets:', syncError);
          // Continue even if sync fails
        }
      }

      // Reload files
      const updatedFiles = await Promise.all(
        newFileIds.map(id => getFile(id))
      );
      
      setFiles([...files, ...updatedFiles]);
      if (onFilesChange) {
        onFilesChange([...files, ...updatedFiles]);
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Error uploading files. Please try again.');
    } finally {
      setUploading(false);
      e.target.value = ''; // Reset input
    }
  };

  // Sync file to Google Sheets
  const syncFileToGoogleSheets = async (file, fileId, transactionId, transactionType) => {
    try {
      // Convert file to base64 for Google Sheets
      const fileData = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Send to backend for Google Sheets sync
      const response = await fetch('http://localhost:8000/api/google-sheets/upload-file', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileId,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          fileData: fileData,
          transactionId,
          transactionType,
          uploadedAt: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to sync to Google Sheets');
      }
    } catch (error) {
      console.error('Error syncing file to Google Sheets:', error);
      throw error;
    }
  };

  const handleDeleteFile = async (fileId, index) => {
    if (!window.confirm('Move this file to bin? You can restore it later from the File Bin.')) {
      return;
    }

    try {
      await moveFileToBin(fileId, transactionId, transactionType);
      const updatedFiles = files.filter((_, i) => i !== index);
      setFiles(updatedFiles);
      if (onFilesChange) {
        onFilesChange(updatedFiles);
      }
    } catch (error) {
      console.error('Error moving file to bin:', error);
      alert('Error moving file to bin. Please try again.');
    }
  };

  const handleStartRename = (file) => {
    setEditingFileId(file.id);
    setEditFileName(file.fileName);
  };

  const handleCancelRename = () => {
    setEditingFileId(null);
    setEditFileName('');
  };

  const handleSaveRename = async (fileId) => {
    if (!editFileName.trim()) {
      alert('File name cannot be empty');
      return;
    }

    try {
      await renameFile(fileId, editFileName.trim());
      const updatedFiles = files.map(f => 
        f.id === fileId ? { ...f, fileName: editFileName.trim() } : f
      );
      setFiles(updatedFiles);
      if (onFilesChange) {
        onFilesChange(updatedFiles);
      }
      setEditingFileId(null);
      setEditFileName('');
    } catch (error) {
      console.error('Error renaming file:', error);
      alert('Error renaming file. Please try again.');
    }
  };

  const handleDownload = (fileRecord) => {
    downloadFile(fileRecord);
  };

  const getFileIcon = () => {
    return <FileText size={18} />; // Only PDFs, so always show PDF icon
  };

  if (compact) {
    return (
      <div className="file-upload-compact">
        <label className="file-upload-compact-label" title="Add PDF Files">
          <FileText size={14} />
          <input
            type="file"
            multiple
            accept=".pdf,application/pdf"
            onChange={handleFileSelect}
            className="file-input"
            disabled={uploading || !transactionId}
          />
        </label>
        {files.length > 0 && (
          <span className="file-count-badge" title={`${files.length} PDF(s) attached`}>
            {files.length}
          </span>
        )}
        {files.length > 0 && (
          <div className="files-dropdown">
            {files.map((file, index) => (
              <div key={file.id || index} className="file-dropdown-item">
                <span>{file.fileName}</span>
                <div className="file-dropdown-actions">
                  <button onClick={() => handleDownload(file)} title="Download PDF">
                    <Download size={12} />
                  </button>
                  <button onClick={() => handleStartRename(file)} title="Rename">
                    <Edit2 size={12} />
                  </button>
                  <button onClick={() => handleDeleteFile(file.id, index)} title="Move to Bin">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="file-upload-container">
      <div className="file-upload-section">
        <label className="file-upload-label">
          <Upload size={18} />
          <span>Attach PDF Files (Optional)</span>
          <span className="file-upload-hint">PDF files only - will sync to Google Sheets (Max 10MB each)</span>
        </label>
        <input
          type="file"
          multiple
          accept=".pdf,application/pdf"
          onChange={handleFileSelect}
          className="file-input"
          disabled={uploading || !transactionId}
        />
        {uploading && <div className="uploading-indicator">Uploading & syncing to Google Sheets...</div>}
      </div>

      {files.length > 0 && (
        <div className="files-list">
          <h4>Attached Files ({files.length})</h4>
          <div className="files-grid">
            {files.map((file, index) => (
              <div key={file.id || index} className="file-item">
                <div className="file-icon">
                  {getFileIcon(file.fileType)}
                </div>
                <div className="file-info">
                  {editingFileId === file.id ? (
                    <div className="file-rename-input">
                      <input
                        type="text"
                        value={editFileName}
                        onChange={(e) => setEditFileName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveRename(file.id);
                          } else if (e.key === 'Escape') {
                            handleCancelRename();
                          }
                        }}
                        className="rename-input"
                        autoFocus
                      />
                      <button
                        className="file-action-btn save"
                        onClick={() => handleSaveRename(file.id)}
                        title="Save"
                      >
                        <Check size={14} />
                      </button>
                      <button
                        className="file-action-btn cancel"
                        onClick={handleCancelRename}
                        title="Cancel"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="file-name" title={file.fileName}>
                      {file.fileName}
                    </div>
                  )}
                  <div className="file-meta">
                    {formatFileSize(file.fileSize)} • {new Date(file.uploadedAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="file-actions">
                  {editingFileId !== file.id && (
                    <>
                      <button
                        className="file-action-btn"
                        onClick={() => handleDownload(file)}
                        title="Download PDF"
                      >
                        <Download size={14} />
                      </button>
                      <button
                        className="file-action-btn edit"
                        onClick={() => handleStartRename(file)}
                        title="Rename"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        className="file-action-btn delete"
                        onClick={() => handleDeleteFile(file.id, index)}
                        title="Move to Bin"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default FileUpload;

