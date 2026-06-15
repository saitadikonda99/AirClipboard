import electronMain from 'electron/main';
const { app, Tray, Menu, nativeImage, screen } = electronMain;
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let tray = null;
let mainWindow = null;
let currentDevices = [];

export function createTray(win) {
  mainWindow = win;

  const iconPath = path.join(__dirname, '../../../assets/tray-icon.png');
  let icon;
  try {
    icon = nativeImage.createFromPath(iconPath);
    icon.setTemplateImage(true);
  } catch {
    icon = nativeImage.createEmpty();
  }

  tray = new Tray(icon.resize({ width: 18, height: 18 }));
  tray.setToolTip('AirClipboard');
  tray.on('click', () => toggleWindow());
  tray.on('right-click', () => {
    tray.popUpContextMenu(Menu.buildFromTemplate([
      { label: 'AirClipboard', enabled: false },
      { type: 'separator' },
      { label: 'Open', click: () => showWindow() },
      { type: 'separator' },
      { label: 'Quit', click: () => app.quit() },
    ]));
  });
}

function getWindowPosition() {
  const trayBounds = tray.getBounds();
  const windowBounds = mainWindow.getBounds();
  const display = screen.getDisplayNearestPoint({ x: trayBounds.x, y: trayBounds.y });

  let x = Math.round(trayBounds.x + trayBounds.width / 2 - windowBounds.width / 2);
  let y = Math.round(trayBounds.y + trayBounds.height + 4);

  const { bounds } = display;
  if (x < bounds.x) x = bounds.x + 4;
  if (x + windowBounds.width > bounds.x + bounds.width) {
    x = bounds.x + bounds.width - windowBounds.width - 4;
  }
  return { x, y };
}

function showWindow() {
  if (!mainWindow) return;
  const { x, y } = getWindowPosition();
  mainWindow.setPosition(x, y, false);
  mainWindow.show();
  mainWindow.focus();
}

function toggleWindow() {
  if (mainWindow && mainWindow.isVisible()) {
    mainWindow.hide();
  } else {
    showWindow();
  }
}

export function setDevices(devices) {
  currentDevices = devices;
  if (tray) {
    tray.setToolTip(devices.length > 0
      ? `AirClipboard — ${devices.map(d => d.deviceName).join(', ')}`
      : 'AirClipboard — Not connected');
  }
}

export function destroy() {
  if (tray) { tray.destroy(); tray = null; }
}
