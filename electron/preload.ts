import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  loadItems: () => ipcRenderer.invoke('storage:load'),
  saveItems: (items: unknown[]) => ipcRenderer.invoke('storage:save', items),
});
