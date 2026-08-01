export function ClipboardGlyph({ size = 13, stroke = '#fff' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" />
    </svg>
  );
}

export function ArrowIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="7" y1="17" x2="17" y2="7" />
      <polyline points="7 7 17 7 17 17" />
    </svg>
  );
}

export function CheckIcon({ size = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export function AppleIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-3.014 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.572-2.27 1.206-2.98.804-.94 2.14-1.64 3.14-1.68.03.13.03.19.03.13-.03.13.155.16.155.3zM20.5 17.28c-.5 1.15-.74 1.67-1.38 2.68-.9 1.42-2.17 3.18-3.75 3.2-1.4.02-1.76-.91-3.66-.9-1.9.01-2.3.92-3.7.9-1.58-.02-2.78-1.6-3.68-3.02C1.9 17.03.9 13.5 2.28 11.15c.98-1.66 2.65-2.7 4.4-2.72 1.55-.02 3.02 1.06 3.97 1.06.94 0 2.7-1.3 4.58-1.11.78.03 2.96.31 4.36 2.37-.11.07-2.6 1.53-2.58 4.56.03 3.6 3.17 4.8 3.2 4.82-.02.08-.5 1.72-1.71 3.15z" />
    </svg>
  );
}

export function AndroidIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.6 9.48l1.84-3.18c.16-.31.03-.69-.26-.85-.28-.14-.61-.04-.78.22l-1.86 3.22a11.5 11.5 0 0 0-8.98 0L5.7 5.67a.638.638 0 0 0-.87-.2.615.615 0 0 0-.22.83L6.44 9.48A11 11 0 0 0 1 18h22a11 11 0 0 0-5.4-8.52zM7 15.25a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5zm10 0a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5z" />
    </svg>
  );
}
