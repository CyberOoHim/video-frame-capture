# FrameCap — Video Screenshot Studio

**Frame-accurate, offline-first video frame capture. No upload, no dependencies, just your browser.**

> Drop any MP4 / MOV / WebM → scrub with millisecond precision → hit **S** → get a perfect PNG/JPEG named `myvideo_00-01-23-456.png`.

![PWA Ready](https://img.shields.io/badge/PWA-ready-6c5cff?style=flat-square)
![Offline](https://img.shields.io/badge/offline-first-00d9ff?style=flat-square)
![No Deps](https://img.shields.io/badge/zero%20dependencies-23c55e?style=flat-square)
![License MIT](https://img.shields.io/badge/license-MIT-lightgrey?style=flat-square)

Live Demo: serve `framecap_pwa.html` locally or deploy to any static host. See **Quick Start**.

---

## ✨ Features

### Core Capture (bug-free)
- **Instant capture** — reads `currentTime` synchronously, no more waiting for Play to unblock
- Never gets stuck: `capturing` flag always resets in `finally`, buttons wrapped in safe guards
- Auto-pause on capture, full-res canvas `drawImage(video)` at native `videoWidth × videoHeight`
- PNG or JPEG toggle, auto-download + gallery history (24 frames)

### Precise Time Control
- **60fps RAF time loop** instead of low-freq `timeupdate` — timecode ticks at `MM:SS.mmm` / `HH:MM:SS.mmm`
- Millisecond highlight: `00:12<span>.456</span>`
- **Scrub tooltip** shows exact time under cursor while hovering/dragging
- Frame counter + FPS auto-detection via `requestVideoFrameCallback` metadata
- Frame stepping with `,` / `.` (1/30s), ±5s with `J`/`L` / arrow keys

### Jump to Exact Time
New input row under controls:
```
[ 243 f • 30 fps ] [ 00:01:23.456 • 12.345s • 250f ] [Go] [Copy]
```

Supports:
| Format | Example |
|--------|---------|
| `hh:mm:ss.mmm` | `01:02:03.456` |
| `mm:ss.mmm` | `01:23.456` |
| seconds | `12.345` or `12.345s` |
| milliseconds | `1234ms` |
| frames | `250f` or `250 frames` (uses detected FPS, fallback 30) |

Click the main timecode to copy it into the input. Enter = Go.

### Gallery That Actually Shows Everything
- Thumbnails use `object-fit: contain` — entire frame visible, never cropped, letterboxed on black + subtle checkerboard
- Filenames are **fully visible**: `word-break: break-all; white-space: normal` — no `…` truncation
- Hover lift, clear download/remove buttons, lazy-free eager rendering for instant feedback
- Thumbnail stored as lightweight JPEG data URL (max 480px, SW-safe), full-res blob kept for download → never goes black after PWA activation

### PWA — Installable & Offline
- `manifest.webmanifest` + `sw.js` (v3) with proper scope, theme color, maskable icons (192 & 512)
- Service worker caches app shell only — **ignores `blob:` and `data:` URLs** (fixes black thumbnail bug)
- Install button appears via `beforeinstallprompt`, works on Chrome/Edge desktop + mobile
- Offline indicator, update-safe cache versioning

### UX Polish
- Drag & drop, file picker, **paste from clipboard** (`Ctrl+V`)
- Flash animation, toast notifications
- Keyboard-first workflow
- Responsive grid: 2 → 3 → 4 columns

---

## 🚀 Quick Start

### Option A — Just open it
```bash
# download these 5 files keeping structure:
framecap_pwa.html
manifest.webmanifest
sw.js
pwa/icon-192.png
pwa/icon-512.png

# then double-click framecap_pwa.html
# (PWA install requires http, so use Option B for install)
```

### Option B — Serve locally (for PWA install)

```bash
npx serve .
# or
python -m http.server 8000
# open http://localhost:8000/framecap_pwa.html
```

Deploy to **Vercel / Netlify / GitHub Pages / Cloudflare Pages** — any static host works. Keep `pwa/` folder next to HTML.

---

## 📁 File Structure

```
/
├── framecap_pwa.html      # main app (single-file, zero deps)
├── manifest.webmanifest   # PWA metadata
├── sw.js                  # service worker v3 (blob/data safe)
└── pwa/
    ├── icon-192.png
    └── icon-512.png
```

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play / Pause |
| `J` / `←` | Back 5s |
| `L` / `→` | Forward 5s |
| `,` / `.` | Frame step -1 / +1 (1/30s) |
| `S` | Capture current frame |
| `Home` / `End` | First / Last frame |

All shortcuts ignored when typing in inputs.

---

## 🛠️ How It Works

1. **Load**: `URL.createObjectURL(file)` → `<video>`
2. **First frame paint**: `seekTo(0.001)` forces a real seek (0 is often no-op) → `seeked` → `waitForFrame()`
3. **Precise display**: RAF loop updates `currentTime` at 60fps, formats with `Math.floor(time*1000)`
4. **Capture**:
   ```js
   const t = video.currentTime; // sync read
   if (!video.paused) video.pause(); // fire-and-forget
   await doubleRAF(80ms max); // compositor settle, never RVFC when paused
   canvas.drawImage(video,0,0,w,h);
   thumb = downscaleToDataURL(canvas, 480px); // SW-safe gallery
   blob = canvas.toBlob(PNG/JPEG);
   ```
   Previous bug: `requestVideoFrameCallback` never fires while paused → hung until Play. Fixed by detecting `video.paused` and using only `requestAnimationFrame`.

5. **Gallery**: `captures.unshift({url: blobURL, thumb: dataURL, ...})`, render grid with `img.src = thumb`

6. **PWA**: SW caches app shell only, `fetch` handler bails on `blob:`/`data:` to prevent thumbnail interception.

No backend, no tracking, all in memory. Revokes blob URLs on remove.

---

## 🌐 Browser Support

- Chrome / Edge 90+ (best, full RVFC + PWA)
- Firefox 90+ (falls back to RAF)
- Safari 16+ (PWA limited, capture works)

Requires: `<canvas>`, `URL.createObjectURL`, `requestAnimationFrame`.

---

## 🔒 Privacy

100% local. Video never leaves your device. No analytics, no CDN, no upload. Works offline after first load.

---

## 🐛 Fixed Issues

- **Capture button dead after 2-3 clicks / waiting for Play** → removed RVFC wait when paused, flag always reset in `finally`
- **Thumbnails go black when >1 capture** → SW was intercepting `blob:` URLs; fixed SW + switched gallery to data URL thumbs
- **Cropped thumbnails / truncated filenames** → `contain` + `break-all` wrapping

---

## 🎨 Customization

- Change accent: edit `:root { --accent, --accent2, --green }`
- Max captures: `captures.slice(0,24)` → change number
- Thumbnail quality: `toDataURL('image/jpeg', 0.72)`
- Default format: `let format = 'png'`

---

## 📦 Roadmap

- [ ] WebCodecs precise frame decode for exact frame numbers
- [ ] ZIP export of all captures
- [ ] Trim / range capture
- [ ] Custom filename template

PRs welcome.

---

## 📄 License

MIT — do whatever you want, keep the copyright notice.

---

Made for editors, researchers, and anyone who needs a pixel-perfect frame without opening Premiere.
