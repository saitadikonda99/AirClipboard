import os from 'os';
import { v4 as uuidv4 } from 'uuid';
import { generateKey, generatePairingCode } from '../security/crypto.js';
import { createStore } from '../store.js';

const store = createStore('clippr-devices');

export function getMyDeviceId() {
  let id = store.get('myDeviceId');
  if (!id) {
    id = 'mac-' + uuidv4().slice(0, 8);
    store.set('myDeviceId', id);
  }
  return id;
}

export function getMyDeviceName() {
  return store.get('myDeviceName') || os.hostname();
}

export function getTrustedDevices() {
  return store.get('trustedDevices', {});
}

export function isTrusted(deviceId) {
  return !!getTrustedDevices()[deviceId];
}

export function getDeviceKey(deviceId) {
  return getTrustedDevices()[deviceId]?.sharedKey || null;
}

export function trustDevice(deviceId, deviceName, sharedKey) {
  const devices = getTrustedDevices();
  devices[deviceId] = { deviceId, deviceName, sharedKey, pairedAt: Date.now() };
  store.set('trustedDevices', devices);
}

export function removeDevice(deviceId) {
  const devices = getTrustedDevices();
  delete devices[deviceId];
  store.set('trustedDevices', devices);
}

export function createPairingSession() {
  const code = generatePairingCode();
  const sharedKey = generateKey();
  store.set('pendingPairing', { code, sharedKey, createdAt: Date.now() });
  return { code, sharedKey };
}

export function getPendingPairing() {
  const p = store.get('pendingPairing');
  if (!p) return null;
  if (Date.now() - p.createdAt > 5 * 60 * 1000) {
    store.delete('pendingPairing');
    return null;
  }
  return p;
}

export function clearPendingPairing() {
  store.delete('pendingPairing');
}
