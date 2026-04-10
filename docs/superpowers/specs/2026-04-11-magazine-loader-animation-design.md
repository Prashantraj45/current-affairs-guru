# MagazineLoader Animation — Design Spec
Date: 2026-04-11

## Goal
Replace the existing blank-book framer-motion loader with a CSS keyframe book-opening animation that matches the app's dark theme.

## Files
- `frontend/components/animations/MagazineLoader.js` — rewritten
- `frontend/components/animations/MagazineLoader.module.css` — new

## Structure
The overlay is a full-screen fixed div (`z-[9999]`, bg `#080f1f`) controlled by `AnimatePresence` for a 0.5s fade-out exit. Inside sits a `.book` container with `perspective: 70rem`.

The book contains:
- 6 `.page` elements (off-white `#f5f0e8`) — CSS keyframe flip animations with staggered delays
- 1 static `.cover` (back cover, `#0f172a`)
- 1 `.cover` with `turn` class (front cover flips last, `#0f172a`)

## Keyframe Animations
Exact mechanics from reference, recolored:
| Keyframe | End angle | Used by |
|----------|-----------|---------|
| `bookOpen` | 180° | pages 1–3 |
| `bookOpen150deg` | 150° | page 4 |
| `bookOpen30deg` | 30° | page 5 |
| `bookOpen55deg` | 55° | page 6 |
| `bookCover` | 180° (z-index:1) | front cover |

Stagger delays: 0.05s, 0.33s, 0.66s, 0.99s, 1.2s, 1.25s. Total animation: 3s.

## Colors
| Element | Value |
|---------|-------|
| Overlay bg | `#080f1f` |
| Cover | `#0f172a` (slate-900) |
| Pages | `#f5f0e8` warm off-white |
| Page text/lines | `#94a3b8` (slate-400) |

## Behavior
- Shows once per session (sessionStorage key `magazineLoaderShown`)
- CSS animations start immediately on mount
- After 3s, framer-motion fades out overlay over 0.5s
- Component API unchanged — no props
