import React, { useState, useEffect, useRef } from 'react';
import './styles.css';

const { clippr } = window;

function timeAgo(ts) {
  const diff = Date.now() - ts;
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return `${Math.floor(diff / 3600000)}h ago`;
}

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2"/>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  );
}

function DeviceIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2"/>
      <line x1="12" y1="18" x2="12.01" y2="18"/>
    </svg>
  );
}

export default function App() {
  const [view, setView] = useState('history');
  const [history, setHistory] = useState([]);
  const [devices, setDevices] = useState([]);
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [pairRequest, setPairRequest] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    clippr.getHistory().then(setHistory);
    clippr.getDevices().then(setDevices);
    clippr.getDeviceInfo().then(setDeviceInfo);
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

  async function handleRemoveDevice(id) {
    await clippr.removeDevice(id);
    clippr.getDeviceInfo().then(setDeviceInfo);
  }

  const isConnected = devices.length > 0;

  return (
    <div className="app">
      {/* ── Title Bar ── */}
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
          <button className={`tab ${view === 'settings' ? 'active' : ''}`} onClick={() => setView('settings')}>Devices</button>
        </div>
      </div>

      {/* ── Status Bar ── */}
      <div className={`status-bar ${isConnected ? 'on' : 'off'}`}>
        <span className={`pulse-dot ${isConnected ? 'on' : 'off'}`} />
        <span className="status-text">
          {isConnected
            ? `Connected · ${devices.map(d => d.deviceName).join(', ')}`
            : 'Searching for devices on local network…'}
        </span>
      </div>

      {/* ── Pair View ── */}
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

      {/* ── History View ── */}
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
              <p className="empty-sub">Copy something on your Mac or Android<br/>and it'll appear here instantly</p>
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
                    <div className={`dir-badge ${item.direction}`}>
                      {item.direction === 'received' ? '↓' : '↑'}
                    </div>
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

      {/* ── Devices View ── */}
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
              <span className="info-key">Device ID</span>
              <span className="info-val mono">{deviceInfo.deviceId}</span>
            </div>
          </div>

          <div className="section-header" style={{ marginTop: 20 }}>
            <span className="section-label">Paired Devices</span>
          </div>
          {Object.values(deviceInfo.trustedDevices || {}).length === 0 ? (
            <div className="glass-card">
              <div className="info-row">
                <span className="info-val" style={{ color: '#8e8e93' }}>No paired devices yet</span>
              </div>
            </div>
          ) : (
            <div className="glass-card">
              {Object.values(deviceInfo.trustedDevices).map((d, i, arr) => (
                <React.Fragment key={d.deviceId}>
                  <div className="info-row">
                    <span className="info-key" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <DeviceIcon />{d.deviceName}
                    </span>
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
