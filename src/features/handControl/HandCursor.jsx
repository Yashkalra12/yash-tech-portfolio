/**
 * The visible half of hand control: a small mirrored camera preview with the
 * detected hand skeleton drawn over it, plus a cursor that follows your index
 * finger across the page.
 *
 * The <video> element lives here permanently (hidden when idle) because
 * useHandTracking needs a mounted node to attach the MediaStream to.
 *
 * Both the skeleton and the cursor are painted from a single animation frame
 * loop reading refs, rather than from React state. Gesture data arrives at up to
 * 60Hz and re-rendering the page that often is visibly janky.
 */

import { useEffect, useRef } from "react";
import { useHandControl } from "./context";
import { HAND_CONNECTIONS } from "./useHandTracking";

const BLUE = "#006AFF";
const RED = "#FE5E58";

export default function HandCursor() {
  const { videoRef, landmarksRef, pointerRef, isRunning, handPresent, pinching, mode, delegate } =
    useHandControl();

  const canvasRef = useRef(null);
  const cursorRef = useRef(null);
  const pinchingRef = useRef(pinching);
  pinchingRef.current = pinching;

  useEffect(() => {
    if (!isRunning) return undefined;

    let frame = null;

    const draw = () => {
      frame = requestAnimationFrame(draw);

      const canvas = canvasRef.current;
      const video = videoRef.current;
      const landmarks = landmarksRef.current;

      // --- skeleton over the preview ---
      if (canvas && video?.videoWidth) {
        // Match the canvas backing store to the video so landmark coordinates
        // (normalised to the video frame) map straight onto it. CSS object-cover
        // then crops it exactly the way it crops the video underneath.
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }

        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (landmarks) {
          const px = (point) => [point.x * canvas.width, point.y * canvas.height];
          const scale = canvas.width / 640; // keep strokes even on other resolutions

          ctx.lineWidth = 3 * scale;
          ctx.strokeStyle = pinchingRef.current ? RED : "rgba(255,255,255,0.9)";
          ctx.beginPath();
          HAND_CONNECTIONS.forEach(([from, to]) => {
            const [x1, y1] = px(landmarks[from]);
            const [x2, y2] = px(landmarks[to]);
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
          });
          ctx.stroke();

          landmarks.forEach((point, i) => {
            const [x, y] = px(point);
            // Fingertips get a bigger dot; the index tip is the one driving the
            // cursor, so it is coloured to match.
            const isTip = i === 4 || i === 8 || i === 12 || i === 16 || i === 20;
            ctx.beginPath();
            ctx.arc(x, y, (isTip ? 5 : 3) * scale, 0, Math.PI * 2);
            ctx.fillStyle = i === 8 ? BLUE : pinchingRef.current ? RED : "#ffffff";
            ctx.fill();
          });
        }
      }

      // --- page cursor ---
      const cursor = cursorRef.current;
      const pointer = pointerRef.current;
      if (cursor) {
        if (pointer) {
          cursor.style.opacity = "1";
          cursor.style.transform = `translate3d(${pointer.x * window.innerWidth}px, ${
            pointer.y * window.innerHeight
          }px, 0) translate(-50%, -50%)`;
        } else {
          cursor.style.opacity = "0";
        }
      }
    };

    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [isRunning, videoRef, landmarksRef, pointerRef]);

  return (
    <>
      {/* Camera preview. Mirrored, so moving your hand right moves the cursor right. */}
      <div
        className={`fixed bottom-20 left-4 z-[60] w-[136px] overflow-hidden rounded-xl border-2 border-white bg-black shadow-xl transition-opacity sm:left-5 sm:w-[176px] ${
          isRunning ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        <div className="relative aspect-[4/3] w-full">
          <video
            ref={videoRef}
            muted
            playsInline
            autoPlay
            className="absolute inset-0 h-full w-full -scale-x-100 object-cover"
          />
          <canvas
            ref={canvasRef}
            aria-hidden
            className="absolute inset-0 h-full w-full -scale-x-100 object-cover"
          />
          <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold uppercase leading-tight text-white">
            {handPresent ? mode : "show your hand"}
          </span>
          {delegate === "CPU" ? (
            <span
              title="Running on CPU — your browser could not provide a WebGL context, so tracking is slower."
              className="absolute right-1 top-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white"
            >
              CPU
            </span>
          ) : null}
        </div>
      </div>

      {/* Cursor overlay. Positioned imperatively by the loop above. */}
      <div
        id="hand-cursor-layer"
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[65] overflow-hidden"
        style={{ display: isRunning ? "block" : "none" }}
      >
        <div
          ref={cursorRef}
          className="absolute left-0 top-0 opacity-0 transition-opacity duration-150 will-change-transform"
        >
          <div
            className={`rounded-full border-2 transition-all duration-100 ${
              pinching
                ? "h-6 w-6 border-[#FE5E58] bg-[#FE5E58]/40"
                : "h-10 w-10 border-[#006AFF] bg-[#006AFF]/20"
            }`}
          />
          <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#006AFF]" />
        </div>
      </div>
    </>
  );
}
