/**
 * Education as a simple vertical timeline. The old build pulled in
 * react-vertical-timeline-component for this; a border and some dots do the
 * same job without the dependency or its dark-theme-only styling.
 */

import SectionHeading from "./SectionHeading";
import { education } from "../data/profile";

export default function Education() {
  return (
    <section id="education" className="scroll-mt-24 py-16">
      <SectionHeading dotColor="#7e38e0">Education</SectionHeading>

      <ol className="mt-8 space-y-6 border-l-2 border-slate-200 pl-6 md:pl-10">
        {education.map((edu) => (
          <li key={edu.id} className="relative">
            <span
              aria-hidden
              // The ring is the page colour, so the dot reads as sitting on top of
              // the timeline rule in either theme.
              className="absolute -left-[1.95rem] top-5 h-3 w-3 rounded-full border-2 border-[color:var(--page)] bg-[#7e38e0] md:-left-[3.2rem]"
            />
            <div className="tilt-hover rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <img
                  src={edu.logo}
                  alt=""
                  className="h-14 w-14 shrink-0 rounded-full object-contain"
                />
                <div className="min-w-0">
                  <h3 className="font-bold">{edu.school}</h3>
                  <p className="text-sm text-slate-500">{edu.degree}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {edu.date} · {edu.place}
                  </p>
                  <p className="mt-2 inline-block rounded-full bg-[#7e38e0]/10 px-2.5 py-0.5 text-xs font-bold text-[#7e38e0]">
                    {edu.grade}
                  </p>
                  {edu.desc ? (
                    <p className="mt-3 text-sm leading-relaxed text-slate-500">{edu.desc}</p>
                  ) : null}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
