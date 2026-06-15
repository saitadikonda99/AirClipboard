const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

const wsServer = require('./websocket/server');
const bonjour = require('./discovery/bonjour');
const clipboardMonitor = require('./clipboard/monitor');
const trayManager = require('./tray/tray');
const history = require('./history/history');
const pairing = require('./pairing/pairing');
const { showHUD } = require('./notification/hudWindow');

app.setName('AirClipboard');
app.on('window-all-closed', (e) => e.preventDefault());

let mainWindow = null;
let pendingPairWs = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 560,
    show: false,
    titleBarStyle: 'hiddenInset',
    vibrancy: 'under-window',
    visualEffectState: 'active',
    backgroundColor: '#00000000',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.loadFile(path.join(__dirname, '../../src/renderer/index.html'));

  mainWindow.on('close', (e) => {
    e.preventDefault();
    mainWindow.hide();
  });
}

app.whenReady().then(() => {
  createWindow();

  wsServer.start({
    onStatusChange: () => {
      const devices = wsServer.getConnectedDevices();
      trayManager.setDevices(devices);
      if (mainWindow) mainWindow.webContents.send('devices-update', devices);
    },
    onPairRequest: ({ deviceId, deviceName, code, ws }) => {
      pendingPairWs = ws;
      if (mainWindow) {
        mainWindow.show();
        mainWindow.webContents.send('pair-request', { deviceId, deviceName, code });
      }
      showHUD({ from: 'Clippr', text: `Pair request from ${deviceName}` });
    },
    onClipboardReceived: (entry) => {
      // Show HUD notification like macOS battery alert
      showHUD({ from: entry.source, text: entry.content });
      if (mainWindow) mainWindow.webContents.send('history-update', history.getHistory());
    },
  });

  bonjour.advertise();

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

  trayManager.createTray(mainWindow);
});

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
  if (pendingPairWs) { wsServer.acceptPairing(pendingPairWs); pendingPairWs = null; }
});
ipcMain.on('pair-reject', () => {
  if (pendingPairWs) { wsServer.rejectPairing(pendingPairWs); pendingPairWs = null; }
});

app.on('before-quit', () => {
  clipboardMonitor.stopMonitoring();
  bonjour.stop();
  wsServer.stop();
  trayManager.destroy();
});
