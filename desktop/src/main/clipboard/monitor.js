const { POLL_INTERVAL_MS } = require('../../shared/constants');

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

async function setClipboard(text) {
  try {
    const clipboardy = await import('clipboardy');
    clipboardy.default.writeSync(text);
    lastClipboard = text;
  } catch (e) {
    console.error('Failed to set clipboard:', e.message);
  }
}

function startMonitoring(onChange) {
  onChangeCallback = onChange;
  pollTimer = setInterval(async () => {
    const current = await getClipboard();
    if (current && current !== lastClipboard) {
      lastClipboard = current;
      onChangeCallback(current);
    }
  }, POLL_INTERVAL_MS);
}

function stopMonitoring() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

function setLastKnown(text) {
  lastClipboard = text;
}

module.exports = { startMonitoring, stopMonitoring, setClipboard, setLastKnown, getClipboard };
