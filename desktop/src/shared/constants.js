export const SERVICE_NAME = 'AirClipboard';
export const SERVICE_TYPE = '_clippr._tcp';
export const PORT = 8585;
export const POLL_INTERVAL_MS = 300;
export const MAX_HISTORY = 50;

export const MSG_TYPE = {
  CLIPBOARD: 'clipboard',
  PAIR_REQUEST: 'pair_request',
  PAIR_ACCEPT: 'pair_accept',
  PAIR_REJECT: 'pair_reject',
  PING: 'ping',
  PONG: 'pong',
};
