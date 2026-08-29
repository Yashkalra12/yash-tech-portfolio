# Portfolio rebuild — branch `yash_2026Sep`

Rebuilding the portfolio from scratch, taking UI inspiration from
[AVIVASHISHTA29/Portfolio2021](https://github.com/AVIVASHISHTA29/Portfolio2021),
with Yash's own data, plus three original features.

## Decisions made

- **Tooling stays Vite + React 18 + Tailwind.** The reference repo is CRA +
  Material-UI + react-spring; we keep the modern toolchain and reimplement his
  UI patterns in Tailwind + framer-motion (already a dependency).
- **Aesthetic follows the reference**: light/white background, blue `#006AFF`
  accent, "mac window" chrome with red/amber/green traffic lights, ID-card
  style hero, handwritten cartoon annotations, iframe project previews.
- **Fonts**: GT Walsheim in the reference is a paid font → use a Google Fonts
  geometric sans instead, plus `Nanum Pen Script` for the cartoon annotations
  (that one is the same font the reference uses).
- **Old UI is preserved** at route `/legacy` so nothing is thrown away while
  iterating on the new design.
- **RAG terminal runs fully client-side** (BM25 over a local corpus, no API key
  required) with optional LLM synthesis if an endpoint is configured.

## Reference UI patterns being reimplemented

| Reference file | Pattern | Our component |
| --- | --- | --- |
| `Header.js` / `DrawerComponent.js` / `MyList.js` | fixed top bar, smooth-scroll nav, mobile drawer | `Header.jsx` |
| `IntroComponent.js` | rotating job-title via CSS `content` animation, text bubble that self-hides, mac/iphone mockups, ID card | `Intro.jsx`, `MacWindow.jsx` |
| `AboutMe.js` | centred prose + QR/social ID card, cartoon annotation | `AboutMe.jsx` |
| `SkillSet.js` + `Viewpager.js` | **draggable, reorderable** skill list ("my skill set is literally variable") | `SkillSet.jsx` + `DraggableList.jsx` (framer-motion `Reorder`) |
| `Projects.js` + `DialogProjects.js` | grid of screenshot cards → modal with a live `<iframe>` of the site in mac chrome, resizable via the green light | `Projects.jsx`, `ProjectDialog.jsx` |
| `Footer.js` | name + cartoon sign-off + social icon row | `Footer.jsx` |

Sections the reference lacks but Yash needs: `Experience.jsx`, `Education.jsx`.

## File layout

```
src/
  data/profile.js                      # SINGLE SOURCE OF TRUTH for all content
  features/ragTerminal/
    knowledge.js                       # builds RAG chunks from profile.js
    retriever.js                       # BM25 + synonyms, client-side
    synthesize.js                      # optional LLM grounding layer
    commands.js                        # terminal slash/word commands
    RagTerminal.jsx                    # terminal UI (mac window chrome)
  features/handControl/
    useHandTracking.js                 # MediaPipe HandLandmarker loop
    HandControlProvider.jsx            # context + scroll/click driving
    PermissionGate.jsx                 # explicit opt-in modal before camera
    HandCursor.jsx                     # on-screen cursor + camera preview
  components/                          # new Avi-inspired UI
  styles/portfolio.css
scripts/generate-llms-txt.mjs          # profile.js -> public/llms.txt
public/llms.txt                        # generated, committed
```

## Status

- [x] Branch `yash_2026Sep` created
- [x] Reference repo studied (cloned to /tmp/Portfolio2021)
- [x] `@mediapipe/tasks-vision` installed
- [x] `src/data/profile.js` — all of Yash's data extracted from the old components
- [x] `src/features/ragTerminal/knowledge.js` — chunk builder
- [x] `src/features/ragTerminal/retriever.js` — BM25 retriever + local answer
- [x] `synthesize.js`, `commands.js`, `RagTerminal.jsx`
- [x] `scripts/generate-llms-txt.mjs` + `public/llms.txt` (wired into `npm run build`)
- [x] hand-control feature (`useHandTracking`, provider, `context.js`,
      `PermissionGate`, `HandCursor`)
- [x] UI components (MacWindow, SectionHeading, Header, Intro, AboutMe,
      Experience, SkillSet, DraggableList, Projects, ProjectDialog, Education,
      LlmsSection, Footer)
- [x] `styles/portfolio.css`, tailwind config, `index.html` fonts
- [x] wire `App.jsx` (`/` = new page, `/legacy` = old page)
- [x] verified: `npm run build` passes; MediaPipe lazily code-splits into its
      own 126 kB chunk; lint clean in all new files (total problems 60 → 30,
      remainder all pre-existing in `src/Components/`)
- [x] retriever tested — 15/15 representative questions retrieve the right
      passage, unknown questions correctly return nothing
- [x] server-render smoke test — 16/16 content assertions pass

### Prototype is complete and verified. Open for iteration.

Next things worth doing when picking this up again:

- Replace the hero laptop mock-up's fake terminal with a real screenshot, or
  drop in the `iphoneAnonimo`/`macLw`-style device frames the reference uses.
- `public/assets/Front.png` is currently reused as the About photo — swap in a
  proper portrait.
- Consider a real embedding model for the RAG terminal if the corpus grows past
  a few hundred passages; BM25 is the right call at this size.
- Hand control is tuned by four constants at the top of
  `HandControlProvider.jsx` (`SCROLL_GAIN`, `SCROLL_DEADZONE`, `SMOOTHING`,
  `CLICK_COOLDOWN_MS`) — worth adjusting on real hardware.

## Bugs found and fixed during the build

1. `Reorder.Values` does not exist in framer-motion; the API is `Reorder.Group`.
2. The retriever returned nothing for "who is yash": every word in that question
   is a stopword, so the query was empty after filtering. Synonym lookup now runs
   against the *unfiltered* tokens, since question words like "who" and "where"
   carry intent.
3. Synonym-expanded terms scored the same as typed ones, so "what did he do at
   Lumio AI?" ranked the AI/LLM skills passage above the Lumio job. Synonyms are
   now weighted at 0.4.
4. The absolute `minScore` floor of 0.6 discarded valid matches whose only shared
   term was common; lowered to 0.12, leaning on the relative band instead.
5. `src/components` would have collided with the existing `src/Components` on
   case-insensitive macOS filesystems — new UI went to `src/ui/` instead.
6. Hand control never started for real users: the delegate was hardcoded to
   `"GPU"`, and without a WebGL context the wasm graph fails with
   `emscripten_webgl_create_context() returned error 0` / `kGpuService ... was
   not provided`. Now WebGL2 is probed up front, GPU creation is wrapped in a
   try/catch, and a delegate that builds but then fails every frame is rebuilt on
   CPU after 12 consecutive bad frames.
7. Camera start was fragile on phones: fixed `640x480` constraints could throw
   `OverconstrainedError`, and iOS Safari can reject `play()` before
   `loadedmetadata`. Constraints are now `ideal`, and metadata is awaited.
8. Nothing told the visitor that `getUserMedia` needs a secure context — the
   single biggest reason it "doesn't work on my phone". Both the hook and the
   consent modal now say so explicitly.
9. The cursor position was React state written on every gesture frame, so the
   whole page subtree re-rendered up to 60×/sec. It is a ref now; `HandCursor`
   paints the cursor and the skeleton from one animation frame loop.

## Data captured in profile.js

- **Experience**: Munshot PTE Ltd (Full Stack Dev, Feb 2025 – Jan 2026);
  Lumio AI (SWE, Sep 2024 – Feb 2025)
- **Projects**: GigNest, eVoting Platform, HealthSync
- **Education**: Chitkara University B.E. CSE 9.26 CGPA (2021–2025);
  City International School 91.6%; La Martiniere College 94.6%
- **Socials**: LinkedIn, GitHub, LeetCode, Gmail, WhatsApp
