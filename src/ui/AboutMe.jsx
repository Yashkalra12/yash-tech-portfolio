/**
 * About section: centred prose flanked by a dismissible social card, plus the
 * handwritten "that's me" aside — the reference's AboutMe, with Yash's copy.
 */

import { useState } from "react";
import MacWindow from "./MacWindow";
import SectionHeading from "./SectionHeading";
import { identity, socials } from "../data/profile";

export default function AboutMe() {
  const [showCard, setShowCard] = useState(true);
  const github = socials.find((s) => s.id === "github");

  return (
    <section id="about" className="scroll-mt-24 py-16">
      <SectionHeading dotColor="#f5576c">About Me</SectionHeading>

      <div className="mt-8 flex flex-col items-center gap-10 lg:flex-row">
        <div className="w-full lg:w-1/3">
          <img
            src="/assets/Front.png"
            alt=""
            className="tilt-hover mx-auto w-full max-w-xs rounded-2xl object-cover shadow-lg"
          />
          <p className="mt-3 text-center font-cartoon text-2xl text-[#f5576c]">
            ~ Hey, that&apos;s me!
          </p>
        </div>

        <div className="w-full lg:w-2/3">
          <div className="mx-auto max-w-2xl space-y-4 text-center text-slate-500">
            {identity.about.map((paragraph) => (
              <p key={paragraph} className="leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {identity.learning.map((item) => (
              <span
                key={item}
                className="rounded-full border border-[#006AFF]/30 bg-[#006AFF]/10 px-3 py-1 text-xs font-semibold text-[#006AFF]"
              >
                learning · {item}
              </span>
            ))}
            {identity.offers.map((item) => (
              <span
                key={item}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500"
              >
                {item}
              </span>
            ))}
          </div>

          {showCard ? (
            <MacWindow
              className="tilt-hover mx-auto mt-8 max-w-md"
              onClose={() => setShowCard(false)}
            >
              <a
                href={github.href}
                target="_blank"
                rel="noreferrer noopener"
                className="flex items-center gap-5 p-5"
              >
                <img src="/socials/github.png" alt="" className="h-20 w-20 rounded-xl object-contain" />
                <span>
                  <span className="block text-xl font-bold">{github.handle}</span>
                  <span className="block text-sm text-slate-400">
                    Most of what I build ends up here — have a dig around.
                  </span>
                </span>
              </a>
            </MacWindow>
          ) : null}
        </div>
      </div>
    </section>
  );
}
