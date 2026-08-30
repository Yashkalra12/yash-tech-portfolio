/**
 * Clicking a project opens it in mac window chrome with the *live site* in an
 * iframe: the red light closes it, the green light toggles between wide and
 * narrow. A screenshot says a project exists; the running thing says it works.
 */

import { useEffect, useState } from "react";
import { FaCode, FaExternalLinkAlt } from "react-icons/fa";
import MacWindow from "./MacWindow";

export default function ProjectDialog({ project, onClose }) {
  const [wide, setWide] = useState(true);

  // Escape closes, and the page behind should not scroll while this is open.
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  if (!project) return null;

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center bg-black/50 p-3 backdrop-blur-sm md:p-6">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0" />

      <MacWindow
        title={project.src.replace(/^https?:\/\//, "")}
        onClose={onClose}
        onZoom={() => setWide((w) => !w)}
        className={`relative w-full transition-all duration-300 ${wide ? "max-w-6xl" : "max-w-3xl"}`}
      >
        {/* Loaded only while open, so three iframes are never live at once. */}
        <div className="h-[55vh] bg-white md:h-[60vh]">
          <iframe
            src={project.src}
            title={project.title}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            className="h-full w-full border-0"
          />
        </div>

        <div className="max-h-[28vh] overflow-y-auto border-t border-slate-200 p-5">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold">{project.title}</h3>
            <div className="ml-auto flex items-center gap-3 text-slate-500">
              <a
                href={project.src}
                target="_blank"
                rel="noreferrer noopener"
                aria-label="Open live site"
                className="transition hover:text-[#006AFF]"
              >
                <FaExternalLinkAlt />
              </a>
              {project.github ? (
                <a
                  href={project.github}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label="View source"
                  className="transition hover:text-[#006AFF]"
                >
                  <FaCode />
                </a>
              ) : null}
            </div>
          </div>

          <p className="mt-2 text-sm leading-relaxed text-slate-500">{project.description}</p>

          <div className="mt-3 flex flex-wrap gap-2">
            {project.stack.map((tech) => (
              <span
                key={tech}
                className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600"
              >
                {tech}
              </span>
            ))}
          </div>

          <p className="mt-3 text-xs text-slate-400">
            Tip: the green dot resizes this window. Some sites refuse to be framed — use the
            arrow icon to open it in a new tab.
          </p>
        </div>
      </MacWindow>
    </div>
  );
}
