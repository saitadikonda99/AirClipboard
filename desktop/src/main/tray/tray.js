const { app, Tray, Menu, nativeImage, BrowserWindow } = require('electron');
const path = require('path');

let tray = null;
let mainWindow = null;
let currentDevices = [];

function createTray(win, callbacks = {}) {
  mainWindow = win;

  // Use a simple template image; replace with actual icon in production
  const iconPath = path.join(__dirname, '../../../assets/tray-icon.png');
  let icon;
  try {
    icon = nativeImage.createFromPath(iconPath);
  } catch {
    icon = nativeImage.createEmpty();
  }

  tray = new Tray(icon.resize({ width: 16, height: 16 }));
  tray.setToolTip('Clippr');
  updateMenu(callbacks);
  tray.on('click', () => {
    if (mainWindow) {
      mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
    }
  });
}

function updateMenu(callbacks = {}) {
  if (!tray) return;

  const deviceItems = currentDevices.length === 0
    ? [{ label: 'No devices connected', enabled: false }]
    : currentDevices.map(d => ({ label: `✓ ${d.deviceName}`, enabled: false }));

  const menu = Menu.buildFromTemplate([
    { label: 'Clippr', enabled: false },
    { type: 'separator' },
    { label: 'Connected:', enabled: false },
    ...deviceItems,
    { type: 'separator' },
    { label: 'Clipboard History', click: () => { if (mainWindow) { mainWindow.show(); mainWindow.webContents.send('show-history'); } } },
    { label: 'Settings', click: () => { if (mainWindow) { mainWindow.show(); mainWindow.webContents.send('show-settings'); } } },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() },
  ]);

  tray.setContextMenu(menu);
}

function setDevices(devices) {
  currentDevices = devices;
  updateMenu();
}

function destroy() {
  if (tray) {
    tray.destroy();
    tray = null;
  }
}

module.exports = { createTray, setDevices, updateMenu, destroy };
