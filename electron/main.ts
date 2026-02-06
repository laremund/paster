import { app, BrowserWindow, ipcMain } from 'electron';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const STORAGE_KEY = 'paster_items';

function getStoragePath(): string {
  return path.join(app.getPath('userData'), 'paster-data.json');
}

function loadItemsFromDisk(): unknown[] {
  try {
    const data = fs.readFileSync(getStoragePath(), 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function saveItemsToDisk(items: unknown[]): void {
  fs.writeFileSync(getStoragePath(), JSON.stringify(items), 'utf-8');
}

// The built Electron app will look for the preload script at this path
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

const iconPath = path.join(
  __dirname,
  '..',
  'build',
  process.platform === 'win32' ? 'icon-win.png' : 'icon.png'
);

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    // In development, load from Vite dev server
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load from the built files
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  ipcMain.handle('storage:load', () => loadItemsFromDisk());
  ipcMain.handle('storage:save', (_event, items: unknown[]) => {
    saveItemsToDisk(items);
  });

  createWindow();

  app.on('activate', () => {
    // On macOS, re-create a window when the dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
