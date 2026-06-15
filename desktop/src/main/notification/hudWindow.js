import electronMain from 'electron/main';
const { BrowserWindow, screen } = electronMain;
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let hudWin = null;
let dismissTimer = null;

export function showHUD({ from, text }) {
  if (dismissTimer) clearTimeout(dismissTimer);

  const display = screen.getPrimaryDisplay();
  const { width } = display.workAreaSize;
  const winWidth = 380;
  const winHeight = 80;
  const x = Math.round((width - winWidth) / 2);
  const y = 24;

  if (hudWin && !hudWin.isDestroyed()) {
    hudWin.loadFile(path.join(__dirname, '../../renderer/notification.html'), { query: { from, text } });
    hudWin.setPosition(x, y);
  } else {
    hudWin = new BrowserWindow({
      width: winWidth, height: winHeight, x, y,
      frame: false, transparent: true, alwaysOnTop: true,
      skipTaskbar: true, resizable: false, movable: false,
      focusable: false, hasShadow: false,
      webPreferences: { nodeIntegration: false, contextIsolation: true },
      type: 'panel',
    });
    hudWin.loadFile(path.join(__dirname, '../../renderer/notification.html'), { query: { from, text } });
    hudWin.setIgnoreMouseEvents(true);
  }

  dismissTimer = setTimeout(() => {
    if (hudWin && !hudWin.isDestroyed()) { hudWin.close(); hudWin = null; }
  }, 3200);
}
