import { app, BrowserWindow, shell } from 'electron';
import path from 'path';
import { spawn, ChildProcess } from 'child_process';

// Check if running in development
const isDev = !app.isPackaged;

let mainWindow: BrowserWindow | null = null;
let serverProcess: ChildProcess | null = null;

const SERVER_PORT = 3001;
const CLIENT_PORT = 5173;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    titleBarStyle: 'hiddenInset',
    show: false,
  });

  // Load the app
  if (isDev) {
    // In development, load from Vite dev server
    mainWindow.loadURL(`http://localhost:${CLIENT_PORT}`);
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load from built files
    mainWindow.loadFile(path.join(__dirname, '../../client/dist/index.html'));
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function startServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (isDev) {
      // In development, assume server is started separately
      console.log('Development mode: expecting server to be running separately');
      resolve();
      return;
    }

    // In production, spawn the server
    const serverPath = path.join(process.resourcesPath, 'server');
    serverProcess = spawn('node', ['index.js'], {
      cwd: serverPath,
      env: {
        ...process.env,
        PORT: SERVER_PORT.toString(),
        NODE_ENV: 'production',
      },
    });

    serverProcess.stdout?.on('data', (data) => {
      console.log(`Server: ${data}`);
      if (data.toString().includes('Server running')) {
        resolve();
      }
    });

    serverProcess.stderr?.on('data', (data) => {
      console.error(`Server error: ${data}`);
    });

    serverProcess.on('error', (error) => {
      console.error('Failed to start server:', error);
      reject(error);
    });

    // Resolve after a short delay if no "Server running" message
    setTimeout(resolve, 2000);
  });
}

function stopServer(): void {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
}

// App lifecycle
app.whenReady().then(async () => {
  try {
    await startServer();
    createWindow();
  } catch (error) {
    console.error('Failed to start application:', error);
    app.quit();
  }

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

app.on('before-quit', () => {
  stopServer();
});

app.on('quit', () => {
  stopServer();
});
