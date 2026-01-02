import React from 'react';
import { X, File, Image, FileText, Download, Eye, ExternalLink } from 'lucide-react';
import { downloadFile, isImageFile, isPDFFile } from '../utils/fileManager';
import './FileLinksModal.css';

const FileLinksModal = ({ files, onClose, transactionType, transactionId }) => {
  if (!files || files.length === 0) {
    return null;
  }

  const handleOpenFile = (file) => {
    // Open file in new tab/window
    const link = document.createElement('a');
    link.href = file.fileData;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePreview = (file) => {
    // For images, show preview in modal
    if (isImageFile(file.fileType)) {
      const previewWindow = window.open('', '_blank');
      previewWindow.document.write(`
        <html>
          <head>
            <title>${file.fileName}</title>
            <style>
              body { margin: 0; padding: 20px; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f5f5f5; }
              img { max-width: 100%; max-height: 90vh; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
            </style>
          </head>
          <body>
            <img src="${file.fileData}" alt="${file.fileName}" />
          </body>
        </html>
      `);
    } else {
      handleOpenFile(file);
    }
  };

  const getFileIcon = (fileType) => {
    if (isImageFile(fileType)) {
      return <Image size={18} />;
    } else if (isPDFFile(fileType)) {
      return <FileText size={18} />;
    }
    return <File size={18} />;
  };

  const getFolderPath = () => {
    const typeMap = {
      'transaction': 'Transactions',
      'expense': 'Expenses',
      'savings': 'Savings'
    };
    let path = `📁 ${typeMap[transactionType] || 'Files'}`;
    if (transactionCategory) {
      path += ` / ${transactionCategory}`;
    }
    if (transactionDescription) {
      const shortDesc = transactionDescription.length > 30 
        ? transactionDescription.substring(0, 30) + '...' 
        : transactionDescription;
      path += ` / ${shortDesc}`;
    }
    path += ` / Transaction #${transactionId}`;
    return path;
  };

  return (
    <div className="file-links-modal-overlay" onClick={onClose}>
      <div className="file-links-modal" onClick={(e) => e.stopPropagation()}>
        <div className="file-links-modal-header">
          <div>
            <h3>Attached Files</h3>
            <p className="file-folder-path">{getFolderPath()}</p>
          </div>
          <button className="close-modal-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="file-links-list">
          {files.map((file, index) => (
            <div key={file.id || index} className="file-link-item">
              <div className="file-link-icon">
                {getFileIcon(file.fileType)}
              </div>
              <div className="file-link-info">
                <button
                  className="file-link-name"
                  onClick={() => handleOpenFile(file)}
                  title="Click to open file"
                >
                  {file.fileName}
                  <ExternalLink size={14} className="external-link-icon" />
                </button>
                <div className="file-link-meta">
                  {file.fileSize ? `${(file.fileSize / 1024).toFixed(2)} KB` : ''} • 
                  {file.uploadedAt ? new Date(file.uploadedAt).toLocaleDateString() : ''}
                </div>
              </div>
              <div className="file-link-actions">
                {isImageFile(file.fileType) && (
                  <button
                    className="file-link-action-btn"
                    onClick={() => handlePreview(file)}
                    title="Preview"
                  >
                    <Eye size={16} />
                  </button>
                )}
                <button
                  className="file-link-action-btn"
                  onClick={() => downloadFile(file)}
                  title="Download"
                >
                  <Download size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="file-links-modal-footer">
          <p>{files.length} file{files.length > 1 ? 's' : ''} attached to this transaction</p>
        </div>
      </div>
    </div>
  );
};

export default FileLinksModal;

