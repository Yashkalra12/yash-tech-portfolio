/**
 * Work history. The reference has no equivalent section, so this borrows its
 * vocabulary instead: mac windows, one accent colour, a handwritten aside.
 */

import { FaExternalLinkAlt } from "react-icons/fa";
import MacWindow from "./MacWindow";
import SectionHeading from "./SectionHeading";
import { experience } from "../data/profile";

export default function Experience() {
  return (
    <section id="experience" className="scroll-mt-24 py-16">
      <SectionHeading accent="Destructuring" dotColor="#27C841">
        My Work Experience
      </SectionHeading>

      <div className="mt-8 space-y-8">
        {experience.map((job) => (
          <MacWindow key={job.id} className="tilt-hover" title={job.duration}>
            <div className="flex flex-col gap-6 p-6 md:flex-row">
              <div className="flex shrink-0 items-start justify-center md:w-48">
                <img
                  src={job.logo}
                  alt={job.company}
                  className="max-h-24 w-auto object-contain"
                />
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="font-display text-2xl md:text-3xl">{job.company}</h3>
                <p className="font-semibold text-[#006AFF]">{job.role}</p>
                {/* Employment type, dates and place on one line — the details are
                    worth stating, but not worth three lines of their own. Joined
                    from whichever fields the job actually has. */}
                <p className="mt-0.5 text-sm text-slate-400">
                  {[job.type, job.duration, job.place].filter(Boolean).join(" · ")}
                </p>

                <ul className="mt-4 space-y-2">
                  {job.highlights.map((item) => (
                    <li key={item} className="flex gap-2 text-sm leading-relaxed text-slate-600">
                      <span aria-hidden className="mt-1 text-[#006AFF]">
                        ▹
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href={job.link}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#006AFF] hover:underline"
                >
                  Visit {job.shortName} <FaExternalLinkAlt size={11} />
                </a>
              </div>
            </div>
          </MacWindow>
        ))}
      </div>
    </section>
  );
}
