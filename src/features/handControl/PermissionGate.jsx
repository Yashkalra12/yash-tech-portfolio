/**
 * Explicit, informed opt-in before the camera is ever touched.
 *
 * The browser will show its own permission prompt too, but that prompt cannot
 * explain *why* a portfolio wants a webcam — so we ask first, in plain language,
 * and state clearly that no video leaves the device. The camera is only ever
 * requested from the click handler below, never on mount.
 */

import { useEffect, useState } from "react";
import { FaHandPaper, FaRegHandPointer, FaTimes, FaVideoSlash } from "react-icons/fa";
import MacWindow from "../../ui/MacWindow";
import { useHandControl } from "./context";

const GESTURES = [
  {
    icon: <FaHandPaper />,
    title: "Open palm",
    body: "Move your hand up or down to scroll the page.",
  },
  {
    icon: <FaRegHandPointer />,
    title: "Pinch",
    body: "Touch thumb to index finger to click whatever the cursor is over.",
  },
  {
    icon: <FaVideoSlash />,
    title: "Fist",
    body: "Close your hand to pause and hold position.",
  },
];

export default function PermissionGate() {
  const { enabled, enable, disable, status, error, isRunning, mode } = useHandControl();
  const [open, setOpen] = useState(false);

  // Let Escape close the explainer, as with any modal.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const busy = status === "loading";

  return (
    <>
      {/* Floating toggle — always reachable, states its own status. */}
      <div className="fixed bottom-5 right-5 z-[60] flex flex-col items-end gap-2">
        {isRunning ? (
          <span className="rounded-full bg-[#27C841] px-3 py-1 text-xs font-bold text-white shadow-lg">
            hand control on · {mode}
          </span>
        ) : null}

        <button
          type="button"
          onClick={() => (isRunning ? disable() : setOpen(true))}
          className={`flex items-center gap-2 rounded-full px-4 py-3 text-sm font-bold text-white shadow-lg transition hover:scale-105 ${
            isRunning ? "bg-[#FE5E58]" : "bg-[#006AFF]"
          }`}
        >
          <FaHandPaper />
          {isRunning ? "Stop hand control" : "Control with your hand"}
        </button>
      </div>

      {open && !isRunning ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <MacWindow
            title="camera permission"
            className="w-full max-w-lg"
            onClose={() => setOpen(false)}
          >
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
                This uses your webcam to track one hand and turn gestures into scrolling and
                clicking. Grant access and your browser will ask you to confirm as well.
              </p>

              <ul className="mt-5 space-y-3">
                {GESTURES.map((g) => (
                  <li key={g.title} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#006AFF]/10 text-[#006AFF]">
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
                Frames are processed locally in your browser by Google&apos;s MediaPipe model.
                Nothing is recorded, stored or uploaded. Turn it off any time with the button in
                the corner.
              </p>

              {error ? (
                <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  {error.message}
                </p>
              ) : null}

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={busy}
                  onClick={async () => {
                    await enable();
                    setOpen(false);
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
        </div>
      ) : null}

      {/* Surface a failure that happened outside the modal. */}
      {enabled && status === "error" && !open ? (
        <div className="fixed bottom-24 right-5 z-[60] max-w-xs rounded-lg bg-red-50 p-3 text-xs text-red-700 shadow-lg">
          {error?.message}
        </div>
      ) : null}
    </>
  );
}
