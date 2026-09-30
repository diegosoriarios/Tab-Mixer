# Tab Mixer

<p align="center">
  <img src="icons/icon128.png" alt="Tab Mixer logo" width="128" />
</p>

**A volume mixer for your browser tabs — turn one tab down, another up.**

Tab Mixer is a Chrome extension (Manifest V3) that gives you an independent volume slider for every tab that is making sound. Lower the video call, raise the music. Mute the autoplaying news site without losing your podcast. All from one popup — no per-site settings, no hunting through player UIs.

---

## Why

Browsers give you exactly two volume controls: the **system volume** and the **per-tab mute button**. That's a binary switch where you often want a fader. The classic scenario:

> You're on a Google Meet call with a screen-share running, a tutorial playing on YouTube, and music in a third tab. Three sources, one pair of ears. Tab Mixer turns your browser into a mixing desk: one slider per channel.

## Features

- **Per-tab volume, 0–100%** — works on *any* tab that plays audio, including DRM-protected players (Netflix, Disney+) because it uses the browser's own volume property rather than audio reprocessing.
- **Web Audio support** — sites that route sound through an `AudioContext` graph instead of media elements (Zoom's web client is the famous case) are covered by an injected audio hook.
- **One popup, every audible tab** — the popup lists every tab currently playing sound, plus any tab you've already customized, each with a favicon, title, and slider.
- **Enforced settings** — once you set a tab below 100%, the extension holds that level even if the site's player tries to reset it. Drag back to 100% to release control and return the site's own volume slider to normal.
- **Predictable reset** — a custom volume belongs to the loaded page. Reload or navigate the tab and it returns to 100%, so a stale 10% setting can never ambush your next call. (Single-page-app navigation — e.g. clicking to the next YouTube video — keeps the setting.)
- **Session-only** — nothing is persisted to disk. Close the browser and everything is back at 100%.

## Install (from source)

Tab Mixer is not yet published to the Chrome Web Store. To run it from source:

1. Download or clone this repository.
2. Open `chrome://extensions` in Chrome (or Edge/Brave).
3. Enable **Developer mode** (toggle, top right).
4. Click **Load unpacked** and select this folder.
5. Pin the Tab Mixer icon, play audio in a couple of tabs, and click the icon.

No build step, no dependencies, no npm install — it's plain HTML/CSS/JS.

## Usage

1. Click the Tab Mixer icon. Every audible tab appears as a row: favicon · title · slider · percentage.
2. Drag a slider. The change applies **live** — you don't need to focus that tab.
3. Rows marked in indigo have a custom volume. Tabs you've silenced to 0% stay listed so you can bring them back.
4. **100% = untouched.** Below 100%, Tab Mixer actively enforces the level.
5. Reload or navigate a tab → its custom volume is cleared automatically.

### How volume is applied

Two mechanisms, depending on how the site plays sound:

| Site type | Mechanism |
|---|---|
| Standard `<audio>`/`<video>` elements (YouTube, Netflix, SoundCloud, Meet…) | The content script sets `element.volume` on every media element, including ones added later, in the main document and all iframes. |
| Web Audio API graphs (Zoom web client, Discord-style apps) | An audio hook running in the page's own context intercepts connections to the speaker destination and inserts a pass-through `GainNode` whose gain is your slider value. |

The two paths compose harmlessly; at 100% both are mathematically transparent.

## Architecture

```
media-controller/
├── manifest.json      MV3 manifest: permissions, icons, static content script
├── background.js      Service worker — the brain
├── content.js         Isolated-world content script — media-element control
├── audio-hook.js      MAIN-world content script — Web Audio graph control
├── popup/             The UI
│   ├── popup.html
│   ├── popup.css
│   └── popup.js
├── icons/             16 / 48 / 128 px icons
├── test/              Node mock harness for audio-hook.js
└── design/            Logo sources, test sheets, brand guidelines
```

- **`background.js`** (service worker) keeps the authoritative `{tabId → volume}` map in `chrome.storage.session` — it survives the worker being suspended (MV3 kills idle workers after ~30 s) but is wiped when the browser closes, which is exactly the intended lifetime. It injects `content.js` into a tab on demand, relays slider changes to every frame, cleans up closed tabs, and clears a tab's entry whenever the tab navigates (the reset rule).
- **`content.js`** runs in Chrome's *isolated world*: it applies `volume` to all media elements now and in the future (via `MutationObserver`), and enforces the level by re-clamping any `volumechange` it didn't cause. It also relays the volume into the page's main world via a DOM `CustomEvent` — the two worlds don't share JavaScript, but they do share events.
- **`audio-hook.js`** runs in the *main world* at `document_start`, before the page's first line of code. It patches `AudioNode.prototype.connect` so that whenever anything connects to an `AudioContext`'s speaker destination, a Tab Mixer `GainNode` is silently inserted in series. It listens for the relayed CustomEvent to retune every inserted gain at once. Hooking before page code runs is what makes it work: a graph already wired up can't be enumerated retroactively. `OfflineAudioContext` (recording/processing) and microphone paths are deliberately excluded.
- **`popup/`** merges two sources — currently-audible tabs (`chrome.tabs.query({audible: true})`) plus tabs with a saved custom volume (so a 0%-silenced tab stays reachable) — and applies slider input messages live.

## Permissions (and why each one is needed)

| Permission | Reason |
|---|---|
| `tabs` | Read tab titles and audible state to build the popup list. |
| `host_permissions: <all_urls>` | Inject the content script / audio hook into whatever tab you're mixing — by definition, any site. |
| `scripting` | On-demand script injection into audible tabs. |
| `storage` | `chrome.storage.session` for the in-memory volume map. |
| `favicon` | Show site favicons in the popup. |

**Privacy:** Tab Mixer has no servers, makes no network requests, collects nothing, and stores nothing beyond an in-memory tab→volume map that dies with the browser.

## Known limitations

- **Native apps** — the Zoom/Teams desktop applications aren't browser tabs; an extension can't touch them.
- **Web Audio edge cases** — if a site rebuilds its audio graph *within* the same page load (rejoining a meeting without navigating), the previous multiplier can persist until you reload. Rare, and the reset rule bounds the damage.
- **No amplification** — deliberately: 100% is the ceiling. Boosting above 100% requires the Web Audio API, which breaks on DRM content; the design choice was universal compatibility over loudness tricks.
- **Discord-style edge cases** — apps that do exotic audio processing should work via the hook, but exotic setups (sample-accurate loopback analysis, custom destination nodes) are untested territory.

## Development

Everything is plain ES2020-ish JavaScript — edit and reload the extension; there's no toolchain.

- **Syntax check:** `node --check background.js content.js audio-hook.js popup/popup.js`
- **Audio-hook logic** is covered by a spec-accurate Node mock harness: `node test/hook-test.js` (asserts insert-once, repeat-connect dedupe, live retune, offline-context bypass, release-to-1).
- **Manual test matrix:** two audio tabs → independent sliders; set one to 0% → it stays listed; Meet + music → call lowers, mic unaffected; Netflix → works; reload a customized tab → resets to 100%; reload the extension → everything at 100% (session-only state).

### Design assets

The logo (the *Fader M*: an M whose strokes meet at a mixing knob) and the "tab mixer" wordmark are hand-built SVGs in [`design/`](design/) — concept sheets, audit results, colour/one-colour/reversed masters, favicon sets, and a one-page usage guide in [`design/guidelines.md`](design/guidelines.md). Palette: ink `#17171C` + signal indigo `#4F46E5`, where indigo marks *the control point* — the knob, and the dot of the *i* in "mixer".

## Version history

| Version | Change |
|---|---|
| 0.2.0 | Web Audio hook (`audio-hook.js`) — Zoom web client and other `AudioContext`-based sites now respond to sliders; custom volumes reset on navigation. |
| 0.1.0 | Initial release: per-tab volume via media elements, popup mixer, session-only state. |

## Credits

Designed and built with [opencode](https://opencode.ai). Logo designed with the *logo-design* skill (1,400+ reference library, geometric audit + 16 px test sheets). Icons and marks in this repo are original artwork.
