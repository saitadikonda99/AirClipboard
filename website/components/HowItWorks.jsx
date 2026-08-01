const STEPS = [
  {
    num: '01',
    title: 'Open both apps',
    body: 'AirClipboard sits quietly in your Mac menu bar and advertises itself over mDNS — Android finds it automatically.',
  },
  {
    num: '02',
    title: 'Scan or confirm',
    body: "Scan the QR code on Mac, or connect manually by IP. Accept the one-time pairing code and you're trusted.",
  },
  {
    num: '03',
    title: 'Copy anywhere',
    body: 'From then on, every copy on either device shows up on the other — automatically, silently, instantly.',
  },
];

export default function HowItWorks() {
  return (
    <section id="how" className="on-cream">
      <div className="wrap">
        <div className="section-head">
          <div>
            <div className="eyebrow">How it works</div>
            <h2>Paired in under a minute</h2>
          </div>
          <p className="section-note">Three steps, no configuration files, no account creation.</p>
        </div>
        <div className="steps">
          {STEPS.map((step) => (
            <div className="step" key={step.num}>
              <div className="step-num">{step.num}</div>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
