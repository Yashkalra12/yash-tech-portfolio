/**
 * The visible half of hand control: a small camera preview with the detected hand
 * skeleton and face mesh drawn over it, plus a cursor that follows your hand (or
 * your head, when no hand is up) across the page.
 *
 * The preview draws the *video into the canvas* rather than stacking a canvas on
 * top of a <video>. Stacking looks equivalent until the video's aspect ratio does
 * not match the preview's — then CSS `object-fit: cover` crops the video while the
 * canvas keeps its own coordinate space, and the skeleton drifts off the hand by a
 * few pixels that grow the further from centre you go. Doing the cover crop
 * ourselves means the same transform applies to both, so the bones land exactly on
 * the fingers on any camera.
 *
 * The <video> itself stays mounted and offscreen: useVisionTracking needs a real
 * node to attach the MediaStream to, and it must keep playing to be sampled.
 *
 * Everything here paints from one animation frame loop reading refs, not from
 * React state. Landmarks arrive up to 60×/sec and re-rendering the page at that
 * rate is visibly janky.
 */

import { useEffect, useRef, useState } from "react";
import { useHandControl } from "./context";
import {
  FACE_KEY_POINTS,
  FACE_OVAL,
  HAND_CONNECTIONS,
  LEFT_EYE,
  LIPS_OUTER,
  RIGHT_EYE,
} from "./gestures";

/** Landscape on desktop; portrait on phones, matching the front camera. */
const PREVIEW = { width: 200, height: 150 };
const MOBILE_PREVIEW = { width: 90, height: 120 };

/** First hand green, second blue — so you can tell which one is driving. */
const HAND_COLOURS = ["rgba(45, 200, 115, 0.9)", "rgba(45, 115, 240, 0.9)"];
const FACE_COLOUR = "rgba(0, 106, 255, 0.45)";
const FACE_DOT_COLOUR = "rgba(0, 106, 255, 0.7)";

const BLUE = "#006AFF";
const GREEN = "#27C841";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 640px)").matches,
  );
  useEffect(() => {
    const query = window.matchMedia("(max-width: 640px)");
    const onChange = (e) => setIsMobile(e.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);
  return isMobile;
}

/** Trace a closed-ish path through a list of face landmark indices. */
function strokePath(ctx, landmarks, indices, toX, toY) {
  ctx.beginPath();
  indices.forEach((index, i) => {
    const point = landmarks[index];
    if (!point) return;
    const x = toX(point.x);
    const y = toY(point.y);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
}

function drawFaceMesh(ctx, landmarks, toX, toY) {
  ctx.strokeStyle = FACE_COLOUR;
  ctx.lineWidth = 1;
  [FACE_OVAL, LEFT_EYE, RIGHT_EYE, LIPS_OUTER].forEach((path) =>
    strokePath(ctx, landmarks, path, toX, toY),
  );

  ctx.fillStyle = FACE_DOT_COLOUR;
  FACE_KEY_POINTS.forEach((index) => {
    const point = landmarks[index];
    if (!point) return;
    ctx.beginPath();
    ctx.arc(toX(point.x), toY(point.y), 2, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawHands(ctx, hands, toX, toY) {
  hands.forEach((landmarks, handIndex) => {
    const colour = HAND_COLOURS[handIndex % HAND_COLOURS.length];

    ctx.strokeStyle = colour;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    HAND_CONNECTIONS.forEach(([a, b]) => {
      const from = landmarks[a];
      const to = landmarks[b];
      if (!from || !to) return;
      ctx.beginPath();
      ctx.moveTo(toX(from.x), toY(from.y));
      ctx.lineTo(toX(to.x), toY(to.y));
      ctx.stroke();
    });

    ctx.fillStyle = colour;
    landmarks.forEach((point) => {
      ctx.beginPath();
      ctx.arc(toX(point.x), toY(point.y), 3, 0, Math.PI * 2);
      ctx.fill();
    });
  });
}

export default function HandCursor() {
  const {
    videoRef,
    handLandmarksRef,
    faceLandmarksRef,
    pointerRef,
    cursorStateRef,
    statsRef,
    isRunning,
    mode,
    delegate,
  } = useHandControl();

  const isMobile = useIsMobile();
  const { width: previewWidth, height: previewHeight } = isMobile ? MOBILE_PREVIEW : PREVIEW;

  const canvasRef = useRef(null);
  const cursorRef = useRef(null);
  const dotRef = useRef(null);
  const readoutRef = useRef(null);

  useEffect(() => {
    if (!isRunning) return undefined;

    let frame = null;
    // Track what we last wrote to the cursor so we only touch style on change;
    // reassigning identical strings every frame still dirties layout.
    let lastCursorLook = null;

    const draw = () => {
      frame = requestAnimationFrame(draw);

      const canvas = canvasRef.current;
      const video = videoRef.current;
      const hands = handLandmarksRef.current ?? [];
      const face = faceLandmarksRef.current;

      if (canvas && video?.videoWidth) {
        // Back the canvas at device resolution: a 200px preview on a retina screen
        // is 400 real pixels, and drawing at 200 makes the skeleton look furry.
        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        const backingWidth = Math.round(previewWidth * ratio);
        if (canvas.width !== backingWidth) {
          canvas.width = backingWidth;
          canvas.height = Math.round(previewHeight * ratio);
        }

        const ctx = canvas.getContext("2d");
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        ctx.clearRect(0, 0, previewWidth, previewHeight);

        const videoWidth = video.videoWidth;
        const videoHeight = video.videoHeight;
        const videoAspect = videoWidth / videoHeight;
        const previewAspect = previewWidth / previewHeight;

        // Cover-fit: crop the source rectangle to the preview's aspect ratio so the
        // frame fills the box without stretching faces.
        let sx;
        let sy;
        let sw;
        let sh;
        if (videoAspect > previewAspect) {
          sh = videoHeight;
          sw = videoHeight * previewAspect;
          sx = (videoWidth - sw) / 2;
          sy = 0;
        } else {
          sw = videoWidth;
          sh = videoWidth / previewAspect;
          sx = 0;
          sy = (videoHeight - sh) / 2;
        }

        // Mirrored, so the preview behaves like a mirror: move your hand right and
        // the hand in the preview goes right too.
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(video, sx, sy, sw, sh, -previewWidth, 0, previewWidth, previewHeight);
        ctx.restore();

        // The same crop, applied to normalised landmark coordinates, then mirrored.
        const toX = (raw) => previewWidth - ((raw * videoWidth - sx) / sw) * previewWidth;
        const toY = (raw) => ((raw * videoHeight - sy) / sh) * previewHeight;

        if (face) drawFaceMesh(ctx, face, toX, toY);
        if (hands.length) drawHands(ctx, hands, toX, toY);
      }

      // Live readout. Without it, "camera on but nothing detected" looks identical
      // to "camera on and working" — which is exactly the failure that is hardest
      // to diagnose from a bug report.
      const readout = readoutRef.current;
      const stats = statsRef?.current;
      if (readout && stats) {
        const text =
          stats.inferences === 0
            ? "starting…"
            : `${stats.delegate ?? ""} ${stats.fps}fps · ${
                hands.length ? `${hands.length} hand${hands.length > 1 ? "s" : ""}` : face ? "face" : "nothing"
              }`;
        if (readout.textContent !== text) readout.textContent = text;
      }

      const cursor = cursorRef.current;
      const dot = dotRef.current;
      const pointer = pointerRef.current;
      const state = cursorStateRef.current;

      if (cursor && dot) {
        if (pointer) {
          cursor.style.opacity = "1";
          cursor.style.transform = `translate3d(${pointer.x * window.innerWidth}px, ${
            pointer.y * window.innerHeight
          }px, 0) translate(-50%, -50%)`;

          // Shape encodes what the gesture will do: a squared-off grab handle while
          // scrolling, a filled dot while pinching, a hollow ring while idle.
          const look = state.scrolling ? "scroll" : state.pinching ? "pinch" : "idle";
          if (look !== lastCursorLook) {
            lastCursorLook = look;
            if (look === "scroll") {
              dot.style.cssText =
                `width:34px;height:44px;border-radius:10px;` +
                `background:${BLUE}44;border:2px solid ${BLUE};`;
            } else if (look === "pinch") {
              dot.style.cssText =
                `width:20px;height:20px;border-radius:9999px;` +
                `background:${GREEN};border:2px solid #ffffff;`;
            } else {
              dot.style.cssText =
                `width:38px;height:38px;border-radius:9999px;` +
                `background:${BLUE}26;border:2px solid ${BLUE};`;
            }
          }
        } else {
          cursor.style.opacity = "0";
        }
      }
    };

    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [
    isRunning,
    videoRef,
    handLandmarksRef,
    faceLandmarksRef,
    pointerRef,
    cursorStateRef,
    statsRef,
    previewWidth,
    previewHeight,
  ]);

  return (
    <>
      {/* Kept mounted and offscreen: the stream needs a node, and it must keep
          playing to be sampled. Everything visible is drawn from the canvas. */}
      <video
        ref={videoRef}
        muted
        playsInline
        autoPlay
        aria-hidden
        className="pointer-events-none fixed h-px w-px opacity-0"
        style={{ top: -9999, left: -9999 }}
      />

      <div
        className={`fixed bottom-4 left-4 z-[9997] overflow-hidden rounded-xl bg-black shadow-[0_4px_16px_rgba(0,0,0,0.3)] transition-opacity ${
          isRunning ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        style={{
          width: previewWidth,
          height: previewHeight,
          border: `2px solid ${BLUE}99`,
        }}
      >
        <canvas ref={canvasRef} aria-hidden className="block h-full w-full" />
        <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold uppercase leading-tight text-white">
          {mode === "idle" ? "show your hand" : mode}
        </span>
        <span
          ref={readoutRef}
          title={
            delegate === "CPU"
              ? "Running on the CPU delegate — your browser could not provide a working WebGL context."
              : undefined
          }
          className="absolute right-1 top-1 rounded bg-black/70 px-1.5 py-0.5 font-mono text-[9px] leading-tight text-white/90"
        />
      </div>

      {/* Cursor overlay. Positioned imperatively by the loop above. The id is how
          the click dispatcher finds it to hide it during its hit test. */}
      <div
        id="hand-cursor-layer"
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden"
        style={{ display: isRunning ? "block" : "none" }}
      >
        <div
          ref={cursorRef}
          className="absolute left-0 top-0 opacity-0 transition-opacity duration-150 will-change-transform"
        >
          <div ref={dotRef} className="transition-all duration-100" />
          <div
            className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ background: BLUE }}
          />
        </div>
      </div>
    </>
  );
}
