import './globals.css';

export const metadata = {
  title: 'AirClipboard — one clipboard, every device',
  description: 'Clipboard sync between Mac and Android over your local Wi-Fi. No cloud, no accounts, end-to-end encrypted.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
