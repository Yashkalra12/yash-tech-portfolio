/**
 * Fixed top bar with smooth-scroll navigation, collapsing to a slide-in drawer
 * on narrow screens — the Header + DrawerComponent pair from the reference,
 * rebuilt without Material-UI.
 */

import { useEffect, useState } from "react";
import { FaBars, FaTimes } from "react-icons/fa";
import { identity } from "../data/profile";

const NAV = [
  { id: "about", label: "About" },
  { id: "experience", label: "Experience" },
  { id: "skills", label: "Skills" },
  { id: "projects", label: "Projects" },
  { id: "education", label: "Education" },
  { id: "terminal", label: "Terminal" },
  { id: "socials", label: "Socials" },
];

function scrollToId(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function Header() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Lock background scrolling while the drawer covers the page.
  useEffect(() => {
    if (!drawerOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && setDrawerOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [drawerOpen]);

  const go = (id) => {
    setDrawerOpen(false);
    scrollToId(id);
  };

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 flex items-center border-b border-[#ededed] bg-white/95 px-5 py-3 backdrop-blur">
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="text-xl font-bold md:text-2xl"
        >
          {identity.firstName} <span className="text-[#FE5E58]">.</span>
        </button>

        <nav className="ml-auto hidden items-center md:flex">
          {NAV.map((item) => (
            <button key={item.id} type="button" onClick={() => go(item.id)} className="nav-link">
              {item.label}
            </button>
          ))}
          <a
            href={identity.resume}
            target="_blank"
            rel="noreferrer noopener"
            className="ml-2 rounded-full bg-[#006AFF] px-4 py-2 text-sm font-bold text-white transition hover:scale-105"
          >
            Resume
          </a>
        </nav>

        <button
          type="button"
          aria-label="Open menu"
          onClick={() => setDrawerOpen(true)}
          className="ml-auto text-2xl text-slate-700 md:hidden"
        >
          <FaBars />
        </button>
      </header>

      {drawerOpen ? (
        <div className="fixed inset-0 z-[80] md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          <aside className="absolute inset-y-0 right-0 flex w-[280px] flex-col bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <img
                src={identity.avatar}
                alt=""
                className="h-16 w-16 rounded-full object-cover"
              />
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setDrawerOpen(false)}
                className="text-xl text-slate-500"
              >
                <FaTimes />
              </button>
            </div>
            <p className="mt-3 font-bold">{identity.name}</p>
            <p className="text-sm text-slate-400">{identity.headline}</p>

            <nav className="mt-6 flex flex-col items-start gap-1">
              {NAV.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => go(item.id)}
                  className="nav-link w-full text-left"
                >
                  {item.label}
                </button>
              ))}
            </nav>

            <a
              href={identity.resume}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-auto rounded-full bg-[#006AFF] py-3 text-center text-sm font-bold text-white"
            >
              Resume
            </a>
          </aside>
        </div>
      ) : null}
    </>
  );
}
