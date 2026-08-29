/**
 * Screenshot grid of projects. Clicking one opens the live site in a modal
 * (ProjectDialog), which is how the reference presents its work.
 */

import { useState } from "react";
import ProjectDialog from "./ProjectDialog";
import SectionHeading from "./SectionHeading";
import { projects } from "../data/profile";

export default function Projects() {
  const [active, setActive] = useState(null);

  return (
    <section id="projects" className="scroll-mt-24 py-16">
      <SectionHeading>Projects</SectionHeading>
      <p className="mt-2 font-cartoon text-2xl text-[#006AFF]">
        ~ click any card to open the real thing, right here on the page
      </p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <button
            key={project.id}
            type="button"
            onClick={() => setActive(project)}
            className="project-card group text-left"
          >
            <img
              src={project.image}
              alt={project.title}
              loading="lazy"
              className="aspect-[16/10] w-full object-cover"
            />
            <div className="bg-white p-4">
              <h3 className="font-bold group-hover:text-[#006AFF]">{project.title}</h3>
              <p className="mt-1 line-clamp-2 text-xs text-slate-500">{project.description}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {project.stack.slice(0, 4).map((tech) => (
                  <span
                    key={tech}
                    className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500"
                  >
                    {tech}
                  </span>
                ))}
                {project.stack.length > 4 ? (
                  <span className="px-1 text-[10px] text-slate-400">
                    +{project.stack.length - 4}
                  </span>
                ) : null}
              </div>
            </div>
          </button>
        ))}
      </div>

      {active ? <ProjectDialog project={active} onClose={() => setActive(null)} /> : null}
    </section>
  );
}
