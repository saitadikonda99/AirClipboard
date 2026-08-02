import SplitButton from './SplitButton';
import { REPO_URL } from './links';

export default function Nav() {
  return (
    <nav>
      <div className="wrap nav-inner">
        <div className="brand">
          <span className="brand-glyph">A</span>
          AirClipboard
        </div>
        <div className="nav-links">
          <a href="#features" className="navlink">Privacy</a>
          <a href="#how" className="navlink">How it works</a>
          <a href="#download" className="navlink">Download</a>
          <SplitButton href={REPO_URL} variant="ghost">GitHub</SplitButton>
        </div>
      </div>
    </nav>
  );
}
