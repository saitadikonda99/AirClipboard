import React, { useState, useEffect } from 'react';
import './styles.css';

const { clippr } = window;

function timeAgo(ts) {
  const diff = Date.now() - ts;
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return `${Math.floor(diff / 3600000)}h ago`;
}

function QRCode({ value, size = 160 }) {
  const [dataUrl, setDataUrl] = useState('');
  useEffect(() => {
    if (value) clippr.getQrCode(value).then(setDataUrl);
  }, [value]);
  return dataUrl ? (
    <img src={dataUrl} width={size} height={size} style={{ borderRadius: 10, display: 'block' }} alt="QR" />
  ) : (
    <div style={{ width: size, height: size, background: '#F0F0F0', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#9B9B9B' }}>
      Loading…
    </div>
  );
}

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
    clippr.on('show-settings', () => setView('devices'));
  }, []);

  function handleCopy(content, id) {
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

      {/* ── Top App Bar ── */}
      <div className="titlebar">
        <div className="titlebar-inner">
          <span className="app-name">AirClipboard</span>
          <div className="status-pill">
            <span className={`pulse-dot ${isConnected ? 'on' : 'off'}`} />
            <span className="status-text">{isConnected ? 'Online' : 'Offline'}</span>
          </div>
        </div>
        <div className="device-name-row">
          {isConnected
            ? `Connected to ${devices.map(d => d.deviceName).join(', ')}`
            : 'Not connected to any device'}
        </div>
        <div className="tab-strip">
          {['history', 'connect', 'devices'].map(t => (
            <button key={t} className={`tab ${view === t ? 'active' : ''}`} onClick={() => setView(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* ── Pair Request ── */}
      {view === 'pair' && pairRequest && (
        <div className="pair-view">
          <div className="pair-card">
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

      {/* ── History ── */}
      {view === 'history' && (
        <div className="scroll-view">
          {history.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                  <rect x="8" y="2" width="8" height="4" rx="1"/>
                  <line x1="8" y1="13" x2="16" y2="13"/>
                  <line x1="8" y1="17" x2="12" y2="17"/>
                </svg>
              </div>
              <p className="empty-title">No clipboard history</p>
              <p className="empty-sub">Connect your Android to start syncing.<br />Go to the <strong>Connect</strong> tab to pair.</p>
            </div>
          ) : (
            <>
              <div className="section-header">
                <span className="section-label">Recent — {history.length} item{history.length !== 1 ? 's' : ''}</span>
                <button className="ghost-btn" onClick={() => { clippr.clearHistory(); setHistory([]); }}>Clear all</button>
              </div>
              <div className="history-list">
                {history.map((item, i) => {
                  const id = item.id || i;
                  const copied = copiedId === id;
                  return (
                    <div key={id} className="history-row" onClick={() => handleCopy(item.content, id)}>
                      <div className={`dir-circle ${item.direction}`}>
                        {item.direction === 'received' ? '↓' : '↑'}
                      </div>
                      <div className="row-body">
                        <p className="row-text">{item.content?.slice(0, 120)}{item.content?.length > 120 ? '…' : ''}</p>
                        <p className="row-meta">{item.source}  ·  {timeAgo(item.timestamp)}</p>
                      </div>
                      <div className={`copy-check ${copied ? 'copied' : ''}`}>
                        {copied ? '✓' : <CopyIcon />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Connect ── */}
      {view === 'connect' && (
        <div className="connect-scroll">
          {isConnected && (
            <div className="connected-banner">
              <span className="connected-check">✓</span>
              <div>
                <p className="connected-title">Connected</p>
                <p className="connected-sub">{devices.map(d => d.deviceName).join(', ')}</p>
              </div>
            </div>
          )}

          <div>
            <div className="section-header" style={{ borderRadius: '12px 12px 0 0', marginBottom: 0 }}>
              <span className="section-label">Scan QR on Android</span>
            </div>
            <div className="qr-card" style={{ borderRadius: '0 0 12px 12px', borderTop: 'none' }}>
              {connectInfo && <QRCode value={qrValue} size={156} />}
              <p className="qr-hint">Open AirClipboard on Android → tap <strong>Scan QR Code</strong></p>
            </div>
          </div>

          <div>
            <div className="section-header" style={{ borderRadius: '12px 12px 0 0', marginBottom: 0 }}>
              <span className="section-label">Or enter manually on Android</span>
            </div>
            <div className="info-card" style={{ borderRadius: '0 0 12px 12px', borderTop: 'none' }}>
              <div className="info-row">
                <span className="info-key">IP Address</span>
                <span className="info-val mono">{connectInfo?.ip}</span>
              </div>
              <div className="info-row">
                <span className="info-key">Port</span>
                <span className="info-val mono">{connectInfo?.port}</span>
              </div>
            </div>
          </div>

          <button className="primary-btn" onClick={handleCopyIP}>
            {ipCopied ? '✓  Copied!' : `Copy  ${connectInfo?.ip}:${connectInfo?.port}`}
          </button>

          <div className="steps-card">
            <p className="steps-title">How to connect</p>
            {[
              'Both devices on the same Wi-Fi',
              'Open AirClipboard on Android',
              'Tap Scan QR Code or enter IP manually',
              'Accept the pair request here on Mac',
            ].map((s, i) => (
              <div className="step" key={i}>
                <span className="step-n">{i + 1}</span>
                <span>{s}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Devices ── */}
      {view === 'devices' && deviceInfo && (
        <div className="devices-scroll">
          <div className="section-header" style={{ background: 'transparent', padding: '0 0 8px' }}>
            <span className="section-label">This Mac</span>
          </div>
          <div className="info-card">
            <div className="info-row">
              <span className="info-key">Name</span>
              <span className="info-val">{deviceInfo.deviceName}</span>
            </div>
            <div className="info-row">
              <span className="info-key">IP Address</span>
              <span className="info-val mono">{connectInfo?.ip}</span>
            </div>
          </div>

          <div className="section-header" style={{ background: 'transparent', padding: '16px 0 8px' }}>
            <span className="section-label">Paired Devices</span>
          </div>
          <div className="info-card">
            {Object.values(deviceInfo.trustedDevices || {}).length === 0 ? (
              <div className="info-row">
                <span className="info-val" style={{ color: '#9B9B9B' }}>No paired devices</span>
              </div>
            ) : (
              Object.values(deviceInfo.trustedDevices).map((d) => (
                <div className="info-row" key={d.deviceId}>
                  <span className="info-key">📱 {d.deviceName}</span>
                  <button className="remove-btn" onClick={() => handleRemoveDevice(d.deviceId)}>Remove</button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

    </div>
  );
}
