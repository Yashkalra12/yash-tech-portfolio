/**
 * Every section in the reference is titled the same way: bold text followed by a
 * single coloured full stop. One component so the colour is the only variable.
 */
export default function SectionHeading({ children, dotColor = "#006AFF", className = "" }) {
  return (
    <h2 className={`text-3xl font-bold md:text-4xl ${className}`}>
      {children} <span style={{ color: dotColor }}>.</span>
    </h2>
  );
}
