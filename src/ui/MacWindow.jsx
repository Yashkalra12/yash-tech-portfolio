/**
 * The window chrome that shows up all over this design: a rounded card with a
 * grey title bar and three traffic lights. The red dot genuinely dismisses the
 * card and the green one toggles the size — they are wired up rather than being
 * decoration, because a control that looks clickable and is not is a small lie.
 */

const DOT = {
  close: "#FE5E58",
  minimise: "#FEBD2C",
  zoom: "#27C841",
};

function TrafficLight({ color, onClick, label }) {
  const interactive = Boolean(onClick);
  return (
    <button
      type="button"
      aria-label={label}
      disabled={!interactive}
      onClick={onClick}
      className={`h-3 w-3 shrink-0 rounded-full transition ${
        interactive ? "cursor-pointer hover:brightness-110 active:scale-90" : "cursor-default"
      }`}
      style={{ backgroundColor: color }}
    />
  );
}

/**
 * @param {object} props
 * @param {import('react').ReactNode} props.children
 * @param {string} [props.title]        text shown in the title bar
 * @param {() => void} [props.onClose]  wires the red light
 * @param {() => void} [props.onZoom]   wires the green light
 * @param {string} [props.className]
 * @param {string} [props.bodyClassName]
 */
export default function MacWindow({
  children,
  title,
  onClose,
  onZoom,
  className = "",
  bodyClassName = "",
}) {
  return (
    <div
      className={`overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)] ${className}`}
    >
      <div className="flex h-9 items-center gap-2 border-b border-slate-200 bg-[#ededed] px-3">
        <TrafficLight color={DOT.close} onClick={onClose} label="Close" />
        <TrafficLight color={DOT.minimise} label="Minimise" />
        <TrafficLight color={DOT.zoom} onClick={onZoom} label="Toggle size" />
        {title ? (
          <span className="ml-3 truncate rounded bg-[#e3e3e3] px-3 py-0.5 text-xs text-slate-500">
            {title}
          </span>
        ) : null}
      </div>
      <div className={bodyClassName}>{children}</div>
    </div>
  );
}
