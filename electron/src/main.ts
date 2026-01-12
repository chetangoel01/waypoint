import { app, BrowserWindow, shell } from 'electron';
import path from 'path';
import { spawn, ChildProcess } from 'child_process';

// Check if running in development
const isDev = !app.isPackaged;

let mainWindow: BrowserWindow | null = null;
let serverProcess: ChildProcess | null = null;

const SERVER_PORT = 3001;
const CLIENT_PORT = 5173;
const HEALTH_CHECK_URL = `http://localhost:${SERVER_PORT}/api/health`;

// Get database path based on environment
function getDatabasePath(): string {
  if (isDev) {
    return path.join(__dirname, '../../server/data/app.db');
  }
  // In production, use user data folder
  return path.join(app.getPath('userData'), 'app.db');
}

// Health check with retry
async function waitForServer(maxRetries = 30, delay = 500): Promise<boolean> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(HEALTH_CHECK_URL);
      if (response.ok) {
        console.log('Server is ready');
        return true;
      }
    } catch {
      // Server not ready yet
    }
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  return false;
}

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
    const dbPath = getDatabasePath();

    console.log(`Starting server with database at: ${dbPath}`);

    serverProcess = spawn('node', ['index.js'], {
      cwd: serverPath,
      env: {
        ...process.env,
        PORT: SERVER_PORT.toString(),
        NODE_ENV: 'production',
        DATABASE_PATH: dbPath,
        CLIENT_URL: `file://${path.join(__dirname, '../../client/dist')}`,
        SERVER_URL: `http://localhost:${SERVER_PORT}`,
      },
    });

    serverProcess.stdout?.on('data', (data) => {
      console.log(`Server: ${data}`);
    });

    serverProcess.stderr?.on('data', (data) => {
      console.error(`Server error: ${data}`);
    });

    serverProcess.on('error', (error) => {
      console.error('Failed to start server:', error);
      reject(error);
    });

    // Wait for server to be ready via health check
    waitForServer()
      .then((ready) => {
        if (ready) {
          resolve();
        } else {
          reject(new Error('Server failed to start within timeout'));
        }
      })
      .catch(reject);
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
