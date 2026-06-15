import React, { useState, useEffect } from 'react';
import './styles.css';

const { clippr } = window;

function timeAgo(ts) {
  const diff = Date.now() - ts;
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return `${Math.floor(diff / 3600000)}h ago`;
}

// Minimal QR code generator (pure JS, no library)
function QRCode({ value, size = 160 }) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    // Use a data URI canvas approach via Google Charts API equivalent
    // We'll encode using a simple pattern for the connection string
    const encoded = encodeURIComponent(value);
    setUrl(`https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}&bgcolor=ffffff&color=1c1c1e&margin=10`);
  }, [value, size]);
  return url ? (
    <img src={url} width={size} height={size} style={{ borderRadius: 12, display: 'block' }} alt="QR" />
  ) : (
    <div style={{ width: size, height: size, background: 'rgba(120,120,128,0.1)', borderRadius: 12 }} />
  );
}

function CopyIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2"/>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  );
}

export default function App() {
  const [view, setView] = useState('history');
  const [history, setHistory] = useState([]);
  const [devices, setDevices] = useState([]);
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [connectInfo, setConnectInfo] = useState(null);
  const [pairRequest, setPairRequest] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [ipCopied, setIpCopied] = useState(false);

  useEffect(() => {
    clippr.getHistory().then(setHistory);
    clippr.getDevices().then(setDevices);
    clippr.getDeviceInfo().then(setDeviceInfo);
    clippr.getConnectInfo().then(setConnectInfo);
    clippr.on('history-update', setHistory);
    clippr.on('devices-update', setDevices);
    clippr.on('pair-request', (req) => { setPairRequest(req); setView('pair'); });
    clippr.on('show-history', () => setView('history'));
    clippr.on('show-settings', () => setView('settings'));
  }, []);

  function handleCopyItem(content, id) {
    navigator.clipboard?.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  function handleCopyIP() {
    if (connectInfo) {
      navigator.clipboard?.writeText(`${connectInfo.ip}:${connectInfo.port}`);
      setIpCopied(true);
      setTimeout(() => setIpCopied(false), 1500);
    }
  }

  async function handleRemoveDevice(id) {
    await clippr.removeDevice(id);
    clippr.getDeviceInfo().then(setDeviceInfo);
  }

  const isConnected = devices.length > 0;
  const qrValue = connectInfo ? `airclipboard://${connectInfo.ip}:${connectInfo.port}` : '';

  return (
    <div className="app">
      {/* Title Bar */}
      <div className="titlebar">
        <div className="titlebar-left">
          <div className="app-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
              <line x1="8" y1="13" x2="16" y2="13"/>
              <line x1="8" y1="17" x2="12" y2="17"/>
            </svg>
          </div>
          <span className="app-name">AirClipboard</span>
        </div>
        <div className="tab-group">
          <button className={`tab ${view === 'history' ? 'active' : ''}`} onClick={() => setView('history')}>History</button>
          <button className={`tab ${view === 'connect' ? 'active' : ''}`} onClick={() => setView('connect')}>Connect</button>
          <button className={`tab ${view === 'settings' ? 'active' : ''}`} onClick={() => setView('settings')}>Devices</button>
        </div>
      </div>

      {/* Status Bar */}
      <div className={`status-bar ${isConnected ? 'on' : 'off'}`}>
        <span className={`pulse-dot ${isConnected ? 'on' : 'off'}`} />
        <span className="status-text">
          {isConnected
            ? `Connected · ${devices.map(d => d.deviceName).join(', ')}`
            : 'Not connected · Open Connect tab to pair'}
        </span>
      </div>

      {/* Pair Request */}
      {view === 'pair' && pairRequest && (
        <div className="pair-view">
          <div className="pair-glass">
            <div className="pair-phone-icon">📲</div>
            <h2 className="pair-heading">Pair Request</h2>
            <p className="pair-sub">From <strong>{pairRequest.deviceName}</strong></p>
            <div className="pair-code-wrap">
              <span className="pair-code">{pairRequest.code}</span>
            </div>
            <p className="pair-hint">Confirm this code on your Android device</p>
            <div className="pair-btns">
              <button className="btn-accept" onClick={() => { clippr.acceptPair(); setPairRequest(null); setView('history'); }}>Accept</button>
              <button className="btn-decline" onClick={() => { clippr.rejectPair(); setPairRequest(null); setView('history'); }}>Decline</button>
            </div>
          </div>
        </div>
      )}

      {/* History View */}
      {view === 'history' && (
        <div className="scroll-view">
          {history.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon-wrap">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                  <rect x="8" y="2" width="8" height="4" rx="1"/>
                  <line x1="8" y1="13" x2="16" y2="13"/>
                  <line x1="8" y1="17" x2="12" y2="17"/>
                </svg>
              </div>
              <p className="empty-title">Nothing here yet</p>
              <p className="empty-sub">Go to <strong>Connect</strong> to pair your Android,<br/>then copy something to see it appear here</p>
            </div>
          ) : (
            <>
              <div className="section-header">
                <span className="section-label">Recent</span>
                <button className="ghost-btn" onClick={() => { clippr.clearHistory(); setHistory([]); }}>Clear all</button>
              </div>
              <div className="history-list">
                {history.map((item, i) => (
                  <div key={item.id || i} className="history-card" onClick={() => handleCopyItem(item.content, item.id || i)}>
                    <div className={`dir-badge ${item.direction}`}>{item.direction === 'received' ? '↓' : '↑'}</div>
                    <div className="card-body">
                      <p className="card-text">{item.content?.slice(0, 180)}{item.content?.length > 180 ? '…' : ''}</p>
                      <p className="card-meta">{item.source} · {timeAgo(item.timestamp)}</p>
                    </div>
                    <div className={`copy-hint ${copiedId === (item.id || i) ? 'copied' : ''}`}>
                      {copiedId === (item.id || i) ? '✓' : <CopyIcon />}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Connect View */}
      {view === 'connect' && (
        <div className="scroll-view">
          {isConnected ? (
            <div className="connected-banner">
              <span className="connected-check">✓</span>
              <div>
                <p className="connected-title">Connected</p>
                <p className="connected-sub">{devices.map(d => d.deviceName).join(', ')}</p>
              </div>
            </div>
          ) : null}

          <div className="section-header" style={{ marginTop: isConnected ? 20 : 0 }}>
            <span className="section-label">Scan QR on your Android</span>
          </div>

          <div className="qr-card">
            {connectInfo && <QRCode value={qrValue} size={164} />}
            <p className="qr-hint">Open AirClipboard on Android → tap <strong>Scan QR</strong></p>
          </div>

          <div className="section-header" style={{ marginTop: 20 }}>
            <span className="section-label">Or enter manually on Android</span>
          </div>

          <div className="glass-card">
            <div className="info-row">
              <span className="info-key">IP Address</span>
              <span className="info-val mono">{connectInfo?.ip}</span>
            </div>
            <div className="divider" />
            <div className="info-row">
              <span className="info-key">Port</span>
              <span className="info-val mono">{connectInfo?.port}</span>
            </div>
          </div>

          <button className="copy-ip-btn" onClick={handleCopyIP}>
            {ipCopied ? '✓ Copied!' : `Copy ${connectInfo?.ip}:${connectInfo?.port}`}
          </button>

          <div className="steps-card">
            <p className="steps-title">How to connect</p>
            <div className="step"><span className="step-n">1</span><span>Both devices on same Wi-Fi</span></div>
            <div className="step"><span className="step-n">2</span><span>Open AirClipboard on Android</span></div>
            <div className="step"><span className="step-n">3</span><span>Tap <strong>Scan QR</strong> or enter IP manually</span></div>
            <div className="step"><span className="step-n">4</span><span>Accept pair request here on Mac</span></div>
          </div>
        </div>
      )}

      {/* Devices View */}
      {view === 'settings' && deviceInfo && (
        <div className="scroll-view">
          <div className="section-header">
            <span className="section-label">This Mac</span>
          </div>
          <div className="glass-card">
            <div className="info-row">
              <span className="info-key">Name</span>
              <span className="info-val">{deviceInfo.deviceName}</span>
            </div>
            <div className="divider" />
            <div className="info-row">
              <span className="info-key">IP Address</span>
              <span className="info-val mono">{connectInfo?.ip}</span>
            </div>
          </div>

          <div className="section-header" style={{ marginTop: 20 }}>
            <span className="section-label">Paired Devices</span>
          </div>
          {Object.values(deviceInfo.trustedDevices || {}).length === 0 ? (
            <div className="glass-card">
              <div className="info-row"><span className="info-val" style={{ color: '#8e8e93' }}>No paired devices</span></div>
            </div>
          ) : (
            <div className="glass-card">
              {Object.values(deviceInfo.trustedDevices).map((d, i, arr) => (
                <React.Fragment key={d.deviceId}>
                  <div className="info-row">
                    <span className="info-key">{d.deviceName}</span>
                    <button className="remove-btn" onClick={() => handleRemoveDevice(d.deviceId)}>Remove</button>
                  </div>
                  {i < arr.length - 1 && <div className="divider" />}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
