const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('clippr', {
  getHistory: () => ipcRenderer.invoke('get-history'),
  getDevices: () => ipcRenderer.invoke('get-devices'),
  getDeviceInfo: () => ipcRenderer.invoke('get-device-info'),
  getConnectInfo: () => ipcRenderer.invoke('get-connect-info'),
  clearHistory: () => ipcRenderer.invoke('clear-history'),
  removeDevice: (id) => ipcRenderer.invoke('remove-device', id),
  getQrCode: (value) => ipcRenderer.invoke('get-qr-code', value),
  acceptPair: () => ipcRenderer.send('pair-accept'),
  rejectPair: () => ipcRenderer.send('pair-reject'),
  getLoginItem: () => ipcRenderer.invoke('get-login-item'),
  setLoginItem: (enabled) => ipcRenderer.invoke('set-login-item', enabled),
  on: (channel, fn) => {
    const allowed = ['pair-request', 'history-update', 'devices-update', 'show-history', 'show-settings'];
    if (allowed.includes(channel)) ipcRenderer.on(channel, (_, ...args) => fn(...args));
  },
  off: (channel, fn) => ipcRenderer.removeListener(channel, fn),
});
