/**
 * A "dynamic island" nav: a black pill floating at the top of the page that shows
 * a hamburger and the name, and morphs — the hamburger becoming a cross — into the
 * links when you point at it.
 *
 * Three things it has to get right to not be annoying:
 *
 *   1. Hover is not the only way in. Touch devices have no hover at all, and a
 *      keyboard user tabbing to a link inside a collapsed island would be focusing
 *      something invisible. So it opens on hover, on focus, and on tap, and the
 *      hamburger is a real button that toggles.
 *   2. It closes on outside tap and on Escape, since on touch there is no
 *      "pointer leaves" event to close it for you.
 *   3. The width morph is a framer-motion layout animation, which is what makes it
 *      read as one object changing shape rather than two states swapping. That is
 *      also motion a visitor may have asked the OS to stop, so it is skipped under
 *      prefers-reduced-motion.
 */

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { FaBars, FaTimes } from "react-icons/fa";
import { identity, socials } from "../data/profile";

const linkFor = (id) => socials.find((social) => social.id === id)?.href;

/** Section links scroll; the last two leave the site. */
const NAV = [
  { label: "Skill", target: "skills" },
  { label: "Work", target: "experience" },
  { label: "Projects", target: "projects" },
  { label: "Linkedin", href: linkFor("linkedin") },
  { label: "Github", href: linkFor("github") },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const islandRef = useRef(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return undefined;

    const onKey = (e) => e.key === "Escape" && setOpen(false);
    // Tap-outside to close: on touch there is no pointer-leave to rely on.
    const onPointerDown = (e) => {
      if (!islandRef.current?.contains(e.target)) setOpen(false);
    };

    window.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  const go = (id) => {
    setOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const transition = reduceMotion
    ? { duration: 0 }
    : { type: "spring", stiffness: 420, damping: 34, mass: 0.7 };

  return (
    <header className="pointer-events-none fixed inset-x-0 top-3 z-50 flex justify-center px-3">
      <motion.div
        ref={islandRef}
        layout
        transition={transition}
        // Hover opens it; focus-within is what makes it reachable by keyboard,
        // since tabbing into a collapsed island would otherwise focus hidden links.
        onHoverStart={() => setOpen(true)}
        onHoverEnd={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
        }}
        className="pointer-events-auto flex items-center gap-1 rounded-full bg-[#0d0d0f] py-2 pl-2 pr-3 text-white shadow-[0_8px_30px_rgba(0,0,0,0.28)] ring-1 ring-white/10"
      >
        <motion.button
          layout="position"
          type="button"
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((value) => !value)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm text-white/80 transition hover:bg-white/10 hover:text-white"
        >
          {/* Crossfade + quarter turn, so the hamburger visibly *becomes* the cross. */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={open ? "close" : "open"}
              initial={{ opacity: 0, rotate: reduceMotion ? 0 : -90 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: reduceMotion ? 0 : 90 }}
              transition={{ duration: reduceMotion ? 0 : 0.15 }}
              className="flex"
            >
              {open ? <FaTimes /> : <FaBars />}
            </motion.span>
          </AnimatePresence>
        </motion.button>

        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.nav
              key="links"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.18 }}
              className="flex shrink-0 items-center gap-0.5 whitespace-nowrap"
            >
              {NAV.map((item) =>
                item.href ? (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    onClick={() => setOpen(false)}
                    className="island-link"
                  >
                    {item.label}
                    <span className="text-[#4d9bff]">.</span>
                  </a>
                ) : (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => go(item.target)}
                    className="island-link"
                  >
                    {item.label}
                    <span className="text-[#4d9bff]">.</span>
                  </button>
                ),
              )}
            </motion.nav>
          ) : (
            <motion.button
              key="name"
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.18 }}
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="shrink-0 whitespace-nowrap px-2 text-sm font-bold tracking-tight sm:text-base"
            >
              {identity.name} <span className="text-[#FE5E58]">.</span>
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>
    </header>
  );
}
