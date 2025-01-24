import { useEffect, useRef } from "react";
import UseIntersectionObserver from "../../Hooks/UseInterSectionObsever";

export default function AnimatedText({ text, delay = 0, refresh = false }) {
  const textRef = useRef(null);
  const isVisible = UseIntersectionObserver(textRef);

  useEffect(() => {
    mount();
  }, [text, delay, refresh]);

  useEffect(() => {
    if (isVisible && refresh) {
      mount();
    }
  }, [isVisible, refresh]);

  async function mount() {
    if (!textRef.current) return;

    // Animate out existing characters
    Array.from(textRef.current.children).forEach((child) => {
      child.className = "anim-char-out";
    });

    // Wait for animation to complete
    await new Promise((resolve) => {
      setTimeout(resolve, 200 + textRef.current.children.length * 25);
    });

    // Prepare and insert new text with animation
    const html = text
      .split("")
      .map(
        (char, index) =>
          `<span class='anim-char-in' style='animation-delay: ${
            index * 25 + delay
          }ms;'>${char}</span>`
      )
      .join("");

    if (textRef.current) {
      textRef.current.innerHTML = html;
    }
  }

  return <div ref={textRef}></div>;
}
