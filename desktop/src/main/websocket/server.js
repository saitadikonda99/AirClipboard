import { WebSocketServer, WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { PORT, MSG_TYPE } from '../../shared/constants.js';
import { encrypt, decrypt } from '../security/crypto.js';
import {
  isTrusted, getDeviceKey, trustDevice,
  getMyDeviceId, getMyDeviceName,
  createPairingSession, clearPendingPairing,
} from '../pairing/pairing.js';
import { addEntry } from '../history/history.js';
import { setClipboard, setLastKnown } from '../clipboard/monitor.js';

let wss = null;
let onStatusChange = null;
let onPairRequest = null;
let onClipboardReceived = null;

const connectedClients = new Map();

export function start(callbacks = {}) {
  onStatusChange = callbacks.onStatusChange || (() => {});
  onPairRequest = callbacks.onPairRequest || (() => {});
  onClipboardReceived = callbacks.onClipboardReceived || (() => {});

  wss = new WebSocketServer({ port: PORT, host: '0.0.0.0' });
  wss.on('connection', (ws) => {
    ws.clientId = uuidv4();
    ws.deviceId = null;
    ws.on('message', (data) => handleMessage(ws, data));
    ws.on('close', () => handleClose(ws));
    ws.on('error', (err) => console.error('WS client error:', err.message));
  });
  wss.on('error', (err) => console.error('WS server error:', err.message));
  console.log(`AirClipboard WS server listening on port ${PORT}`);
}

function handleMessage(ws, data) {
  let msg;
  try { msg = JSON.parse(data.toString()); } catch { return; }

  switch (msg.type) {
    case MSG_TYPE.PAIR_REQUEST: handlePairRequest(ws, msg); break;
    case MSG_TYPE.PAIR_ACCEPT:  handlePairAccept(ws, msg); break;
    case MSG_TYPE.CLIPBOARD:    handleClipboard(ws, msg); break;
    case MSG_TYPE.PING: ws.send(JSON.stringify({ type: MSG_TYPE.PONG })); break;
  }
}

function handlePairRequest(ws, msg) {
  const { deviceId, deviceName } = msg;
  if (isTrusted(deviceId)) {
    const sharedKey = getDeviceKey(deviceId);
    ws.deviceId = deviceId;
    ws.deviceName = deviceName;
    connectedClients.set(deviceId, { ws, deviceName, trusted: true });
    ws.send(JSON.stringify({ type: MSG_TYPE.PAIR_ACCEPT, deviceId: getMyDeviceId(), deviceName: getMyDeviceName(), sharedKey }));
    onStatusChange({ deviceId, deviceName, connected: true });
    return;
  }
  const session = createPairingSession();
  ws.pendingPairDeviceId = deviceId;
  ws.pendingPairDeviceName = deviceName;
  ws.pendingPairKey = session.sharedKey;
  onPairRequest({ deviceId, deviceName, code: session.code, ws, sharedKey: session.sharedKey });
}

export function acceptPairing(ws) {
  const { pendingPairDeviceId: deviceId, pendingPairDeviceName: deviceName, pendingPairKey: sharedKey } = ws;
  trustDevice(deviceId, deviceName, sharedKey);
  clearPendingPairing();
  ws.deviceId = deviceId;
  ws.deviceName = deviceName;
  connectedClients.set(deviceId, { ws, deviceName, trusted: true });
  ws.send(JSON.stringify({ type: MSG_TYPE.PAIR_ACCEPT, deviceId: getMyDeviceId(), deviceName: getMyDeviceName(), sharedKey }));
  onStatusChange({ deviceId, deviceName, connected: true });
}

export function rejectPairing(ws) {
  ws.send(JSON.stringify({ type: MSG_TYPE.PAIR_REJECT }));
  ws.close();
}

function handlePairAccept(ws, msg) {}

function handleClipboard(ws, msg) {
  const deviceId = ws.deviceId;
  if (!deviceId || !isTrusted(deviceId)) return;
  const sharedKey = getDeviceKey(deviceId);
  let text;
  try { text = decrypt(msg.payload, sharedKey); } catch { console.error('Decrypt failed'); return; }
  if (msg.source === getMyDeviceId()) return;
  setClipboard(text);
  setLastKnown(text);
  const entry = {
    id: msg.id || uuidv4(),
    content: text,
    timestamp: msg.timestamp || Date.now(),
    source: ws.deviceName || deviceId,
    type: 'text/plain',
    direction: 'received',
  };
  addEntry(entry);
  onClipboardReceived(entry);
}

export function broadcastClipboard(text) {
  const myId = getMyDeviceId();
  connectedClients.forEach(({ ws, trusted }, deviceId) => {
    if (!trusted || ws.readyState !== WebSocket.OPEN) return;
    const sharedKey = getDeviceKey(deviceId);
    if (!sharedKey) return;
    const payload = encrypt(text, sharedKey);
    ws.send(JSON.stringify({
      type: MSG_TYPE.CLIPBOARD,
      id: uuidv4(),
      source: myId,
      timestamp: Date.now(),
      mimeType: 'text/plain',
      payload,
    }));
  });
}

function handleClose(ws) {
  if (ws.deviceId) {
    connectedClients.delete(ws.deviceId);
    onStatusChange({ deviceId: ws.deviceId, deviceName: ws.deviceName, connected: false });
  }
}

export function getConnectedDevices() {
  const result = [];
  connectedClients.forEach(({ deviceName, ws }, deviceId) => {
    if (ws.readyState === WebSocket.OPEN) result.push({ deviceId, deviceName });
  });
  return result;
}

export function stop() {
  if (wss) { wss.close(); wss = null; }
}
