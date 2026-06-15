# AirClipboard

Clipboard sync between your Android phone and Mac — automatically, over your local network.

---

**Navigation:** [Overview](#overview) · [Architecture](#architecture) · [Install](#install) · [Usage](#usage) · [Development](#development) · [Project Structure](#project-structure)

---

## Overview

AirClipboard lives in your Mac menu bar. When you copy something on Android, it instantly appears on your Mac — and vice versa. No cloud, no accounts, no internet required. Everything stays on your local Wi-Fi.

**What it does:**
- Clipboard syncs automatically between Mac and Android in real time
- Works over local Wi-Fi (no internet required)
- Stores clipboard history you can browse and re-copy
- Runs silently in the background with a menu bar icon
- Optional "Launch at Login" so it's always ready

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Local Wi-Fi Network                       │
│                                                                  │
│   ┌──────────────────────┐        ┌──────────────────────────┐  │
│   │     Mac (Desktop)    │        │   Android (Mobile)       │  │
│   │                      │        │                          │  │
│   │  Electron menu bar   │◄──────►│  Native Android app      │  │
│   │  app (Node.js)       │  WS    │  (Kotlin + Jetpack       │  │
│   │                      │ :8585  │   Compose)               │  │
│   │  ┌────────────────┐  │        │  ┌────────────────────┐  │  │
│   │  │  WebSocket     │  │        │  │  WebSocket client  │  │  │
│   │  │  server        │  │        │  │  + mDNS discovery  │  │  │
│   │  │  (ws)          │  │        │  └────────────────────┘  │  │
│   │  └────────────────┘  │        └──────────────────────────┘  │
│   │  ┌────────────────┐  │                                      │
│   │  │  mDNS Bonjour  │◄─┼──── Android discovers Mac here      │
│   │  │  advertise     │  │                                      │
│   │  └────────────────┘  │                                      │
│   │  ┌────────────────┐  │                                      │
│   │  │  Clipboard     │  │                                      │
│   │  │  monitor       │  │                                      │
│   │  │  (clipboardy)  │  │                                      │
│   │  └────────────────┘  │                                      │
│   └──────────────────────┘                                      │
└─────────────────────────────────────────────────────────────────┘
```

**Discovery:** The Mac advertises itself via mDNS (Bonjour) as `_airclipboard._tcp`. Android scans for this service and connects automatically — no manual IP entry needed. A QR code fallback is also available.

**Pairing:** First connection requires a one-time pairing code. Once paired, devices reconnect automatically.

**Encryption:** All clipboard data is encrypted with a shared key established at pairing time (AES-GCM via Node.js `crypto`).

**Stack:**
| Layer | Technology |
|---|---|
| Mac app | Electron 28, React 18, ESM |
| Android app | Kotlin, Jetpack Compose, ZXing |
| Transport | WebSocket (ws) on port 8585 |
| Discovery | mDNS via bonjour-service / NsdManager |
| Clipboard (Mac) | clipboardy |
| Build | webpack (renderer), electron-builder (packager) |

---

## Install

### Mac

**Requirements:** macOS 10.15+, Node.js 18+, npm

```bash
cd desktop
npm install
npm run pack           # builds .app into dist/mac-arm64/
```

Open `dist/mac-arm64/AirClipboard.app` — drag it to `/Applications` to keep it.

The app runs entirely from the menu bar. No Dock icon appears.

### Android

**Requirements:** Android 8.0+ (API 26), Android Studio or terminal + JDK 17+

```bash
cd android
./gradlew assembleDebug
```

Install `app/build/outputs/apk/debug/app-debug.apk` on your device (enable "Install from unknown sources" in Settings → Security).

Or open the `android/` folder in Android Studio and run directly to a connected device.

---

## Usage

### First-time setup

1. **Start the Mac app** — the AirClipboard icon appears in the menu bar.
2. **Open the Android app** — it automatically scans your Wi-Fi for the Mac.
3. **Pair your devices:**
   - The Android app will show a pairing code.
   - A pair request notification pops up on Mac — click **Accept**.
   - You're paired. Devices reconnect automatically from now on.

> If mDNS discovery fails, tap **Manual Connect** in the Android app and scan the QR code shown in the Mac app (or type the IP:port directly).

### Day-to-day use

| Action | Result |
|---|---|
| Copy anything on Mac | Instantly available on Android clipboard |
| Copy anything on Android | Instantly available on Mac clipboard |
| Click menu bar icon | Opens the AirClipboard popup |
| Click an item in History | Copies it to clipboard |
| Right-click menu bar icon | Context menu: Open / Quit |

### Settings (inside the app)

- **Launch at Login** — toggle in the Devices tab; starts AirClipboard automatically when you log in.
- **Remove device** — tap the trash icon next to a paired device to unpair.
- **Clear history** — clears the local clipboard history log.

---

## Development

```bash
cd desktop
npm install
npm run dev            # starts webpack in watch mode + electron
```

The renderer rebuilds on every file save. Electron reloads automatically once `dist/renderer.js` exists.

**Scripts:**

| Command | What it does |
|---|---|
| `npm run dev` | Webpack watch + Electron (hot-reload) |
| `npm run build:renderer` | One-shot renderer bundle |
| `npm run pack` | Full build → `.app` in `dist/mac-arm64/` |
| `npm run build` | Full build → distributable DMG |

---

## Project Structure

```
AirClipboard/
├── desktop/                     # Electron Mac app
│   ├── assets/                  # App icons (tray, dock, icns)
│   ├── src/
│   │   ├── main/                # Electron main process (Node.js, ESM)
│   │   │   ├── index.js         # Entry point, app lifecycle, IPC
│   │   │   ├── preload.cjs      # Context bridge (CJS, required)
│   │   │   ├── store.js         # JSON file-based persistence
│   │   │   ├── tray/            # Menu bar tray icon + popup positioning
│   │   │   ├── websocket/       # WebSocket server
│   │   │   ├── clipboard/       # Clipboard polling (clipboardy)
│   │   │   ├── discovery/       # mDNS advertisement (bonjour-service)
│   │   │   ├── pairing/         # Device trust + pairing sessions
│   │   │   ├── security/        # AES-GCM encryption helpers
│   │   │   ├── history/         # Clipboard history store
│   │   │   └── notification/    # HUD notification window
│   │   ├── renderer/            # React UI (runs in Electron renderer)
│   │   │   ├── App.jsx          # Main UI component
│   │   │   ├── index.jsx        # React entry
│   │   │   ├── index.html       # Renderer HTML shell
│   │   │   └── styles.css       # Liquid glass UI styles
│   │   └── shared/
│   │       └── constants.js     # Shared constants
│   ├── webpack.renderer.config.cjs
│   ├── babel.config.json
│   └── package.json
└── android/                     # Android app (Kotlin + Jetpack Compose)
    └── app/src/main/
        └── java/com/airclipboard/
            ├── MainActivity.kt
            ├── ClipboardService.kt
            ├── WebSocketManager.kt
            ├── DiscoveryManager.kt
            └── ui/
```
