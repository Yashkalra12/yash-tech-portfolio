/**
 * "Variable Skill Set" — the draggable grouped list from the reference, plus a
 * logo wall of the individual technologies.
 */

import { useState } from "react";
import DraggableList from "./DraggableList";
import SectionHeading from "./SectionHeading";
import { skillGroups, skills } from "../data/profile";

export default function SkillSet() {
  const [order, setOrder] = useState(skillGroups);

  return (
    <section id="skills" className="scroll-mt-24 py-16">
      <SectionHeading dotColor="#ff9f1c">Variable Skill Set</SectionHeading>

      <div className="mt-8 flex flex-col gap-10 lg:flex-row lg:items-start">
        <div className="w-full lg:w-1/2">
          <DraggableList items={order} onReorder={setOrder} />
          <p className="mt-4 font-cartoon text-2xl text-[#ff9f1c]">
            PS. my skill set is literally variable — try dragging one of them :p
          </p>
        </div>

        <div className="w-full lg:w-1/2">
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
            {skills.map((skill) => (
              <div
                key={skill.title}
                title={skill.title}
                className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 transition hover:-translate-y-1 hover:border-[#006AFF]/40 hover:shadow-md"
              >
                <img src={`/skills/${skill.img}`} alt="" className="h-9 w-9 object-contain" />
                <span className="text-center text-[10px] font-semibold text-slate-500">
                  {skill.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
