import { AppleIcon, AndroidIcon } from './icons';
import SplitButton from './SplitButton';
import { DMG_URL, APK_URL } from './links';

export default function Download() {
  return (
    <section id="download" className="on-cream">
      <div className="wrap">
        <div className="section-head">
          <div>
            <div className="eyebrow">Download</div>
            <h2>Get AirClipboard</h2>
          </div>
          <p className="section-note">Free and open source. Builds are produced straight from this repository&apos;s release workflow.</p>
        </div>
        <div className="platforms">
          <div className="platform-card">
            <div className="platform-top">
              <div className="platform-icon"><AppleIcon /></div>
              <span className="platform-version">macOS · arm64</span>
            </div>
            <h3>AirClipboard for Mac</h3>
            <p className="desc">Runs from the menu bar with zero dock clutter. Optional launch-at-login.</p>
            <SplitButton href={DMG_URL} variant="fill" style={{ alignSelf: 'flex-start' }}>Download .dmg</SplitButton>
            <div className="platform-reqs">requires macOS 10.15 or later</div>
          </div>
          <div className="platform-card">
            <div className="platform-top">
              <div className="platform-icon"><AndroidIcon /></div>
              <span className="platform-version">Android · API 26+</span>
            </div>
            <h3>AirClipboard for Android</h3>
            <p className="desc">Native Kotlin app with a foreground sync service and QR pairing.</p>
            <SplitButton href={APK_URL} variant="fill" style={{ alignSelf: 'flex-start' }}>Download .apk</SplitButton>
            <div className="platform-reqs">enable &quot;install from unknown sources&quot; to sideload</div>
          </div>
        </div>
      </div>
    </section>
  );
}
