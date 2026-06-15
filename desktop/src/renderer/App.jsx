import React, { useState, useEffect } from 'react';
import './styles.css';

const { clippr } = window;

export default function App() {
  const [view, setView] = useState('history'); // 'history' | 'settings' | 'pair'
  const [history, setHistory] = useState([]);
  const [devices, setDevices] = useState([]);
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [pairRequest, setPairRequest] = useState(null);

  useEffect(() => {
    clippr.getHistory().then(setHistory);
    clippr.getDevices().then(setDevices);
    clippr.getDeviceInfo().then(setDeviceInfo);

    clippr.on('history-update', (h) => setHistory(h));
    clippr.on('devices-update', (d) => setDevices(d));
    clippr.on('pair-request', (req) => { setPairRequest(req); setView('pair'); });
    clippr.on('show-history', () => setView('history'));
    clippr.on('show-settings', () => setView('settings'));
  }, []);

  function handleAccept() {
    clippr.acceptPair();
    setPairRequest(null);
    setView('history');
  }

  function handleReject() {
    clippr.rejectPair();
    setPairRequest(null);
    setView('history');
  }

  async function handleRemoveDevice(id) {
    await clippr.removeDevice(id);
    const info = await clippr.getDeviceInfo();
    setDeviceInfo(info);
  }

  async function handleClearHistory() {
    await clippr.clearHistory();
    setHistory([]);
  }

  return (
    <div className="app">
      <header className="header">
        <span className="logo">✂ Clippr</span>
        <nav>
          <button className={view === 'history' ? 'active' : ''} onClick={() => setView('history')}>History</button>
          <button className={view === 'settings' ? 'active' : ''} onClick={() => setView('settings')}>Settings</button>
        </nav>
      </header>

      {view === 'pair' && pairRequest && (
        <div className="pair-modal">
          <h2>Pair Request</h2>
          <p>Device: <strong>{pairRequest.deviceName}</strong></p>
          <div className="pair-code">{pairRequest.code}</div>
          <p className="hint">Confirm this code on your Android device</p>
          <div className="pair-actions">
            <button className="btn-accept" onClick={handleAccept}>Accept</button>
            <button className="btn-reject" onClick={handleReject}>Reject</button>
          </div>
        </div>
      )}

      {view === 'history' && (
        <div className="view">
          <div className="section-header">
            <span className="section-title">Connected Devices</span>
          </div>
          <div className="devices">
            {devices.length === 0 ? (
              <div className="empty">No devices connected</div>
            ) : devices.map(d => (
              <div key={d.deviceId} className="device-item">
                <span className="dot connected" />
                <span>{d.deviceName}</span>
              </div>
            ))}
          </div>

          <div className="section-header">
            <span className="section-title">Clipboard History</span>
            <button className="btn-small" onClick={handleClearHistory}>Clear</button>
          </div>
          <div className="history-list">
            {history.length === 0 ? (
              <div className="empty">No clipboard history yet</div>
            ) : history.map((item, i) => (
              <div key={item.id || i} className="history-item">
                <div className="history-content">{item.content?.slice(0, 120)}{item.content?.length > 120 ? '…' : ''}</div>
                <div className="history-meta">
                  <span className={`badge ${item.direction}`}>{item.direction === 'received' ? '↓' : '↑'}</span>
                  <span className="history-source">{item.source}</span>
                  <span className="history-time">{new Date(item.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === 'settings' && deviceInfo && (
        <div className="view">
          <div className="section-title">This Device</div>
          <div className="info-row"><span>Name</span><span>{deviceInfo.deviceName}</span></div>
          <div className="info-row"><span>ID</span><span className="mono">{deviceInfo.deviceId}</span></div>

          <div className="section-title" style={{ marginTop: 20 }}>Trusted Devices</div>
          {Object.values(deviceInfo.trustedDevices || {}).length === 0 ? (
            <div className="empty">No trusted devices</div>
          ) : Object.values(deviceInfo.trustedDevices).map(d => (
            <div key={d.deviceId} className="device-row">
              <span>{d.deviceName}</span>
              <button className="btn-remove" onClick={() => handleRemoveDevice(d.deviceId)}>Remove</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
