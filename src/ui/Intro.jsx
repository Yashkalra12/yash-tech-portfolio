/**
 * Hero section, following the reference's IntroComponent: a heading whose role
 * cycles via CSS, a speech bubble that hands over to the real copy after a
 * beat, a dismissible "ID card", and a laptop mockup with a handwritten note
 * pointing at it.
 */

import { useState } from "react";
import { FaLocationArrow } from "react-icons/fa";
import { FiDownloadCloud } from "react-icons/fi";
import MacWindow from "./MacWindow";
import { identity } from "../data/profile";

const scrollToId = (id) =>
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

export default function Intro() {
  const [showCard, setShowCard] = useState(true);

  return (
    <section className="flex flex-col items-center gap-10 pt-10 lg:flex-row lg:items-start lg:gap-6">
      <div className="w-full lg:w-1/2">
        <h1 className="font-display text-4xl font-normal leading-tight tracking-tight md:text-6xl">
          <span className="rotating-role" />
          <span className="text-[#006AFF]">.</span>
        </h1>

        {/* Greeting first, real copy second — both on timers, no state. */}
        <p className="bubble-in mt-4 inline-block rounded-2xl rounded-bl-sm bg-[#006AFF] px-4 py-2 text-lg text-white shadow-lg">
          Hey there! 👋
        </p>

        <div className="reveal-late">
          {/* Two lines, deliberately: the second one is the detail, and putting it
              on its own line keeps the first one a statement. */}
          <div className="max-w-xl text-lg leading-relaxed text-slate-500">
            {identity.blurb.map((sentence) => (
              <p key={sentence}>{sentence}</p>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-4">
            <button type="button" className="btn-primary" onClick={() => scrollToId("socials")}>
              Connect Now <FaLocationArrow size={14} />
            </button>
            <button type="button" className="btn-ghost" onClick={() => scrollToId("projects")}>
              My Projects
            </button>
            <a href={identity.resume} target="_blank" rel="noreferrer noopener" className="btn-ghost">
              Resume <FiDownloadCloud size={16} />
            </a>
          </div>
        </div>

        {showCard ? (
          <MacWindow className="tilt-hover mt-8 max-w-sm" onClose={() => setShowCard(false)}>
            <div className="flex items-center gap-5 p-5">
              <img
                src={identity.avatar}
                alt={identity.name}
                className="h-24 w-24 shrink-0 rounded-full object-cover"
              />
              {/* Four lines, in the order you would read them off a badge: who,
                  what, where it came from, where he is. */}
              <div className="min-w-0">
                <p className="font-display text-2xl leading-none">{identity.name}</p>
                <p className="mt-1.5 text-sm font-semibold text-[#006AFF]">{identity.tagline}</p>
                <p className="mt-1 text-xs text-slate-400">{identity.headline}</p>
                <p className="text-xs text-slate-400">{identity.location}</p>
              </div>
            </div>
          </MacWindow>
        ) : (
          <button
            type="button"
            onClick={() => setShowCard(true)}
            className="mt-8 text-sm text-slate-400 underline decoration-dotted"
          >
            bring my card back
          </button>
        )}
      </div>

      {/* Laptop mockup, with the handwritten aside from the original. */}
      <div className="relative w-full lg:w-1/2">
        <p className="font-cartoon text-2xl text-[#ff9f1c] lg:text-right">
          ~ ask my terminal anything about me, it actually answers
        </p>
        <MacWindow
          title="yash.dev"
          className="tilt-hover-right mt-2"
          bodyClassName="bg-slate-50"
          onZoom={() => scrollToId("terminal")}
        >
          <div className="aspect-[16/10] w-full p-4">
            <div className="flex h-full flex-col justify-center gap-3 rounded-lg bg-[#0f1115] p-5 font-mono text-[11px] text-slate-300 md:text-xs">
              <p className="text-[#27C841]">❯ whoami</p>
              <p className="text-slate-400">{identity.name} — {identity.tagline}</p>
              <p className="text-[#27C841]">❯ skills --top</p>
              <p className="text-slate-400">React · TypeScript · FastAPI · LangGraph · Pinecone</p>
              <p className="text-[#27C841]">❯ open --to hire</p>
              <p className="text-slate-400">{identity.relocation}</p>
              <p className="text-[#27C841]">
                ❯ <span className="animate-pulse">▊</span>
              </p>
            </div>
          </div>
        </MacWindow>
        <p className="mt-3 text-center font-cartoon text-xl text-[#f5576c]">
          click the green dot ↑ to jump to the real one
        </p>
      </div>
    </section>
  );
}
