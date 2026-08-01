import { ClipboardGlyph } from './icons';
import SplitButton from './SplitButton';
import { REPO_URL, RELEASES_URL, DOCS_URL } from './links';

export default function Closing() {
  return (
    <section className="closing">
      <div className="wrap">
        <div className="closing-top">
          <h2>One clipboard.<br />Zero <em>servers.</em></h2>
          <div>
            <p className="section-note" style={{ marginBottom: 20 }}>MIT licensed. Read the code, run your own build, or just download it.</p>
            <SplitButton href={REPO_URL} variant="on-dark">View on GitHub</SplitButton>
          </div>
        </div>
        <div className="footer-row">
          <div className="footer-brand">
            <span className="brand-glyph">
              <ClipboardGlyph size={11} />
            </span>
            AirClipboard — built for local networks.
          </div>
          <div className="footer-links">
            <a href={REPO_URL}>GitHub</a>
            <a href={RELEASES_URL}>Releases</a>
            <a href={DOCS_URL}>Docs</a>
          </div>
        </div>
      </div>
    </section>
  );
}
