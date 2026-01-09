import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // App info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  // Platform info
  platform: process.platform,

  // Future IPC methods can be added here
  // For example:
  // openFile: () => ipcRenderer.invoke('dialog:openFile'),
  // saveFile: (data: string) => ipcRenderer.invoke('dialog:saveFile', data),
});

// Type declaration for the exposed API
declare global {
  interface Window {
    electronAPI: {
      getAppVersion: () => Promise<string>;
      platform: NodeJS.Platform;
    };
  }
}
