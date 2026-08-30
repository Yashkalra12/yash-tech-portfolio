/**
 * Two rows of technology tiles that slide past each other as you scroll.
 *
 * Two decisions worth stating:
 *
 *   1. It animates a transform rather than `scrollLeft`. Scrolling a real
 *      overflow container fights the browser's scroll anchoring, and on iOS a
 *      programmatically scrolled element can steal the page's touch gestures.
 *   2. The tile list is rendered twice and the track never travels further than one
 *      list length, so there is always a second copy filling the space the first
 *      one vacates. That removes wrap logic entirely — nothing has to detect an
 *      end and jump the offset back.
 *
 * The rows move in opposite directions, which is what makes this read as motion
 * rather than as a list that happens to be sliding.
 */

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { skills } from "../data/profile";

gsap.registerPlugin(ScrollTrigger);

/**
 * How far the track travels across the whole scroll range, as a percentage of the
 * doubled track.
 *
 * It used to be the full 50% — one complete list length — which with thirty-odd
 * tiles is several thousand pixels of travel over roughly one viewport of scroll,
 * so the tiles blurred past. A shorter trip is a slower one; anything under 50%
 * still never exposes the end of the duplicated list, so nothing has to wrap.
 */
const TRAVEL = 14;

/** Rotate the second row so the two rows never show the same tile side by side. */
const OFFSET = Math.ceil(skills.length / 2);
const ROW_ONE = skills;
const ROW_TWO = [...skills.slice(OFFSET), ...skills.slice(0, OFFSET)];

function Tile({ skill }) {
  return (
    <div
      title={skill.title}
      className="flex h-[76px] w-[76px] shrink-0 items-center justify-center rounded-2xl border bg-white shadow-sm transition-transform duration-200 hover:-translate-y-1 sm:h-[120px] sm:w-[120px]"
      style={{ borderColor: `${skill.color}33`, backgroundColor: `${skill.color}0F` }}
    >
      {skill.img ? (
        <img
          src={`/skills/${skill.img}`}
          alt={skill.title}
          loading="lazy"
          className="h-8 w-8 object-contain sm:h-14 sm:w-14"
        />
      ) : (
        // No redistributable mark for this one, so the name is the logo. Balanced
        // against the image tiles by weight rather than by size.
        <span
          className="px-1.5 text-center text-[9px] font-bold uppercase leading-tight tracking-tight sm:text-xs"
          style={{ color: skill.color }}
        >
          {skill.title}
        </span>
      )}
    </div>
  );
}

function Row({ items, reverse }) {
  const trackRef = useRef(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;

    // Respect a visitor who has asked the OS for less movement.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    // Row two starts already displaced and travels back, so the rows pass each
    // other in opposite directions.
    const from = reverse ? -TRAVEL : 0;
    const to = reverse ? 0 : -TRAVEL;

    gsap.set(track, { xPercent: from });

    const tween = gsap.fromTo(
      track,
      { xPercent: from },
      {
        xPercent: to,
        ease: "none",
        scrollTrigger: {
          trigger: track,
          // The whole time any part of the row is on screen.
          start: "top bottom",
          end: "bottom top",
          // Lags the scroll position by ~2s, which is what makes it glide rather
          // than snap to every wheel tick.
          scrub: 2,
        },
      },
    );

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [reverse]);

  return (
    <div
      // The mask fades both ends so tiles dissolve instead of being guillotined by
      // the container edge.
      className="overflow-hidden"
      style={{
        maskImage:
          "linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)",
      }}
    >
      <div ref={trackRef} className="flex w-max gap-[18px] sm:gap-6">
        {items.map((skill) => (
          <Tile key={skill.title} skill={skill} />
        ))}
        {/* The duplicate that makes -50% a seamless loop. Hidden from the a11y tree
            and from search, since it is the same list a second time. */}
        {items.map((skill) => (
          <div key={`${skill.title}-loop`} aria-hidden>
            <Tile skill={skill} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SkillsMarquee() {
  return (
    <div className="flex flex-col gap-[18px] sm:gap-6">
      <Row items={ROW_ONE} />
      <Row items={ROW_TWO} reverse />
    </div>
  );
}
