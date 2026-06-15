const SERVICE_NAME = 'AirClipboard';
const SERVICE_TYPE = '_clippr._tcp';
const PORT = 8585;
const POLL_INTERVAL_MS = 300;
const MAX_HISTORY = 50;

const MSG_TYPE = {
  CLIPBOARD: 'clipboard',
  PAIR_REQUEST: 'pair_request',
  PAIR_ACCEPT: 'pair_accept',
  PAIR_REJECT: 'pair_reject',
  PING: 'ping',
  PONG: 'pong',
};

module.exports = { SERVICE_NAME, SERVICE_TYPE, PORT, POLL_INTERVAL_MS, MAX_HISTORY, MSG_TYPE };
