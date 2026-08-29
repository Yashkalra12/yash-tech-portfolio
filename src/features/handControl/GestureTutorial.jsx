/**
 * The cheat sheet shown once hand control is actually running.
 *
 * Deliberately separate from the permission modal: that one is about consent and
 * has to be read before deciding, while this one is about *how to use it* and is
 * only useful with the camera already live. Cramming both into one dialogue means
 * the gestures are read at the moment they cannot be tried.
 */

import { motion } from "framer-motion";
import { useEffect } from "react";
import MacWindow from "../../ui/MacWindow";

const GESTURES = [
  {
    icon: "👤",
    title: "Head Tracking",
    desc: "Move your head to control the cursor",
  },
  {
    icon: "👌",
    title: "Pinch to Click",
    desc: "Quick pinch and release to click on elements",
  },
  {
    icon: "👌",
    title: "Pinch & Drag Scroll",
    desc: "Pinch and drag up/down to scroll — with momentum!",
  },
  {
    icon: "🖐",
    title: "Open Hand",
    desc: "Show your palm to move the cursor around the page",
  },
];

export default function GestureTutorial({ onDismiss }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onDismiss();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onDismiss]);

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 26 }}
        className="w-full max-w-[540px]"
      >
        <MacWindow title="Hand Gestures" onClose={onDismiss}>
          <div className="p-6 sm:p-8">
            <h2 className="text-2xl font-bold sm:text-3xl">
              Hand Gestures <span className="text-[#006AFF]">.</span>
            </h2>
            <p className="mt-1 text-sm text-slate-500">Here&apos;s how to navigate hands-free</p>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {GESTURES.map((gesture, i) => (
                <motion.div
                  key={gesture.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.1 }}
                  className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4"
                >
                  {/* Emoji rather than icons: these are hand shapes, and a glyph of
                      the actual pose reads faster than any abstract icon. */}
                  <span aria-hidden className="text-2xl leading-none">
                    {gesture.icon}
                  </span>
                  <span className="flex flex-col">
                    <span className="text-sm font-bold">{gesture.title}</span>
                    <span className="mt-0.5 text-xs leading-relaxed text-slate-500">
                      {gesture.desc}
                    </span>
                  </span>
                </motion.div>
              ))}
            </div>

            <p className="mt-5 text-xs leading-relaxed text-slate-400">
              A fist pauses everything and holds still. The preview in the corner shows what the
              camera can see — if there is no skeleton on your hand, move it fully into frame.
            </p>

            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onDismiss}
              className="mt-6 w-full rounded-full bg-[#006AFF] px-6 py-3 text-sm font-bold text-white shadow-[0_3px_5px_#006AFF] sm:w-auto"
            >
              Got it!
            </motion.button>
          </div>
        </MacWindow>
      </motion.div>
    </div>
  );
}
