import { CheckIcon } from './icons';

const CHECKS = [
  {
    title: 'Local network only',
    body: 'Clipboard data never leaves your Wi-Fi. There is no cloud relay to compromise.',
  },
  {
    title: 'End-to-end encrypted',
    body: 'Every pairing generates a unique shared key. Content is encrypted with AES-256-GCM, always.',
  },
  {
    title: 'No accounts, no telemetry',
    body: 'Nothing to sign up for. Nothing phones home. Pairing is the only trust you grant.',
  },
  {
    title: 'Open source',
    body: 'Every line — pairing, crypto, sync — is on GitHub. Read it, fork it, audit it yourself.',
  },
];

const SPEC = [
  ['Transport', 'WebSocket / TCP 8585'],
  ['Discovery', 'mDNS (Bonjour / NSD)'],
  ['Encryption', 'AES-256-GCM'],
  ['Pairing', 'One-time code + QR'],
  ['Storage', 'Local disk, plaintext-free'],
  ['Network scope', 'LAN only, no WAN egress'],
];

export default function PrivacySection() {
  return (
    <section id="features" className="on-white bordered">
      <div className="wrap">
        <div className="section-head">
          <div>
            <div className="eyebrow">Privacy &amp; security</div>
            <h2>Nothing to breach, because there&apos;s nothing to store</h2>
          </div>
          <p className="section-note">No servers, no logins, no telemetry. Just two devices and a handshake.</p>
        </div>
        <div className="spec-grid">
          <div className="check-list">
            {CHECKS.map((item) => (
              <div className="check-item" key={item.title}>
                <div className="check-icon"><CheckIcon /></div>
                <div>
                  <h4>{item.title}</h4>
                  <p>{item.body}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="spec-card">
            <div className="spec-card-head"><span>connection.spec</span><span>v1</span></div>
            {SPEC.map(([key, val]) => (
              <div className="spec-row" key={key}>
                <span className="spec-key">{key}</span>
                <span className="spec-val">{val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
