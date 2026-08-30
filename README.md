# Yash Kalra — Portfolio

My portfolio, built with Vite, React and Tailwind CSS. White ground, one strong
blue accent, mac-window cards with traffic lights that actually work, and
handwritten notes in the margins. There is a dark theme too, and it follows your
system setting until you touch the switch.

Three things on it are worth reading the code for.

## 1. RAG terminal

`src/features/ragTerminal/` — ask the site anything about me and get an answer
grounded in a local knowledge base, with the retrieved sources shown underneath.

- **Retrieval is BM25** over ~30 short passages, with a synonym layer so
  "where does he live" and "is he open to relocating" both land correctly.
  Synonym-derived terms are down-weighted so a rare word in the question
  (a company name, say) still wins.
- **It needs no API key and makes no network call.** The whole index is built at
  module load from `src/data/profile.js`.
- **Optional LLM phrasing**: set `VITE_RAG_ENDPOINT` (see `.env.example`) to
  point at a proxy that holds the key. Never put a key in a `VITE_` variable —
  anything with that prefix is inlined into the browser bundle in plain text.
  Retrieval still runs first, so answers stay grounded, and any failure falls
  back to the local answer.
- An answer arrives in four visible stages: searching, generating, typing out,
  settled. Local retrieval finishes in about a millisecond, so without those
  floors the answer just appears, which reads as a canned lookup rather than
  something being worked out. The stages are also the seam a real model plugs
  into later — they are already the ones a streaming completion has.
- It also works as a shell — `whoami`, `projects`, `skills`, `contact`, `help`.
  Arrow keys walk back through your history.

## 2. llms.txt

`public/llms.txt` is generated from `src/data/profile.js` by
`scripts/generate-llms-txt.mjs`, and is readable from the footer notch — in a
dialog, so reading it never takes you off the page.

[llms.txt](https://llmstxt.org) is a convention for serving a curated plain-text
version of a site, so language models read prose I wrote rather than scraped
markup. Generation is wired into `npm run build`, so the file can never drift
from the site.

```bash
npm run llms   # regenerate public/llms.txt
```

## 3. Hand control

`src/features/handControl/` — opt in and steer the page with your webcam.

| Gesture | Action |
| --- | --- |
| Move your head | Steer the cursor |
| Open palm | Take the cursor over with your hand instead |
| Pinch and release | Click whatever the cursor is over |
| Pinch and drag | Scroll, with momentum when you let go |
| Fist | Cancel everything and hold still |

The interesting parts are the transitions, not the poses. A pinch is only a
*click* if you release it without having dragged; drag past a threshold and the
same pinch becomes a scroll that ends in a coast. Every pose change waits for
three consecutive frames of agreement, because single frames of landmark noise
otherwise fire phantom clicks. A fist hard-cancels and suppresses pinches for a
moment afterwards, since a hand passes through pinch-like shapes while opening
out of a fist.

The same face landmarks drive the robot in the About section, which tilts its
head to match yours. One camera stream, one set of models, two features.

- Nothing starts until you click through the explainer, and the camera is only
  requested from that click. Turn it off any time from the top-right button.
- **Video never leaves the device** — frames are processed in-browser by Google's
  MediaPipe HandLandmarker and FaceLandmarker. Nothing is recorded or uploaded.
- A small mirrored preview draws the detected hand skeleton, so you can see
  whether the tracker has actually found your hand.
- The ~2MB MediaPipe bundle is dynamically imported, so visitors who never turn
  it on never download it.

**It needs an HTTPS origin.** `getUserMedia` is only available in a secure
context, so the camera works on the deployed site and on `localhost`, but *not*
over plain http on a LAN IP — which is the usual way people try it from a phone.
Use the deployed URL or a tunnel (`npx localtunnel --port 5173`). The consent
modal says so up front when the origin is insecure.

**Delegates.** Tracking prefers MediaPipe's GPU delegate but falls back to CPU
whenever WebGL2 is unavailable (Chrome with hardware acceleration off, several
mobile browsers) — otherwise the wasm graph dies with
`emscripten_webgl_create_context() returned error 0`. That failure is often not a
thrown exception: the graph builds, and inference then returns empty results
forever. So there is also a watchdog — if the GPU delegate produces no detection
at all in its first 2.5 seconds, it is rebuilt on CPU. Inference is capped at
~25fps so the CPU path stays usable on a phone.

The preview shows a live readout (`GPU 25fps · tracking` / `· no hand`) so a
silent failure is never invisible. Append `?handcpu=1` to the URL to force the
CPU delegate.

**The wasm runtime is served from this origin**, copied out of
`node_modules/@mediapipe/tasks-vision` into `public/mediapipe/wasm` by
`scripts/copy-mediapipe-wasm.mjs` (wired into `predev` and `prebuild`, and
gitignored). Pointing MediaPipe at a CDN version pins the binaries independently
of the JS glue the app imports, and a mismatch there is another way to get a
graph that builds and then detects nothing.

## Running it

```bash
npm install
npm run dev            # http://localhost:5173
npm run build          # regenerates llms.txt, then builds
npm run lint
npm run test:gestures  # pure-geometry tests for the gesture recognisers
```

## Editing content

**`src/data/profile.js` is the single source of truth.** The UI sections, the RAG
knowledge base and `llms.txt` are all derived from it — add a job or a project
there and it shows up in all three, including as something the terminal can
answer questions about.

Two things live outside it on purpose: the rotating job titles in the hero are
animated with CSS `content`, so they are duplicated in `@keyframes roleCycle` in
`src/styles/portfolio.css` and have to be kept in step with `identity.roles`.
And dark mode remaps the handful of surface utilities the design uses, in that
same stylesheet, rather than adding a `dark:` variant to every component — so a
component added later is themed without being touched.

## Layout

```
src/
  data/profile.js              all content, single source of truth
  ui/                          the UI components
  Pages/Portfolio.jsx          the page at /
  features/ragTerminal/        knowledge base, BM25 retriever, terminal UI
  features/handControl/        MediaPipe tracking, consent gate, cursor
  styles/portfolio.css         theme, and the CSS Tailwind cannot express
  Components/, Pages/Home.jsx  my previous dark-themed build, served at /legacy
scripts/generate-llms-txt.mjs  profile.js -> public/llms.txt
scripts/copy-mediapipe-wasm.mjs  vendors the MediaPipe wasm runtime
```

My previous dark portfolio is still live at **`/legacy`** while this one settles.

## Type

Inter Tight for everything, Instrument Serif for the display headings, Space
Mono in the terminal, and Nanum Pen Script for the handwritten margin notes.
