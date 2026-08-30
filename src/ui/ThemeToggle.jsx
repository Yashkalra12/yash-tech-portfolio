/**
 * The light/dark switch. Sits in the top-right cluster next to the camera button.
 */

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { FaMoon, FaSun } from "react-icons/fa";
import useTheme from "./useTheme";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const reduceMotion = useReducedMotion();
  const dark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-base text-slate-600 shadow-lg transition hover:scale-105"
    >
      {/* The icon spins through the swap, so the two states read as one control
          turning over rather than two buttons trading places. */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={theme}
          initial={{ opacity: 0, rotate: reduceMotion ? 0 : -90, scale: 0.6 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: reduceMotion ? 0 : 90, scale: 0.6 }}
          transition={{ duration: reduceMotion ? 0 : 0.18 }}
          className="flex"
        >
          {dark ? <FaSun className="text-[#FEBD2C]" /> : <FaMoon />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
