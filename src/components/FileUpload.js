import React, { useState, useEffect } from 'react';
import { Upload, X, File, Image, FileText, Download, Eye, Edit2, Check, Trash2 } from 'lucide-react';
import { saveFile, moveFileToBin, renameFile, downloadFile, formatFileSize, isImageFile, isPDFFile, getFile } from '../utils/fileManager';
import './FileUpload.css';

const FileUpload = ({ transactionId, transactionType, onFilesChange, existingFiles = [], compact = false }) => {
  const [files, setFiles] = useState(existingFiles);
  const [uploading, setUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [editingFileId, setEditingFileId] = useState(null);
  const [editFileName, setEditFileName] = useState('');

  useEffect(() => {
    setFiles(existingFiles);
  }, [existingFiles]);

  const acceptedFormats = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp',
    'image/tiff',
    'image/tif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ];

  const handleFileSelect = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    const validFiles = selectedFiles.filter(file => {
      if (!acceptedFormats.includes(file.type)) {
        alert(`${file.name} is not a supported file type. Supported formats: Images (JPG, PNG, GIF, WEBP, BMP, TIFF), PDF, Word, Excel, PowerPoint.`);
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

  const handlePreview = (fileRecord) => {
    setPreviewFile(fileRecord);
  };

  const getFileIcon = (fileType) => {
    if (isImageFile(fileType)) {
      return <Image size={18} />;
    } else if (isPDFFile(fileType)) {
      return <FileText size={18} />;
    }
    return <File size={18} />;
  };

  if (compact) {
    return (
      <div className="file-upload-compact">
        <label className="file-upload-compact-label" title="Add/View Files">
          <File size={14} />
          <input
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
            onChange={handleFileSelect}
            className="file-input"
            disabled={uploading || !transactionId}
          />
        </label>
        {files.length > 0 && (
          <span className="file-count-badge" title={`${files.length} file(s) attached`}>
            {files.length}
          </span>
        )}
        {files.length > 0 && (
          <div className="files-dropdown">
            {files.map((file, index) => (
              <div key={file.id || index} className="file-dropdown-item">
                <span>{file.fileName}</span>
                <div className="file-dropdown-actions">
                  {isImageFile(file.fileType) && (
                    <button onClick={() => handlePreview(file)} title="Preview">
                      <Eye size={12} />
                    </button>
                  )}
                  <button onClick={() => handleDownload(file)} title="Download">
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
                <button onClick={() => handleDownload(previewFile)} className="download-btn">
                  <Download size={16} />
                  Download
                </button>
              </div>
            </div>
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
          <span>Attach Files (Optional)</span>
          <span className="file-upload-hint">Images, PDFs, Word, Excel, PowerPoint (Max 10MB each)</span>
        </label>
        <input
          type="file"
          multiple
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
          onChange={handleFileSelect}
          className="file-input"
          disabled={uploading || !transactionId}
        />
        {uploading && <div className="uploading-indicator">Uploading...</div>}
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
                      {isImageFile(file.fileType) && (
                        <button
                          className="file-action-btn"
                          onClick={() => handlePreview(file)}
                          title="Preview"
                        >
                          <Eye size={14} />
                        </button>
                      )}
                      <button
                        className="file-action-btn"
                        onClick={() => handleDownload(file)}
                        title="Download"
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
              <button onClick={() => handleDownload(previewFile)} className="download-btn">
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

export default FileUpload;

