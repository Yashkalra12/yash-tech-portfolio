# Yash Kalra — Portfolio

A portfolio built with Vite, React and Tailwind CSS. The layout and visual
language are a tribute to
[AVIVASHISHTA29/Portfolio2021](https://github.com/AVIVASHISHTA29/Portfolio2021):
white ground, one strong blue accent, "mac window" cards with working traffic
lights, and handwritten notes in the margins.

On top of that it ships three things most portfolios do not.

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
  point at a proxy that holds your key. Retrieval still runs first, so answers
  stay grounded, and any failure falls back to the local answer.
- It also works as a shell — `whoami`, `projects`, `skills`, `contact`, `help`.
  Arrow keys walk back through your history.

## 2. llms.txt

`public/llms.txt` is generated from `src/data/profile.js` by
`scripts/generate-llms-txt.mjs`, and is also rendered on the page itself so you
can read exactly what a crawler gets.

[llms.txt](https://llmstxt.org) is a convention for serving a curated plain-text
version of a site, so language models read prose you wrote rather than scraped
markup. Generation is wired into `npm run build`, so the file can never drift
from the site.

```bash
npm run llms   # regenerate public/llms.txt
```

## 3. Hand control

`src/features/handControl/` — opt in and steer the page with your webcam.

| Gesture | Action |
| --- | --- |
| Open palm, move up/down | Scroll the page |
| Pinch thumb to index | Click whatever the cursor is over |
| Fist | Hold still |

- Nothing starts until you click through the explainer, and the camera is only
  requested from that click. Turn it off any time from the corner button.
- **Video never leaves the device** — frames are processed in-browser by Google's
  MediaPipe HandLandmarker. Nothing is recorded or uploaded.
- A small mirrored preview in the bottom-left corner draws the detected hand
  skeleton, so you can see whether the tracker has actually found your hand.
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
`emscripten_webgl_create_context() returned error 0`. The preview shows a `CPU`
badge when it has fallen back. Inference is capped at ~25fps so the CPU path
stays usable on a phone.

## Running it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # regenerates llms.txt, then builds
npm run lint
```

## Editing content

**`src/data/profile.js` is the single source of truth.** The UI sections, the RAG
knowledge base and `llms.txt` are all derived from it — add a job or a project
there and it shows up in all three, including as something the terminal can
answer questions about.

## Layout

```
src/
  data/profile.js              all content, single source of truth
  ui/                          the rebuilt UI components
  Pages/Portfolio.jsx          the page at /
  features/ragTerminal/        knowledge base, BM25 retriever, terminal UI
  features/handControl/        MediaPipe tracking, consent gate, cursor
  styles/portfolio.css         CSS the design needs that Tailwind cannot express
  Components/, Pages/Home.jsx  the previous dark-themed build, served at /legacy
scripts/generate-llms-txt.mjs  profile.js -> public/llms.txt
```

The previous dark portfolio is still live at **`/legacy`** while the new design
is being iterated on.

## Credits

UI design inspired by [Avi Vashishta's Portfolio2021](https://github.com/AVIVASHISHTA29/Portfolio2021).
GT Walsheim in the original is a commercial font, so this build substitutes
Poppins, and keeps Nanum Pen Script for the handwritten notes.
