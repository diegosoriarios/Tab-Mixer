# Tab Mixer — Logo Usage Guide

One-page brand reference for the *Fader M* mark (designed with the logo-design skill, all masters are hand-built SVG).

## The mark

A monoline **M** — the initial of *Mixer* — whose two strokes meet at a **mixing knob**, set mid-track. The mark says both halves of the name: the letter and the act of mixing tab levels on a desk.

- **Masters:** `design/final/final-symbol.svg` (colour), `final-horizontal.svg` (lockup), `final-symbol-small.svg` (small-size cut)
- Construction is stroke-based (documented variant); geometry: 256-unit grid, 26-unit stroke, round terminals, knob r = 28
- Wordmark: lowercase "tab mixer" on a monoline grid (x-height 52, stroke 9); the **dot of the *i* in "mixer" is the indigo knob** — the accent lands inside the word *mix*

## Colour

| Role | HEX | RGB | Usage |
|---|---|---|---|
| Ink | `#17171C` | 23 23 28 | M strokes, wordmark, text |
| Signal indigo | `#4F46E5` | 79 70 229 | Knob + the *i*-dot — **the only accent, always the control point** |

- Contrast: indigo on white ≈ 6.0:1 (passes AA); ink on white ≈ 16:1
- One-colour rules: all-black and all-white masters are in `design/final/export/` (`tab-mixer-black.svg`, `-white.svg`, `-mono-4f46e5.svg`)
- On the indigo tile (`tab-mixer-app-icon.svg`) the mark turns solid white

## Minimum sizes

| Asset | Minimum | File |
|---|---|---|
| Symbol | 16 px | `icons/icon16.png` (small-size cut: enlarged knob) |
| Symbol, standard | 24 px | `final-symbol.svg` |
| Horizontal lockup | 120 px wide | `final-horizontal.svg` |

Below 24 px use the small cut (`final-symbol-small.svg`) — bigger knob, same skeleton.

## Clear space

Keep at least **½ knob diameter** (14 units at master scale, i.e. ~14 px at 256 px render) free on all sides. Nothing enters the M's counters.

## Approved backgrounds

White, off-white (`#FAFAF8`+), ink `#17171C`, indigo `#4F46E5` (mark in white). Photography only at ≥60% local luminance or with a scrim.

## Misuse — never

- Recolour the knob anything but indigo (or flat one-colour masters)
- Move the knob off the meeting point, or resize it independently
- Add gradients, shadows, outlines or effects
- Stretch, rotate or skew; redraw the M with sharp corners
- Set the wordmark in a font — it is custom-drawn; use the SVG

## Extension assets (this repo)

`icons/icon16.png`, `icons/icon48.png`, `icons/icon128.png` — wired into `manifest.json`:

```json
"icons": { "16": "icons/icon16.png", "48": "icons/icon48.png", "128": "icons/icon128.png" },
"action": { "default_icon": { "16": "icons/icon16.png", "48": "icons/icon48.png" } }
```

Full web/PWA set (favicon.ico, 192/512, maskable): `design/final/export/`.

## Honesty notes

- Geometry was verified numerically (audits 99/100, contrast, margins, 16px stroke math). The design session model could not view images — **a human should eyeball** `design/concepts.png`, `design/preview.html` and `design/renders/` before shipping.
- Wordmark letterforms are original constructions; still, do a reverse-image search before any public/trademark use.
- Name history: designed as "Media Controller", renamed to **Tab Mixer** before release — concept archives in `design/concepts/` predate the rename.
