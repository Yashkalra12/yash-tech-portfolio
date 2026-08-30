/**
 * A CSS-3D robot that tilts its head to match yours.
 *
 * It reads the face landmarks the hand-control feature is already producing, so
 * turning the camera on for gesture control also makes this follow you — no second
 * camera stream, no second model. With the camera off it sways gently on a timer
 * instead, which is what makes the "turn the camera on" invitation land: the thing
 * is visibly alive before you have given it anything.
 *
 * Built out of transforms rather than three.js on purpose. The whole robot is a
 * dozen divs on a `perspective`, which costs nothing next to another 3D runtime,
 * and the head rotation is written straight to `style.transform` from one frame
 * loop — head pose arrives ~30 times a second and putting that through React
 * state would re-render the section on every frame.
 */

import { useEffect, useRef } from "react";
import { useHandControl } from "../features/handControl/context";
import { extractHeadPose } from "../features/handControl/gestures";

/** Degrees of head rotation at full deflection. */
const MAX_YAW = 26;
const MAX_PITCH = 16;
/** Exponential smoothing on the pose. Landmarks are too jittery to use raw. */
const SMOOTHING = 0.12;
/** Idle sway, used when there is no face to follow. */
const IDLE_YAW = 9;
const IDLE_PITCH = 4;
const IDLE_PERIOD_MS = 5200;

export default function RobotHead() {
  const { faceLandmarksRef, isRunning } = useHandControl();
  const headRef = useRef(null);
  const eyesRef = useRef(null);
  // Kept out of state: this is written every frame.
  const poseRef = useRef({ yaw: 0, pitch: 0 });
  const trackingRef = useRef(false);

  trackingRef.current = isRunning;

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = requestAnimationFrame(function tick(now) {
      const pose = poseRef.current;
      const face = trackingRef.current ? faceLandmarksRef.current : null;

      let targetYaw = 0;
      let targetPitch = 0;

      if (face) {
        // Mirrored, because the preview is mirrored: leaning left should tilt the
        // robot the same way it looks on screen.
        const { x, y } = extractHeadPose(face);
        targetYaw = -x * MAX_YAW;
        targetPitch = y * MAX_PITCH;
      } else if (!reduceMotion) {
        const phase = (now / IDLE_PERIOD_MS) * Math.PI * 2;
        targetYaw = Math.sin(phase) * IDLE_YAW;
        targetPitch = Math.sin(phase * 0.6) * IDLE_PITCH;
      }

      pose.yaw += (targetYaw - pose.yaw) * SMOOTHING;
      pose.pitch += (targetPitch - pose.pitch) * SMOOTHING;

      if (headRef.current) {
        headRef.current.style.transform = `rotateY(${pose.yaw.toFixed(2)}deg) rotateX(${(-pose.pitch).toFixed(2)}deg)`;
      }
      // The eyes travel a little further than the head, which is the whole trick
      // for making a face read as "looking at you" rather than "rotated".
      if (eyesRef.current) {
        eyesRef.current.style.transform = `translate3d(${(pose.yaw * 0.16).toFixed(2)}px, ${(pose.pitch * 0.2).toFixed(2)}px, 0)`;
      }

      raf = requestAnimationFrame(tick);
    });

    return () => cancelAnimationFrame(raf);
  }, [faceLandmarksRef]);

  return (
    <div className="mx-auto w-full max-w-xs select-none">
      <div
        className="relative flex aspect-square items-center justify-center rounded-2xl bg-gradient-to-b from-[#eef3ff] to-[#dfe7f7] shadow-lg dark:from-[#141926] dark:to-[#0d1119]"
        style={{ perspective: "700px" }}
      >
        {/* Glow behind the robot, so it sits in the panel rather than on it. */}
        <div
          aria-hidden
          className="absolute h-40 w-40 rounded-full bg-[#006AFF]/20 blur-2xl"
        />

        <div
          ref={headRef}
          className="relative h-[46%] w-[52%] rounded-[28%] bg-gradient-to-b from-white to-[#c9d6ef] shadow-[0_18px_40px_rgba(16,24,40,0.28)] dark:from-[#2a3243] dark:to-[#171d29]"
          style={{ transformStyle: "preserve-3d", willChange: "transform" }}
        >
          {/* Antenna */}
          <span
            aria-hidden
            className="absolute -top-[22%] left-1/2 h-[22%] w-[3px] -translate-x-1/2 bg-slate-400/70 dark:bg-slate-500/70"
          />
          <span
            aria-hidden
            className="absolute -top-[30%] left-1/2 h-[10%] w-[10%] -translate-x-1/2 rounded-full bg-[#FE5E58] shadow-[0_0_14px_rgba(254,94,88,0.8)]"
          />

          {/* Visor, with the eyes inside it */}
          <div className="absolute inset-x-[12%] top-[26%] flex h-[34%] items-center justify-center rounded-full bg-[#101828] shadow-inner dark:bg-[#05070c]">
            <div ref={eyesRef} className="flex items-center gap-4 sm:gap-5">
              {[0, 1].map((eye) => (
                <span
                  key={eye}
                  aria-hidden
                  className="h-2.5 w-2.5 rounded-full bg-[#4fd1ff] shadow-[0_0_12px_rgba(79,209,255,0.9)] sm:h-3 sm:w-3"
                />
              ))}
            </div>
          </div>

          {/* Mouth grille */}
          <div className="absolute inset-x-[30%] bottom-[16%] flex justify-between">
            {[0, 1, 2, 3].map((bar) => (
              <span
                key={bar}
                aria-hidden
                className="h-[6px] w-[3px] rounded-full bg-slate-400/80 dark:bg-slate-600"
              />
            ))}
          </div>

          {/* Ears, pushed out in z so the head has depth when it turns */}
          {[-1, 1].map((side) => (
            <span
              key={side}
              aria-hidden
              className="absolute top-[38%] h-[16%] w-[7%] rounded-full bg-slate-300 dark:bg-slate-700"
              style={{ [side === -1 ? "left" : "right"]: "-5%" }}
            />
          ))}
        </div>

        {/* Body, outside the rotating head so only the head turns. */}
        <div
          aria-hidden
          className="absolute bottom-[14%] h-[16%] w-[38%] rounded-t-[40%] bg-gradient-to-b from-[#c9d6ef] to-[#aebdd9] dark:from-[#222a39] dark:to-[#161c27]"
        />
      </div>

      <p className="mt-3 text-center font-cartoon text-2xl text-[#f5576c]">
        {isRunning
          ? "~ it's watching your head, tilt it :)"
          : "~ that's me. turn the camera on and it follows your head"}
      </p>
    </div>
  );
}
