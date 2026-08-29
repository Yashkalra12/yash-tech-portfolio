/**
 * Explicit, informed opt-in before the camera is ever touched, and the toggle that
 * turns it back off.
 *
 * The browser shows its own permission prompt, but that prompt cannot explain *why*
 * a portfolio wants a webcam — so we ask first, in plain language, and say outright
 * that no video leaves the device. The camera is only ever requested from the click
 * handler below, never on mount.
 *
 * Flow: round camera button → consent modal → model download progress → gesture
 * cheat sheet, shown once tracking is actually live.
 */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FaTimes, FaVideo, FaVideoSlash } from "react-icons/fa";
import MacWindow from "../../ui/MacWindow";
import GestureTutorial from "./GestureTutorial";
import { useHandControl } from "./context";

const GESTURES = [
  { icon: "👤", title: "Head tracking", body: "Move your head to steer the cursor." },
  { icon: "🖐", title: "Open palm", body: "Show your hand to take over the cursor." },
  { icon: "👌", title: "Pinch", body: "Pinch and release to click; pinch and drag to scroll." },
];

export default function PermissionGate() {
  const { enabled, enable, disable, status, error, isRunning, progress, mode } = useHandControl();
  const [open, setOpen] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const busy = status === "loading";
  // getUserMedia does not exist outside a secure context. Say so before the visitor
  // clicks — this is what bites when testing from a phone on a LAN IP.
  const insecure = typeof window !== "undefined" && !window.isSecureContext;

  const stop = () => {
    disable();
    setShowTutorial(false);
  };

  return (
    <>
      <div className="fixed bottom-5 right-5 z-[9996] flex flex-col items-end gap-2">
        {isRunning ? (
          <span className="rounded-full bg-[#27C841] px-3 py-1 text-xs font-bold text-white shadow-lg">
            hand control on · {mode}
          </span>
        ) : null}

        <button
          type="button"
          onClick={() => (isRunning ? stop() : setOpen(true))}
          aria-label={isRunning ? "Turn off hand control" : "Control this site with your hand"}
          title={isRunning ? "Turn off hand control" : "Control this site with your hand"}
          className={`flex h-14 w-14 items-center justify-center rounded-full text-xl text-white shadow-lg transition hover:scale-105 ${
            isRunning ? "bg-[#FE5E58]" : "bg-[#006AFF]"
          }`}
        >
          {isRunning ? <FaVideoSlash /> : <FaVideo />}
        </button>
      </div>

      {open && !isRunning ? (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className="w-full max-w-lg"
          >
            <MacWindow title="camera permission" onClose={() => setOpen(false)}>
              <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-2xl font-bold">
                    Steer this site with your hand <span className="text-[#006AFF]">.</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="Close"
                    className="text-slate-400 hover:text-slate-700"
                  >
                    <FaTimes />
                  </button>
                </div>

                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  This uses your webcam to track your face and hands, and turns that into a cursor
                  you can point, click and scroll with. Your browser will ask you to confirm too.
                </p>

                <ul className="mt-5 space-y-3">
                  {GESTURES.map((g) => (
                    <li key={g.title} className="flex items-start gap-3">
                      <span aria-hidden className="text-xl leading-none">
                        {g.icon}
                      </span>
                      <span className="text-sm">
                        <strong>{g.title}</strong>
                        <span className="text-slate-500"> — {g.body}</span>
                      </span>
                    </li>
                  ))}
                </ul>

                <p className="mt-5 rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-slate-500">
                  <strong className="text-slate-700">Your video never leaves this device.</strong>{" "}
                  Frames are processed locally in your browser by Google&apos;s MediaPipe models.
                  Nothing is recorded, stored or uploaded. Turn it off any time with the button in
                  the corner.
                </p>

                {insecure ? (
                  <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                    This page is not on a secure origin, so the browser will not hand over the
                    camera. Open it over <strong>https://</strong> or on <strong>localhost</strong>.
                  </p>
                ) : null}

                {error ? (
                  <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    {error.message}
                  </p>
                ) : null}

                {/* The models are a few MB; without a bar this looks hung. */}
                {busy ? (
                  <div className="mt-4">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-[#006AFF] transition-[width] duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="mt-1.5 text-xs text-slate-400">
                      Loading the tracking models — {progress}%
                    </p>
                  </div>
                ) : null}

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={async () => {
                      // Keep the explainer open on failure so the error is readable.
                      if (await enable()) {
                        setOpen(false);
                        setShowTutorial(true);
                      }
                    }}
                    className="rounded-full bg-[#006AFF] px-5 py-2.5 text-sm font-bold text-white shadow-[0_3px_5px_#006AFF] transition hover:scale-105 disabled:opacity-60"
                  >
                    {busy ? "Starting camera…" : "Allow camera access"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                  >
                    No thanks
                  </button>
                </div>
              </div>
            </MacWindow>
          </motion.div>
        </div>
      ) : null}

      {showTutorial && isRunning ? (
        <GestureTutorial onDismiss={() => setShowTutorial(false)} />
      ) : null}

      {/* Surface a failure that happened outside the modal. */}
      {enabled && status === "error" && !open ? (
        <div className="fixed bottom-24 right-5 z-[9996] max-w-xs rounded-lg bg-red-50 p-3 text-xs text-red-700 shadow-lg">
          {error?.message}
        </div>
      ) : null}
    </>
  );
}
