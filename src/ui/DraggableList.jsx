/**
 * A list of skill cards you can drag to reorder, because "my skill set is
 * literally variable" is the joke of that section.
 *
 * framer-motion is already a dependency here and ships `Reorder`, so this needs
 * no extra drag library. Each row is also reorderable from the keyboard with the
 * arrow keys, so the joke is not mouse-only.
 */

import { Reorder, useDragControls } from "framer-motion";
import { FaGripVertical } from "react-icons/fa";

function SkillRow({ item, onMove }) {
  const controls = useDragControls();
  const [group, detail] = item;

  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={controls}
      whileDrag={{ scale: 1.04, zIndex: 10, boxShadow: "0 12px 30px rgba(0,0,0,0.2)" }}
      className="skill-row flex cursor-grab touch-none select-none items-center gap-3 rounded-lg px-4 py-3 text-white shadow-md active:cursor-grabbing"
      onPointerDown={(event) => controls.start(event)}
      // Arrow keys give the same affordance without a pointer.
      onKeyDown={(event) => {
        if (event.key === "ArrowUp") {
          event.preventDefault();
          onMove(-1);
        } else if (event.key === "ArrowDown") {
          event.preventDefault();
          onMove(1);
        }
      }}
      tabIndex={0}
      aria-label={`${group}: ${detail}. Use arrow keys to reorder.`}
    >
      <FaGripVertical aria-hidden className="shrink-0 opacity-70" />
      <span className="font-bold">{group}</span>
      <span className="ml-auto text-right text-xs opacity-90 md:text-sm">{detail}</span>
    </Reorder.Item>
  );
}

/**
 * @param {{ items: [string, string][], onReorder: (items: [string, string][]) => void }} props
 */
export default function DraggableList({ items, onReorder }) {
  const move = (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onReorder(next);
  };

  return (
    <Reorder.Group as="ul" axis="y" values={items} onReorder={onReorder} className="space-y-3">
      {items.map((item, index) => (
        <SkillRow key={item[0]} item={item} onMove={(dir) => move(index, dir)} />
      ))}
    </Reorder.Group>
  );
}
