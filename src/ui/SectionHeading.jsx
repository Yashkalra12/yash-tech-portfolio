/**
 * Every section is titled the same way: bold text followed by a single coloured
 * full stop. One component so the colour is the only variable.
 *
 * Passing `accent` puts a coloured word in front of the rest of the heading —
 * "**Destructuring** My Work Experience." — which is how the longer headings are
 * built. It is a separate prop rather than markup in `children` so the colour is
 * still decided in one place and always matches the full stop.
 *
 * Set in Instrument Serif at its single 400 weight — asking for bold would make
 * the browser smear a synthetic one — so the size carries the emphasis instead.
 */
export default function SectionHeading({ children, accent, dotColor = "#006AFF", className = "" }) {
  return (
    <h2 className={`font-display text-4xl font-normal tracking-tight md:text-5xl ${className}`}>
      {accent ? <span style={{ color: dotColor }}>{accent} </span> : null}
      {children} <span style={{ color: dotColor }}>.</span>
    </h2>
  );
}
