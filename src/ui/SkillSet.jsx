/**
 * "Variable Skill Set" — the scrolling technology marquee, plus the draggable
 * grouped list from the reference.
 *
 * The marquee replaced a static grid of the same eighteen logos: showing both was
 * the same information twice, and the grid was the weaker of the two.
 */

import { useState } from "react";
import DraggableList from "./DraggableList";
import SectionHeading from "./SectionHeading";
import SkillsMarquee from "./SkillsMarquee";
import { skillGroups } from "../data/profile";

export default function SkillSet() {
  const [order, setOrder] = useState(skillGroups);

  return (
    <section id="skills" className="scroll-mt-24 py-16">
      <SectionHeading accent="Variable" dotColor="#ff9f1c">
        Skill Set
      </SectionHeading>

      {/* Breaks out of the page gutter so the tiles run to both edges and the
          fade-out mask has room to work. */}
      <div className="mt-10 -mx-5 sm:-mx-8 lg:-mx-12">
        <SkillsMarquee />
      </div>

      <div className="mt-12 max-w-2xl">
        <DraggableList items={order} onReorder={setOrder} />
        <p className="mt-4 font-cartoon text-2xl text-[#ff9f1c]">
          PS. my skill set is literally variable — try dragging one of them :p
        </p>
      </div>
    </section>
  );
}
