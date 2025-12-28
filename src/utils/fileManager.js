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
      originalFileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      fileData,
      uploadedAt: new Date().toISOString(),
      isDeleted: false,
      deletedAt: null
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
 * Get all files for a transaction (excluding deleted ones)
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
    
    // Filter out undefined and deleted files
    return files.filter(f => f !== undefined && !f.isDeleted);
  } catch (error) {
    console.error('Error getting files for transaction:', error);
    return [];
  }
};

/**
 * Rename file
 */
export const renameFile = async (fileId, newFileName) => {
  try {
    await db.files.update(fileId, { fileName: newFileName });
    return await db.files.get(fileId);
  } catch (error) {
    console.error('Error renaming file:', error);
    throw error;
  }
};

/**
 * Move file to bin (soft delete)
 */
export const moveFileToBin = async (fileId, transactionId, transactionType) => {
  try {
    // Mark file as deleted
    await db.files.update(fileId, {
      isDeleted: true,
      deletedAt: new Date().toISOString()
    });
    
    // Remove file reference from transaction
    const table = transactionType === 'transaction' ? db.transactions :
                  transactionType === 'expense' ? db.expenses :
                  db.savings;
    
    const record = await table.get(transactionId);
    if (record && record.files) {
      record.files = record.files.filter(id => id !== fileId);
      await table.update(transactionId, { files: record.files });
    }
    
    return await db.files.get(fileId);
  } catch (error) {
    console.error('Error moving file to bin:', error);
    throw error;
  }
};

/**
 * Restore file from bin
 */
export const restoreFileFromBin = async (fileId) => {
  try {
    const file = await db.files.get(fileId);
    if (!file) {
      throw new Error('File not found');
    }
    
    // Restore file
    await db.files.update(fileId, {
      isDeleted: false,
      deletedAt: null
    });
    
    // Add file reference back to transaction
    const table = file.transactionType === 'transaction' ? db.transactions :
                  file.transactionType === 'expense' ? db.expenses :
                  db.savings;
    
    const record = await table.get(file.transactionId);
    if (record) {
      if (!record.files) {
        record.files = [];
      }
      if (!record.files.includes(fileId)) {
        record.files.push(fileId);
        await table.update(file.transactionId, { files: record.files });
      }
    }
    
    return await db.files.get(fileId);
  } catch (error) {
    console.error('Error restoring file:', error);
    throw error;
  }
};

/**
 * Permanently delete file from bin
 */
export const permanentlyDeleteFile = async (fileId) => {
  try {
    await db.files.delete(fileId);
  } catch (error) {
    console.error('Error permanently deleting file:', error);
    throw error;
  }
};

/**
 * Get all files in bin
 */
export const getFilesInBin = async () => {
  try {
    const allFiles = await db.files.toArray();
    return allFiles.filter(file => file.isDeleted === true);
  } catch (error) {
    console.error('Error getting files in bin:', error);
    return [];
  }
};

/**
 * Delete file from IndexedDB (legacy - now uses moveFileToBin)
 */
export const deleteFile = async (fileId, transactionId, transactionType) => {
  // Use soft delete (move to bin) instead of hard delete
  return await moveFileToBin(fileId, transactionId, transactionType);
};

/**
 * Delete all files for a transaction (when transaction is deleted) - Move to bin
 */
export const deleteFilesForTransaction = async (transactionId, transactionType) => {
  try {
    const files = await getFilesForTransaction(transactionId, transactionType);
    for (const file of files) {
      if (file && file.id) {
        // Move to bin instead of permanent delete
        await moveFileToBin(file.id, transactionId, transactionType);
      }
    }
  } catch (error) {
    console.error('Error moving files to bin:', error);
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
