# Winamp Milkshake -- local setup

Two WebGL MilkDrop visualizers in one tree:

1. **Butterchurn** ([jberg/butterchurn](https://github.com/jberg/butterchurn)) -- the maintained modern JS port. **Default.**
2. **Milkshake** ([gattis/milkshake](https://github.com/gattis/milkshake)) -- the 2011 WebGL port that started this tree. Kept as a fallback.

Both let you play **any audio file from your computer** (MP3, OGG, WAV, FLAC, M4A, AAC, Opus -- whatever your browser can decode) and react to it.

## Run

From `D:\AI\WinampMilkshak`:

```
start.bat
```

or, equivalently:

```
npm start
```

Then open <http://localhost:8080/>. The root URL serves the Butterchurn page by default. You'll get a splash with two options:

1. **Choose audio file...** -- opens a file picker.
2. **Drag a file anywhere on the page.**

There's also a "Use the bundled sample" link that plays the ~56 MB `song.ogg` that ships with the upstream milkshake repo.

To switch engines:

- **Butterchurn (default)**: <http://localhost:8080/butterchurn.html>  -- hundreds of presets, actively maintained, best visuals.
- **Milkshake (legacy)**: <http://localhost:8080/milkshake.html>  -- the original engine, simpler, no preset pack.

To change the port: `set PORT=3000` (cmd) / `$env:PORT=3000` (PowerShell) before running `start.bat`.

## Butterchurn keyboard shortcuts

Once audio is playing:

| Key          | Action                                |
| ------------ | ------------------------------------- |
| `N` or `->`  | Next preset                           |
| `P` or `<-`  | Previous preset                       |
| `R`          | Random preset                         |
| `Space`      | Toggle auto-cycle (default: every 15s)|
| `F`          | Toggle fullscreen                     |
| `H`          | Hide/show the HUD                     |

The HUD (bottom-left) shows the current preset index and name, e.g. `3/55 -- Flexi - anatomy`. Preset changes blend over ~2.7 s.

## Presets

Butterchurn ships with the `butterchurn-presets` pack (loaded from CDN) -- that's the "base" pack of a few hundred MilkDrop presets curated by the Butterchurn author. If you want more, these community packs drop in easily:

- **butterchurn-presets-weekly** -- rotating weekly picks (jberg GitHub).
- **Cream of the Crop / Goomba / MilkDrop 2 / Jelly** packs from the old projectM / Winamp community -- convertible `.milk` files.
- **milkdrop-presets** repos on GitHub (many). `.milk` text presets can be loaded via `butterchurn.loadPreset(milkdropString)`.

Dropping in an extra pack is a one-line change to `butterchurn.html` (add another `<script src=...>` and merge into `presets`).

## What changed vs. upstream milkshake

| File | What |
| --- | --- |
| `butterchurn.html` | **New.** Butterchurn visualizer page. CDN-loaded engine + preset pack, file picker + drag-drop, HUD with preset counter, keyboard shortcuts, auto-cycle. |
| `LocalAudio.js` | **New.** Modern Web Audio backend for the milkshake engine: `AudioContext` -> `MediaElementSource` -> `ScriptProcessorNode(512)`, feeds PCM into `shaker.music.addPCM(L, R)` while playing the file through your speakers. |
| `milkshake.js` | Loads `LocalAudio.js` and accepts a second arg: `milk.shake(canvasId, audioUrl)`. If `audioUrl` is given, uses `LocalAudio`; otherwise falls back to the dead `SoundCloudAudio`. |
| `milkshake.html` | Replaced with a splash + file picker + drag-drop UI for the milkshake engine. The canvas resizes with the window. |
| `index.html` | Redirects to `butterchurn.html`. |
| `server/server.js` | **Added.** Zero-dep static server with HTTP `Range` support (so the audio element can seek through long files). Default route: `butterchurn.html`. |
| `start.bat`, `package.json` | **Added.** Launcher for Windows / `npm start`. |

The upstream milkshake engine files (`Shaker.js`, `Renderer.js`, `MilkDropPreset.js`, `Presets.js`, `song.ogg`, etc.) are untouched.

## Leftover files from the earlier clone

The workspace was first seeded from the `cggaurav/milkshake` Spotify fork. The Windows mount in this sandbox is read-only for delete operations, so some stale files from that fork couldn't be removed automatically:

```
css/    images/    js/    vendor/    visualizations/
manifest.json      README.md (old cggaurav readme)
```

They don't interfere with anything, but you can delete them manually in File Explorer / PowerShell if you want a clean tree. The upstream `README` (no `.md`) is the one you actually want.

## Browser notes

- **Modern Chrome, Firefox, Edge, or Safari** required (WebGL + Web Audio).
- On first page load the browser may block audio until a user gesture; the file picker click *is* a user gesture, so it should work as soon as you select a file. Click anywhere on the page if audio doesn't start.
- Butterchurn needs CDN access (butterchurn + butterchurn-presets, ~1 MB total). If you're offline, download the two `.min.js` files and point the `<script src>` tags at local copies.
- Milkshake's `ScriptProcessorNode` API is officially deprecated in favor of `AudioWorklet`, but it still works everywhere and is much simpler.
- Milkshake preset cycling: a new random preset every 10 seconds (unchanged from upstream).
- Butterchurn auto-cycle: every 15 seconds (toggle with Space).

## Known weirdness

- `milkshake.js` still uses synchronous `XMLHttpRequest` to load its class files. Modern browsers warn about this but haven't removed it. It works.
- If you pick a file your browser can't decode, the `<audio>` element will silently fail. The visualizer will still render but with zero energy (no beats).
- Safari's MP3 decoder is fine; Chrome/Firefox handle OGG/Opus; WAV works in all browsers.
- Butterchurn's `connectAudio` binds the visualizer to the current `AudioContext` source. If you drop a second file onto the Butterchurn page mid-playback, the page swaps the source and rebinds -- no reload needed.
