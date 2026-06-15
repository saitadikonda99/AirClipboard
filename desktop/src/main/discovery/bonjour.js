const { Bonjour } = require('bonjour-service');
const { SERVICE_NAME, SERVICE_TYPE, PORT } = require('../../shared/constants');
const { getMyDeviceName } = require('../pairing/pairing');

let bonjour = null;
let service = null;

function advertise() {
  bonjour = new Bonjour();
  const name = `${SERVICE_NAME}-${getMyDeviceName()}`;
  service = bonjour.publish({ name, type: '_clippr._tcp', port: PORT });
  console.log(`mDNS: advertising "${name}" on port ${PORT}`);
}

function stop() {
  if (service) {
    service.stop();
    service = null;
  }
  if (bonjour) {
    bonjour.destroy();
    bonjour = null;
  }
}

module.exports = { advertise, stop };
