export default function SyncIllustration() {
  return (
    <div className="sync-panel">
      <span className="panel-tag"><span className="dot" />synced</span>
      <svg className="sync-svg" viewBox="0 0 440 380" preserveAspectRatio="xMidYMid meet" fill="none">
        <path className="sync-path" d="M143,196 C155,295 325,300 354,166" />

        <g className="device-group laptop">
          <rect className="device-frame" x="26" y="36" width="234" height="142" rx="6" />
          <rect className="device-screen" x="38" y="48" width="210" height="96" rx="1" />
          <rect className="device-bar accent" x="50" y="64" width="98" height="9" rx="1" />
          <rect className="device-bar" x="50" y="82" width="140" height="6" rx="1" opacity=".5" />
          <rect className="device-bar" x="50" y="96" width="118" height="6" rx="1" opacity=".3" />
          <path className="device-frame" d="M26,178 H260 L247,196 H39 Z" />
        </g>

        <g className="device-group phone">
          <rect className="device-frame" x="304" y="166" width="100" height="196" rx="14" />
          <rect className="device-screen" x="316" y="192" width="76" height="150" rx="2" />
          <rect className="device-bar accent" x="326" y="210" width="56" height="8" rx="1" />
          <rect className="device-bar" x="326" y="226" width="40" height="6" rx="1" opacity=".5" />
          <circle className="device-cam" cx="354" cy="179" r="1.8" />
        </g>

        <circle className="ripple ripple-laptop" cx="143" cy="196" r="7" />
        <circle className="ripple ripple-phone" cx="354" cy="166" r="7" />

        <g className="packet">
          <circle className="packet-glow" r="9" />
          <circle className="packet-core" r="4" />
        </g>
      </svg>
    </div>
  );
}
