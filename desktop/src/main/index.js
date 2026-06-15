const { app, BrowserWindow, ipcMain, dialog, Notification } = require('electron');
const path = require('path');

const wsServer = require('./websocket/server');
const bonjour = require('./discovery/bonjour');
const clipboardMonitor = require('./clipboard/monitor');
const trayManager = require('./tray/tray');
const history = require('./history/history');
const pairing = require('./pairing/pairing');

app.setName('Clippr');
// Keep app running when all windows are closed (tray app)
app.on('window-all-closed', (e) => e.preventDefault());

let mainWindow = null;
let pendingPairWs = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 420,
    height: 600,
    show: false,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  const rendererPath = path.join(__dirname, '../../dist/renderer.js');
  mainWindow.loadFile(path.join(__dirname, '../../src/renderer/index.html'));

  mainWindow.on('close', (e) => {
    e.preventDefault();
    mainWindow.hide();
  });
}

app.whenReady().then(() => {
  createWindow();

  // Start WebSocket server
  wsServer.start({
    onStatusChange: (info) => {
      const devices = wsServer.getConnectedDevices();
      trayManager.setDevices(devices);
      if (mainWindow) mainWindow.webContents.send('devices-update', devices);
    },
    onPairRequest: ({ deviceId, deviceName, code, ws, sharedKey }) => {
      pendingPairWs = ws;
      if (mainWindow) {
        mainWindow.show();
        mainWindow.webContents.send('pair-request', { deviceId, deviceName, code });
      }
      // Also show notification
      new Notification({ title: 'Clippr', body: `Pair request from ${deviceName}` }).show();
    },
    onClipboardReceived: (entry) => {
      if (mainWindow) mainWindow.webContents.send('history-update', history.getHistory());
    },
  });

  // Advertise via mDNS
  bonjour.advertise();

  // Start clipboard monitor
  clipboardMonitor.startMonitoring((text) => {
    wsServer.broadcastClipboard(text);
    history.addEntry({
      id: require('uuid').v4(),
      content: text,
      timestamp: Date.now(),
      source: pairing.getMyDeviceName(),
      type: 'text/plain',
      direction: 'sent',
    });
    if (mainWindow) mainWindow.webContents.send('history-update', history.getHistory());
  });

  // Create tray
  trayManager.createTray(mainWindow);
});

// IPC handlers
ipcMain.handle('get-history', () => history.getHistory());
ipcMain.handle('get-devices', () => wsServer.getConnectedDevices());
ipcMain.handle('get-device-info', () => ({
  deviceId: pairing.getMyDeviceId(),
  deviceName: pairing.getMyDeviceName(),
  trustedDevices: pairing.getTrustedDevices(),
}));
ipcMain.handle('clear-history', () => { history.clearHistory(); return true; });
ipcMain.handle('remove-device', (_, deviceId) => { pairing.removeDevice(deviceId); return true; });

ipcMain.on('pair-accept', () => {
  if (pendingPairWs) {
    wsServer.acceptPairing(pendingPairWs);
    pendingPairWs = null;
  }
});

ipcMain.on('pair-reject', () => {
  if (pendingPairWs) {
    wsServer.rejectPairing(pendingPairWs);
    pendingPairWs = null;
  }
});

app.on('before-quit', () => {
  clipboardMonitor.stopMonitoring();
  bonjour.stop();
  wsServer.stop();
  trayManager.destroy();
});
