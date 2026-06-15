import { Bonjour } from 'bonjour-service';
import { SERVICE_NAME, PORT } from '../../shared/constants.js';
import { getMyDeviceName } from '../pairing/pairing.js';

let bonjour = null;
let service = null;

export function advertise() {
  bonjour = new Bonjour();
  const name = `${SERVICE_NAME}-${getMyDeviceName()}`;
  service = bonjour.publish({ name, type: '_clippr._tcp', port: PORT });
  console.log(`mDNS: advertising "${name}" on port ${PORT}`);
}

export function stop() {
  if (service) { service.stop(); service = null; }
  if (bonjour) { bonjour.destroy(); bonjour = null; }
}
