/**
 * The visible half of hand control: a cursor that follows your index finger and
 * a small mirrored camera preview so you can see what the tracker sees.
 *
 * The <video> element lives here permanently (hidden when idle) because
 * useHandTracking needs a mounted node to attach the MediaStream to.
 */

import { useHandControl } from "./context";

export default function HandCursor() {
  const { videoRef, isRunning, pointer, pinching, mode } = useHandControl();

  return (
    <>
      {/* Camera preview. Mirrored so moving right on screen matches moving right. */}
      <div
        className={`fixed bottom-20 left-5 z-[60] overflow-hidden rounded-xl border-2 border-white shadow-xl transition-opacity ${
          isRunning ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        style={{ width: 160, height: 120 }}
      >
        <video
          ref={videoRef}
          muted
          playsInline
          autoPlay
          className="h-full w-full -scale-x-100 object-cover"
        />
        <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
          {mode}
        </span>
      </div>

      {/* Cursor overlay. */}
      <div
        id="hand-cursor-layer"
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[65]"
        style={{ display: isRunning && pointer ? "block" : "none" }}
      >
        {pointer ? (
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${pointer.x * 100}%`, top: `${pointer.y * 100}%` }}
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
        ) : null}
      </div>
    </>
  );
}
