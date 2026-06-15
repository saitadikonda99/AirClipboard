import { POLL_INTERVAL_MS } from '../../shared/constants.js';

let lastClipboard = '';
let pollTimer = null;
let onChangeCallback = null;

async function getClipboard() {
  try {
    const clipboardy = await import('clipboardy');
    return clipboardy.default.readSync();
  } catch {
    return '';
  }
}

export async function setClipboard(text) {
  try {
    const clipboardy = await import('clipboardy');
    clipboardy.default.writeSync(text);
    lastClipboard = text;
  } catch (e) {
    console.error('Failed to set clipboard:', e.message);
  }
}

export function startMonitoring(onChange) {
  onChangeCallback = onChange;
  pollTimer = setInterval(async () => {
    const current = await getClipboard();
    if (current && current !== lastClipboard) {
      lastClipboard = current;
      onChangeCallback(current);
    }
  }, POLL_INTERVAL_MS);
}

export function stopMonitoring() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

export function setLastKnown(text) {
  lastClipboard = text;
}

export { getClipboard };
