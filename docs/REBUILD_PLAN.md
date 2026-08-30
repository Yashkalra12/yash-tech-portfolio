# Portfolio rebuild — build notes

Notes I kept while rebuilding this portfolio from scratch on `yash_2026Sep`.
The README is the front door; this is the working log — decisions, the gesture
spec, and the bugs that cost me the most time.

## Decisions

- **Vite + React 18 + Tailwind**, framer-motion for motion, gsap for
  scroll-driven motion. No extra drag or animation libraries.
- **Look**: white ground, one blue accent (`#006AFF`), mac-window chrome with
  working traffic lights, an ID-card hero, handwritten notes in the margins,
  live iframes instead of project screenshots. Dark mode is a remap of the
  handful of surface utilities the design uses, not a `dark:` variant per
  component.
- **`src/data/profile.js` is the single source of truth** — sections, the RAG
  knowledge base and `llms.txt` all derive from it.
- **The RAG terminal runs fully client-side**: BM25 over a local corpus, no API
  key, no network call. An LLM phrasing layer is optional and goes through a
  proxy — never a `VITE_` key, since those are inlined into the bundle.
- **My previous dark build stays at `/legacy`** so nothing is thrown away.
- `src/ui/` rather than `src/components/`, because the latter would collide with
  the existing `src/Components` on a case-insensitive macOS filesystem.
- Fonts: Inter Tight, Instrument Serif for display, Space Mono in the terminal,
  Nanum Pen Script for the margin notes.

## Gesture vocabulary

Matches the tutorial modal, and is what `gestures.js` implements:

- **Head tracking** — nose offset from face centre, normalised by face size, ×3,
  clamped to −1..1. Steers the cursor whenever no hand is in frame. The same
  landmarks drive the robot head in the About section.
- **Open hand** — palm (landmark 9) takes the cursor over.
- **Pinch to click** — thumb-index under `0.05`, released over `0.08`
  (hysteresis), 3 frames of agreement each way, 300ms cooldown.
- **Pinch and drag to scroll** — a held pinch that travels more than 15px
  vertically becomes a scroll at 8px per px, inverted (grab and pull), coasting
  on release with `velocity *= 0.95` per frame until under 0.5px.
- **Fist** — hard-cancels, and suppresses pinches for 200ms afterwards, because
  a hand passes through pinch-like shapes on its way out of a fist.

`gestures.js` is pure geometry — no React, no DOM — and is unit-tested by
`npm run test:gestures` (26 assertions, including the fist-that-looks-like-a-
pinch trap and head-pose scale invariance).

Tuning lives in four constants at the top of `HandControlProvider.jsx`:
`SCROLL_GAIN`, `SCROLL_DEADZONE`, `SMOOTHING`, `CLICK_COOLDOWN_MS`. Worth
adjusting on real hardware rather than by reasoning.

## Bugs found and fixed

1. `Reorder.Values` does not exist in framer-motion; the API is `Reorder.Group`.
2. The retriever returned nothing for "who is yash": every word in that question
   is a stopword, so the query was empty after filtering. Synonym lookup now
   runs against the *unfiltered* tokens, since "who" and "where" carry intent.
3. Synonym-expanded terms scored the same as typed ones, so "what did he do at
   Lumio AI?" ranked the AI/LLM skills passage above the Lumio job. Synonyms are
   now weighted at 0.4.
4. The absolute `minScore` floor of 0.6 discarded valid matches whose only shared
   term was common; lowered to 0.12, leaning on the relative band instead.
5. Hand control never started for real visitors: the delegate was hardcoded to
   `"GPU"`, and without a WebGL context the wasm graph fails with
   `emscripten_webgl_create_context() returned error 0`. WebGL2 is now probed up
   front, GPU creation is wrapped in a try/catch, and a delegate that builds but
   then fails every frame is rebuilt on CPU after 12 consecutive bad frames.
6. Camera start was fragile on phones: fixed `640x480` constraints could throw
   `OverconstrainedError`, and iOS Safari can reject `play()` before
   `loadedmetadata`. Constraints are `ideal` now, and metadata is awaited.
7. Nothing told the visitor that `getUserMedia` needs a secure context — the
   single biggest reason it "doesn't work on my phone". Both the hook and the
   consent modal say so explicitly now.
8. The cursor position was React state written on every gesture frame, so the
   whole subtree re-rendered up to 60×/sec. It is a ref now, and `HandCursor`
   paints the cursor and the skeleton from one animation-frame loop.
9. Camera opened but nothing was ever detected. Two causes, both of which fail
   *silently* — the graph builds, then `detectForVideo` returns empty results
   forever, so counting thrown errors never helped:
   - The wasm runtime was loaded from the `0.10.14` CDN while the installed
     package was `0.10.35`. It is copied out of `node_modules` into
     `public/mediapipe/wasm` at build time now, so the versions cannot drift.
   - A GPU delegate that passes the WebGL2 probe can still fail inside wasm.
     There is a watchdog: no detection within 2.5s of starting rebuilds the
     landmarker on CPU.

   Detection confidences also dropped from 0.5 to 0.3 — the defaults reject a lot
   of real hands in ordinary webcam lighting — and the preview grew a live
   fps/tracking readout so this class of failure is visible next time.
10. The skills marquee travelled a full list length per viewport of scroll, which
    read as a blur. It travels 14% now, with `scrub: 2`.

## Still worth doing

- Swap the hero laptop's mock terminal for a real screenshot or a device frame.
- Consider a real embedding model for the terminal if the corpus grows past a few
  hundred passages; BM25 is the right call at this size.
- Verify the serif headings, the robot's proportions and dark-mode contrast on
  the handwritten notes on real devices, not just in a build.
