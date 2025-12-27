import { db } from './database';

/**
 * Convert file to base64 for storage in IndexedDB
 */
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Save file to IndexedDB
 */
export const saveFile = async (file, transactionId, transactionType) => {
  try {
    const fileData = await fileToBase64(file);
    const fileRecord = {
      transactionId,
      transactionType, // 'transaction', 'expense', 'savings'
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      fileData,
      uploadedAt: new Date().toISOString()
    };
    
    const fileId = await db.files.add(fileRecord);
    
    // Update the transaction/expense/savings record to include file reference
    const table = transactionType === 'transaction' ? db.transactions :
                  transactionType === 'expense' ? db.expenses :
                  db.savings;
    
    const record = await table.get(transactionId);
    if (record) {
      if (!record.files) {
        record.files = [];
      }
      record.files.push(fileId);
      await table.update(transactionId, { files: record.files });
    }
    
    return fileId;
  } catch (error) {
    console.error('Error saving file:', error);
    throw error;
  }
};

/**
 * Get file from IndexedDB
 */
export const getFile = async (fileId) => {
  try {
    const fileRecord = await db.files.get(fileId);
    return fileRecord;
  } catch (error) {
    console.error('Error getting file:', error);
    throw error;
  }
};

/**
 * Get all files for a transaction
 */
export const getFilesForTransaction = async (transactionId, transactionType) => {
  try {
    const table = transactionType === 'transaction' ? db.transactions :
                  transactionType === 'expense' ? db.expenses :
                  db.savings;
    
    const record = await table.get(transactionId);
    if (!record || !record.files || record.files.length === 0) {
      return [];
    }
    
    const files = await Promise.all(
      record.files.map(fileId => db.files.get(fileId))
    );
    
    return files.filter(f => f !== undefined);
  } catch (error) {
    console.error('Error getting files for transaction:', error);
    return [];
  }
};

/**
 * Delete file from IndexedDB
 */
export const deleteFile = async (fileId, transactionId, transactionType) => {
  try {
    // Remove file from IndexedDB
    await db.files.delete(fileId);
    
    // Remove file reference from transaction
    const table = transactionType === 'transaction' ? db.transactions :
                  transactionType === 'expense' ? db.expenses :
                  db.savings;
    
    const record = await table.get(transactionId);
    if (record && record.files) {
      record.files = record.files.filter(id => id !== fileId);
      await table.update(transactionId, { files: record.files });
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

/**
 * Delete all files for a transaction (when transaction is deleted)
 */
export const deleteFilesForTransaction = async (transactionId, transactionType) => {
  try {
    const files = await getFilesForTransaction(transactionId, transactionType);
    for (const file of files) {
      if (file && file.id) {
        await db.files.delete(file.id);
      }
    }
  } catch (error) {
    console.error('Error deleting files for transaction:', error);
    // Don't throw - allow transaction deletion even if file deletion fails
  }
};

/**
 * Download file
 */
export const downloadFile = (fileRecord) => {
  try {
    const link = document.createElement('a');
    link.href = fileRecord.fileData;
    link.download = fileRecord.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error downloading file:', error);
  }
};

/**
 * Format file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Check if file type is image
 */
export const isImageFile = (fileType) => {
  return fileType && fileType.startsWith('image/');
};

/**
 * Check if file type is PDF
 */
export const isPDFFile = (fileType) => {
  return fileType === 'application/pdf';
};
