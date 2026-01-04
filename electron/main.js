const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  if (isDev) {
    // Try Docker first, then fallback to npm start
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../build/index.html'));
  }
  
  // Set window title
  mainWindow.setTitle('Budget Calculator');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers for file operations
ipcMain.handle('get-app-path', () => {
  return app.getPath('userData');
});

// Get data directory path
const getDataDir = () => {
  const userData = app.getPath('userData');
  const dataDir = path.join(userData, 'budget-calculator-data');
  return dataDir;
};

// Ensure data directory exists
const ensureDataDir = async () => {
  const dataDir = getDataDir();
  try {
    await fs.mkdir(dataDir, { recursive: true });
  } catch (error) {
    console.error('Error creating data directory:', error);
  }
  return dataDir;
};

// Save data to file
ipcMain.handle('save-file', async (event, filename, data) => {
  try {
    const dataDir = await ensureDataDir();
    const filePath = path.join(dataDir, filename);
    await fs.writeFile(filePath, data, 'utf8');
    return { success: true, path: filePath };
  } catch (error) {
    console.error('Error saving file:', error);
    return { success: false, error: error.message };
  }
});

// Load data from file
ipcMain.handle('load-file', async (event, filename) => {
  try {
    const dataDir = getDataDir();
    const filePath = path.join(dataDir, filename);
    const data = await fs.readFile(filePath, 'utf8');
    return data;
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File doesn't exist yet, return null
      return null;
    }
    console.error('Error loading file:', error);
    return null;
  }
});

// List all data files
ipcMain.handle('list-files', async () => {
  try {
    const dataDir = await ensureDataDir();
    const files = await fs.readdir(dataDir);
    return files;
  } catch (error) {
    console.error('Error listing files:', error);
    return [];
  }
});

// Initialize data directory on app ready
app.whenReady().then(async () => {
  await ensureDataDir();
  console.log('📁 Data directory initialized:', getDataDir());
});

