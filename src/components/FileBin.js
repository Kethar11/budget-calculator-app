import React, { useState, useEffect } from 'react';
import { Trash2, RotateCcw, X, File, Image, FileText, Download, Eye, Search } from 'lucide-react';
import { getFilesInBin, restoreFileFromBin, permanentlyDeleteFile, downloadFile, formatFileSize, isImageFile, isPDFFile } from '../utils/fileManager';
import './FileBin.css';

const FileBin = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewFile, setPreviewFile] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFiles, setSelectedFiles] = useState(new Set());

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      const binFiles = await getFilesInBin();
      setFiles(binFiles);
    } catch (error) {
      console.error('Error loading files from bin:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (fileId) => {
    try {
      await restoreFileFromBin(fileId);
      await loadFiles();
      alert('File restored successfully!');
    } catch (error) {
      console.error('Error restoring file:', error);
      alert('Error restoring file. Please try again.');
    }
  };

  const handlePermanentDelete = async (fileId) => {
    if (!window.confirm('Are you sure you want to permanently delete this file? This action cannot be undone.')) {
      return;
    }

    try {
      await permanentlyDeleteFile(fileId);
      await loadFiles();
      alert('File permanently deleted.');
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Error deleting file. Please try again.');
    }
  };

  const handleRestoreSelected = async () => {
    if (selectedFiles.size === 0) {
      alert('Please select files to restore.');
      return;
    }

    try {
      for (const fileId of selectedFiles) {
        await restoreFileFromBin(parseInt(fileId));
      }
      setSelectedFiles(new Set());
      await loadFiles();
      alert(`${selectedFiles.size} file(s) restored successfully!`);
    } catch (error) {
      console.error('Error restoring files:', error);
      alert('Error restoring files. Please try again.');
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedFiles.size === 0) {
      alert('Please select files to delete.');
      return;
    }

    if (!window.confirm(`Are you sure you want to permanently delete ${selectedFiles.size} file(s)? This action cannot be undone.`)) {
      return;
    }

    try {
      for (const fileId of selectedFiles) {
        await permanentlyDeleteFile(parseInt(fileId));
      }
      setSelectedFiles(new Set());
      await loadFiles();
      alert(`${selectedFiles.size} file(s) permanently deleted.`);
    } catch (error) {
      console.error('Error deleting files:', error);
      alert('Error deleting files. Please try again.');
    }
  };

  const handleSelectFile = (fileId) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(fileId)) {
      newSelected.delete(fileId);
    } else {
      newSelected.add(fileId);
    }
    setSelectedFiles(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedFiles.size === filteredFiles.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(filteredFiles.map(f => f.id)));
    }
  };

  const filteredFiles = files.filter(file => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return file.fileName.toLowerCase().includes(query) ||
           file.originalFileName?.toLowerCase().includes(query) ||
           file.transactionType.toLowerCase().includes(query);
  });

  const getFileIcon = (fileType) => {
    if (isImageFile(fileType)) {
      return <Image size={18} />;
    } else if (isPDFFile(fileType)) {
      return <FileText size={18} />;
    }
    return <File size={18} />;
  };

  if (loading) {
    return <div className="loading">Loading bin...</div>;
  }

  return (
    <div className="file-bin-container">
      <div className="file-bin-header">
        <div className="bin-header-content">
          <Trash2 size={24} />
          <h2>File Bin</h2>
          <span className="bin-count">({files.length} file{files.length !== 1 ? 's' : ''})</span>
        </div>
        {selectedFiles.size > 0 && (
          <div className="bulk-actions">
            <button onClick={handleRestoreSelected} className="restore-btn">
              <RotateCcw size={16} />
              Restore Selected ({selectedFiles.size})
            </button>
            <button onClick={handleDeleteSelected} className="delete-btn">
              <X size={16} />
              Delete Selected ({selectedFiles.size})
            </button>
          </div>
        )}
      </div>

      <div className="bin-search">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search files in bin..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {filteredFiles.length === 0 ? (
        <div className="empty-bin">
          <Trash2 size={48} />
          <p>{files.length === 0 ? 'Bin is empty' : 'No files match your search'}</p>
        </div>
      ) : (
        <div className="bin-files-list">
          <div className="bin-list-header">
            <input
              type="checkbox"
              checked={selectedFiles.size === filteredFiles.length && filteredFiles.length > 0}
              onChange={handleSelectAll}
              className="select-all-checkbox"
            />
            <span className="header-label">Select All</span>
          </div>
          {filteredFiles.map((file) => (
            <div key={file.id} className="bin-file-item">
              <input
                type="checkbox"
                checked={selectedFiles.has(file.id)}
                onChange={() => handleSelectFile(file.id)}
                className="file-checkbox"
              />
              <div className="file-icon">
                {getFileIcon(file.fileType)}
              </div>
              <div className="file-info">
                <div className="file-name" title={file.fileName}>
                  {file.fileName}
                </div>
                <div className="file-meta">
                  {formatFileSize(file.fileSize)} • {file.transactionType} • Deleted: {new Date(file.deletedAt).toLocaleDateString()}
                </div>
              </div>
              <div className="file-actions">
                {isImageFile(file.fileType) && (
                  <button
                    className="action-btn"
                    onClick={() => setPreviewFile(file)}
                    title="Preview"
                  >
                    <Eye size={14} />
                  </button>
                )}
                <button
                  className="action-btn"
                  onClick={() => downloadFile(file)}
                  title="Download"
                >
                  <Download size={14} />
                </button>
                <button
                  className="action-btn restore"
                  onClick={() => handleRestore(file.id)}
                  title="Restore"
                >
                  <RotateCcw size={14} />
                </button>
                <button
                  className="action-btn delete"
                  onClick={() => handlePermanentDelete(file.id)}
                  title="Permanently Delete"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {previewFile && (
        <div className="file-preview-modal" onClick={() => setPreviewFile(null)}>
          <div className="file-preview-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-preview" onClick={() => setPreviewFile(null)}>
              <X size={24} />
            </button>
            {isImageFile(previewFile.fileType) ? (
              <img src={previewFile.fileData} alt={previewFile.fileName} className="preview-image" />
            ) : (
              <iframe src={previewFile.fileData} className="preview-iframe" title={previewFile.fileName} />
            )}
            <div className="preview-footer">
              <span>{previewFile.fileName}</span>
              <button onClick={() => downloadFile(previewFile)} className="download-btn">
                <Download size={16} />
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileBin;


