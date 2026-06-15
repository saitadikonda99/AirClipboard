const Store = require('electron-store');
const { generateKey, generatePairingCode } = require('../security/crypto');
const { v4: uuidv4 } = require('uuid');

const store = new Store({ name: 'clippr-devices' });

function getMyDeviceId() {
  let id = store.get('myDeviceId');
  if (!id) {
    id = 'mac-' + uuidv4().slice(0, 8);
    store.set('myDeviceId', id);
  }
  return id;
}

function getMyDeviceName() {
  const os = require('os');
  return store.get('myDeviceName') || os.hostname();
}

function getTrustedDevices() {
  return store.get('trustedDevices', {});
}

function isTrusted(deviceId) {
  const devices = getTrustedDevices();
  return !!devices[deviceId];
}

function getDeviceKey(deviceId) {
  const devices = getTrustedDevices();
  return devices[deviceId]?.sharedKey || null;
}

function trustDevice(deviceId, deviceName, sharedKey) {
  const devices = getTrustedDevices();
  devices[deviceId] = { deviceId, deviceName, sharedKey, pairedAt: Date.now() };
  store.set('trustedDevices', devices);
}

function removeDevice(deviceId) {
  const devices = getTrustedDevices();
  delete devices[deviceId];
  store.set('trustedDevices', devices);
}

function createPairingSession() {
  const code = generatePairingCode();
  const sharedKey = generateKey();
  store.set('pendingPairing', { code, sharedKey, createdAt: Date.now() });
  return { code, sharedKey };
}

function getPendingPairing() {
  const p = store.get('pendingPairing');
  if (!p) return null;
  if (Date.now() - p.createdAt > 5 * 60 * 1000) {
    store.delete('pendingPairing');
    return null;
  }
  return p;
}

function clearPendingPairing() {
  store.delete('pendingPairing');
}

module.exports = {
  getMyDeviceId,
  getMyDeviceName,
  getTrustedDevices,
  isTrusted,
  getDeviceKey,
  trustDevice,
  removeDevice,
  createPairingSession,
  getPendingPairing,
  clearPendingPairing,
};
