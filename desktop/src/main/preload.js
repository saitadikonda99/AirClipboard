const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('clippr', {
  getHistory: () => ipcRenderer.invoke('get-history'),
  getDevices: () => ipcRenderer.invoke('get-devices'),
  getDeviceInfo: () => ipcRenderer.invoke('get-device-info'),
  clearHistory: () => ipcRenderer.invoke('clear-history'),
  removeDevice: (id) => ipcRenderer.invoke('remove-device', id),
  acceptPair: () => ipcRenderer.send('pair-accept'),
  rejectPair: () => ipcRenderer.send('pair-reject'),
  on: (channel, fn) => {
    const allowed = ['pair-request', 'history-update', 'devices-update', 'show-history', 'show-settings'];
    if (allowed.includes(channel)) ipcRenderer.on(channel, (_, ...args) => fn(...args));
  },
  off: (channel, fn) => ipcRenderer.removeListener(channel, fn),
});
