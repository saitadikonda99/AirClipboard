import SplitButton from './SplitButton';
import SyncIllustration from './SyncIllustration';
import { DMG_URL, APK_URL } from './links';

export default function Hero() {
  return (
    <header className="hero">
      <div className="wrap hero-grid">
        <div>
          <span className="badge-pill"><span className="dot" />Local Wi-Fi · no cloud · no accounts</span>
          <h1>Copy on one.<br />Paste on the <em>other.</em></h1>
          <p className="sub">AirClipboard mirrors your clipboard between <strong>Mac</strong> and <strong>Android</strong> in real time, entirely over your own Wi-Fi. Nothing touches the internet.</p>
          <div className="cta-row">
            <SplitButton href={DMG_URL} variant="fill">Download for Mac</SplitButton>
            <SplitButton href={APK_URL} variant="ghost">Download for Android</SplitButton>
          </div>
          <div className="req-line">macOS 10.15+ · Android 8.0+ · both devices, one Wi-Fi network</div>
        </div>

        <SyncIllustration />
      </div>
    </header>
  );
}
