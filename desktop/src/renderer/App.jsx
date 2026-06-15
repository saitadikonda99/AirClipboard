import React, { useState, useEffect } from 'react';
import './styles.css';

const { clippr } = window;

function timeAgo(ts) {
  const diff = Date.now() - ts;
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return `${Math.floor(diff / 3600000)}h ago`;
}

export default function App() {
  const [view, setView] = useState('history');
  const [history, setHistory] = useState([]);
  const [devices, setDevices] = useState([]);
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [pairRequest, setPairRequest] = useState(null);

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

  async function handleRemoveDevice(id) {
    await clippr.removeDevice(id);
    clippr.getDeviceInfo().then(setDeviceInfo);
  }

  return (
    <div className="app">
      {/* Title bar drag region */}
      <div className="titlebar">
        <span className="titlebar-title">Clippr</span>
        <div className="tab-group">
          <button className={`tab ${view === 'history' ? 'active' : ''}`} onClick={() => setView('history')}>History</button>
          <button className={`tab ${view === 'settings' ? 'active' : ''}`} onClick={() => setView('settings')}>Devices</button>
        </div>
      </div>

      {/* Connection status strip */}
      <div className={`status-strip ${devices.length > 0 ? 'connected' : 'disconnected'}`}>
        <span className="status-dot" />
        <span className="status-text">
          {devices.length > 0
            ? `Connected to ${devices.map(d => d.deviceName).join(', ')}`
            : 'Searching for devices on local network…'}
        </span>
      </div>

      {/* Pair request */}
      {view === 'pair' && pairRequest && (
        <div className="pair-screen">
          <div className="pair-icon">📲</div>
          <h2 className="pair-title">Pair Request</h2>
          <p className="pair-sub">From <strong>{pairRequest.deviceName}</strong></p>
          <div className="pair-code-box">
            <span className="pair-code">{pairRequest.code}</span>
          </div>
          <p className="pair-hint">Confirm this code on your Android device</p>
          <div className="pair-actions">
            <button className="btn-accept" onClick={() => { clippr.acceptPair(); setPairRequest(null); setView('history'); }}>
              Accept
            </button>
            <button className="btn-reject" onClick={() => { clippr.rejectPair(); setPairRequest(null); setView('history'); }}>
              Decline
            </button>
          </div>
        </div>
      )}

      {/* History view */}
      {view === 'history' && (
        <div className="view">
          {history.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">⌘C</div>
              <p className="empty-title">No clipboard history yet</p>
              <p className="empty-sub">Copy something on your Mac or Android device</p>
            </div>
          ) : (
            <>
              <div className="list-header">
                <span className="list-label">Recent</span>
                <button className="link-btn" onClick={() => { clippr.clearHistory(); setHistory([]); }}>Clear all</button>
              </div>
              <div className="history-list">
                {history.map((item, i) => (
                  <div key={item.id || i} className="history-item">
                    <div className="history-direction">{item.direction === 'received' ? '↓' : '↑'}</div>
                    <div className="history-body">
                      <div className="history-content">{item.content?.slice(0, 160)}{item.content?.length > 160 ? '…' : ''}</div>
                      <div className="history-meta">{item.source} · {timeAgo(item.timestamp)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Settings / Devices view */}
      {view === 'settings' && deviceInfo && (
        <div className="view">
          <div className="settings-section">
            <div className="settings-label">This Mac</div>
            <div className="settings-card">
              <div className="settings-row">
                <span className="settings-key">Name</span>
                <span className="settings-val">{deviceInfo.deviceName}</span>
              </div>
              <div className="settings-row border-top">
                <span className="settings-key">Device ID</span>
                <span className="settings-val mono">{deviceInfo.deviceId}</span>
              </div>
            </div>
          </div>

          <div className="settings-section">
            <div className="settings-label">Trusted Devices</div>
            {Object.values(deviceInfo.trustedDevices || {}).length === 0 ? (
              <div className="settings-empty">No paired devices yet</div>
            ) : (
              <div className="settings-card">
                {Object.values(deviceInfo.trustedDevices).map((d, i, arr) => (
                  <div key={d.deviceId} className={`settings-row ${i < arr.length - 1 ? 'border-top' : ''}`}>
                    <span className="settings-key">{d.deviceName}</span>
                    <button className="danger-btn" onClick={() => handleRemoveDevice(d.deviceId)}>Remove</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
