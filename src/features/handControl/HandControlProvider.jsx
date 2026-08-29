/**
 * Turns face and hand landmarks into page interaction.
 *
 * The gesture vocabulary, matching what the tutorial modal teaches:
 *
 *   Move your head        →  steer the cursor
 *   Show an open palm     →  steer the cursor with your hand instead
 *   Quick pinch + release →  click whatever the cursor is over
 *   Pinch and drag        →  scroll, with momentum when you let go
 *   Fist                  →  cancel everything and hold still
 *
 * The interesting parts are the transitions, not the poses:
 *
 *   - A pinch is only a *click* if you release it without having dragged. Drag
 *     past a threshold and the same pinch becomes a scroll that ends in a coast
 *     rather than a click. One gesture, two outcomes, decided on release.
 *   - Every pose change waits for three consecutive frames of agreement. Single
 *     frames of landmark noise would otherwise fire phantom clicks.
 *   - A fist hard-cancels, and suppresses pinches briefly afterwards, because the
 *     hand passes through pinch-like shapes while opening out of a fist.
 *
 * Nothing here runs until the visitor explicitly opts in; the camera is only ever
 * requested from a user gesture.
 *
 * Cursor position lives in a ref, not in state. Landmarks arrive ~30 times a
 * second and re-rendering the page that often is visibly janky — HandCursor reads
 * the ref from its own animation frame and writes to the DOM directly.
 */

import { useCallback, useMemo, useRef, useState } from "react";
import useVisionTracking from "./useVisionTracking";
import { HandControlContext } from "./context";
import {
  countExtendedFingers,
  detectPinch,
  extractHeadPose,
  isFist,
  isPinchReleased,
  palmPosition,
} from "./gestures";

/** Exponential smoothing on positions: higher is more responsive, less steady. */
const POSITION_SMOOTHING = 0.45;
const HEAD_SMOOTHING = 0.25;
/** Frames of agreement before a pose change is believed. */
const GESTURE_DEBOUNCE_FRAMES = 3;
/** Pixels of scroll per pixel of hand travel while pinch-dragging. */
const SCROLL_SENSITIVITY = 8;
const SCROLL_Y_SMOOTHING = 0.4;
/** Velocity multiplier per frame while coasting. Lower stops sooner. */
const MOMENTUM_DECAY = 0.95;
/** Coasting stops below this many pixels per frame. */
const MOMENTUM_MIN = 0.5;
const VELOCITY_SMOOTHING = 0.3;
/** Minimum gap between two clicks, so one pinch can never register twice. */
const PINCH_COOLDOWN_MS = 300;
/** Vertical travel (px) that turns a held pinch into a scroll instead of a click. */
const PINCH_SCROLL_THRESHOLD = 15;
/** Pinches are ignored for this long after a fist, while the hand opens out. */
const FIST_COOLDOWN_MS = 200;

const makePinchState = () => ({
  isPinching: false,
  isScrolling: false,
  pinchFrames: 0,
  releaseFrames: 0,
  lastClickTime: 0,
  startScreenY: 0,
  lastScreenY: 0,
  smoothedScreenY: 0,
  velocity: 0,
});

/**
 * Dispatch a full click sequence at a screen point.
 *
 * A bare `click` event is not enough: plenty of components listen for
 * pointerdown/mouseup instead, and some only reveal themselves on mouseover. We
 * hide the cursor overlay for the hit test so `elementFromPoint` returns the page
 * element underneath rather than our own cursor.
 */
function dispatchClickAt(screenX, screenY) {
  const overlay = document.getElementById("hand-cursor-layer");
  const previousVisibility = overlay?.style.visibility;
  if (overlay) overlay.style.visibility = "hidden";

  const target = document.elementFromPoint(screenX, screenY);

  if (overlay) overlay.style.visibility = previousVisibility ?? "";
  if (!target) return;

  const shared = { bubbles: true, cancelable: true, view: window, clientX: screenX, clientY: screenY };
  const pointer = { ...shared, pointerId: 1, pointerType: "mouse", isPrimary: true };

  target.dispatchEvent(new MouseEvent("mouseover", shared));
  target.dispatchEvent(new PointerEvent("pointerdown", pointer));
  target.dispatchEvent(new MouseEvent("mousedown", shared));
  target.dispatchEvent(new PointerEvent("pointerup", pointer));
  target.dispatchEvent(new MouseEvent("mouseup", shared));

  // Focus the nearest interactive ancestor so keyboard state stays coherent, then
  // click it — clicking a <span> inside a <button> would otherwise do nothing.
  const clickable = target.closest(
    'a, button, [role="button"], input, select, textarea, summary, [data-hand-clickable]',
  );
  const node = clickable ?? target;
  if (typeof node.focus === "function") node.focus({ preventScroll: true });
  node.dispatchEvent(new MouseEvent("click", shared));
}

export function HandControlProvider({ children }) {
  const [enabled, setEnabled] = useState(false);
  const [mode, setMode] = useState("idle"); // idle | head | hand | pinch | scroll

  /** Latest cursor position in normalised 0..1 page units, or null. */
  const pointerRef = useRef(null);
  /** What the cursor should look like this frame. Read by HandCursor. */
  const cursorStateRef = useRef({ pinching: false, scrolling: false, source: null });

  const smoothedHandsRef = useRef([
    { x: 0, y: 0, initialised: false },
    { x: 0, y: 0, initialised: false },
  ]);
  const smoothedHeadRef = useRef({ x: 0, y: 0, initialised: false });
  const pinchStatesRef = useRef([makePinchState(), makePinchState()]);
  const fistTimesRef = useRef([0, 0]);

  /** Shared coasting velocity, and the frame loop driving it. */
  const momentumRef = useRef({ velocity: 0, raf: null });

  const modeRef = useRef("idle");
  const setModeIfChanged = useCallback((value) => {
    if (modeRef.current === value) return;
    modeRef.current = value;
    setMode(value);
  }, []);

  const stopMomentum = useCallback(() => {
    const momentum = momentumRef.current;
    if (momentum.raf !== null) {
      cancelAnimationFrame(momentum.raf);
      momentum.raf = null;
    }
  }, []);

  /** Keep scrolling after release, decaying, the way a flicked touchscreen does. */
  const startMomentum = useCallback(() => {
    const momentum = momentumRef.current;
    if (momentum.raf !== null) return;

    const coast = () => {
      momentum.velocity *= MOMENTUM_DECAY;
      if (Math.abs(momentum.velocity) < MOMENTUM_MIN) {
        momentum.velocity = 0;
        momentum.raf = null;
        return;
      }
      window.scrollBy({ top: momentum.velocity, behavior: "instant" });
      momentum.raf = requestAnimationFrame(coast);
    };

    momentum.raf = requestAnimationFrame(coast);
  }, []);

  const handOffMomentum = useCallback(
    (velocity) => {
      if (Math.abs(velocity) <= MOMENTUM_MIN) return;
      momentumRef.current.velocity = velocity;
      startMomentum();
    },
    [startMomentum],
  );

  /**
   * Advance one hand's pinch state machine and act on any transition.
   * @returns {{ isPinching: boolean, isScrolling: boolean }}
   */
  const processPinch = useCallback(
    (landmarks, index, screenX, screenY) => {
      const state = pinchStatesRef.current[index];
      const now = performance.now();

      // A fist overrides everything: cancel an in-flight pinch, coast if we were
      // scrolling, and remember when so pinches stay suppressed for a moment.
      if (isFist(landmarks)) {
        fistTimesRef.current[index] = now;
        if (state.isPinching) {
          if (state.isScrolling) handOffMomentum(state.velocity);
          Object.assign(state, makePinchState(), { lastClickTime: state.lastClickTime });
        }
        return { isPinching: false, isScrolling: false };
      }

      // Opening out of a fist passes through pinch-like shapes. Ignore them.
      if (now - fistTimesRef.current[index] < FIST_COOLDOWN_MS) {
        state.pinchFrames = 0;
        return { isPinching: state.isPinching, isScrolling: state.isScrolling };
      }

      if (detectPinch(landmarks)) {
        state.pinchFrames += 1;
        state.releaseFrames = 0;
      } else if (isPinchReleased(landmarks)) {
        state.releaseFrames += 1;
        state.pinchFrames = 0;
      }

      // Enter a pinch.
      if (!state.isPinching && state.pinchFrames >= GESTURE_DEBOUNCE_FRAMES) {
        if (now - state.lastClickTime < PINCH_COOLDOWN_MS) {
          return { isPinching: false, isScrolling: false };
        }
        state.isPinching = true;
        state.isScrolling = false;
        state.startScreenY = screenY;
        state.lastScreenY = screenY;
        state.smoothedScreenY = screenY;
        state.velocity = 0;
        stopMomentum();
        return { isPinching: true, isScrolling: false };
      }

      // Promote a held pinch to a scroll once it has travelled far enough.
      if (state.isPinching && !state.isScrolling) {
        if (Math.abs(screenY - state.startScreenY) > PINCH_SCROLL_THRESHOLD) {
          state.isScrolling = true;
          state.lastScreenY = screenY;
          state.smoothedScreenY = screenY;
        }
      }

      // Drive the scroll.
      if (state.isPinching && state.isScrolling && state.releaseFrames === 0) {
        state.smoothedScreenY =
          state.smoothedScreenY * (1 - SCROLL_Y_SMOOTHING) + screenY * SCROLL_Y_SMOOTHING;

        const delta = state.smoothedScreenY - state.lastScreenY;
        state.lastScreenY = state.smoothedScreenY;

        // Inverted: dragging your hand down pulls the page down, like grabbing it.
        const amount = -delta * SCROLL_SENSITIVITY;
        state.velocity = state.velocity * (1 - VELOCITY_SMOOTHING) + amount * VELOCITY_SMOOTHING;
        window.scrollBy({ top: amount, behavior: "instant" });
      }

      // Release. Whether this was a click or a coast depends on whether it dragged.
      if (state.isPinching && state.releaseFrames >= GESTURE_DEBOUNCE_FRAMES) {
        if (state.isScrolling) handOffMomentum(state.velocity);
        else dispatchClickAt(screenX, screenY);

        Object.assign(state, makePinchState(), { lastClickTime: performance.now() });
        return { isPinching: false, isScrolling: false };
      }

      return { isPinching: state.isPinching, isScrolling: state.isScrolling };
    },
    [handOffMomentum, stopMomentum],
  );

  const handleFrame = useCallback(
    ({ hands, face }) => {
      const cursor = cursorStateRef.current;

      if (hands.length) {
        let pinching = false;
        let scrolling = false;
        let openPalm = false;

        hands.forEach((landmarks, index) => {
          if (index >= 2) return;

          // Smooth in normalised space before converting to pixels; landmark output
          // is noisy enough frame to frame that an unsmoothed cursor cannot be
          // aimed at a button.
          const raw = palmPosition(landmarks);
          const smoothed = smoothedHandsRef.current[index];
          if (smoothed.initialised) {
            smoothed.x += (raw.x - smoothed.x) * POSITION_SMOOTHING;
            smoothed.y += (raw.y - smoothed.y) * POSITION_SMOOTHING;
          } else {
            smoothed.x = raw.x;
            smoothed.y = raw.y;
            smoothed.initialised = true;
          }

          const screenX = ((smoothed.x + 1) / 2) * window.innerWidth;
          const screenY = ((smoothed.y + 1) / 2) * window.innerHeight;

          const result = processPinch(landmarks, index, screenX, screenY);
          pinching = pinching || result.isPinching;
          scrolling = scrolling || result.isScrolling;
          if (countExtendedFingers(landmarks) >= 4) openPalm = true;

          // The first hand owns the cursor.
          if (index === 0) {
            pointerRef.current = { x: (smoothed.x + 1) / 2, y: (smoothed.y + 1) / 2 };
          }
        });

        cursor.pinching = pinching;
        cursor.scrolling = scrolling;
        cursor.source = "hand";
        setModeIfChanged(scrolling ? "scroll" : pinching ? "pinch" : openPalm ? "hand" : "idle");
        return;
      }

      // No hands: fall back to head steering, which is why the face model runs.
      if (face) {
        const pose = extractHeadPose(face);
        const smoothed = smoothedHeadRef.current;
        if (smoothed.initialised) {
          smoothed.x += (pose.x - smoothed.x) * HEAD_SMOOTHING;
          smoothed.y += (pose.y - smoothed.y) * HEAD_SMOOTHING;
        } else {
          smoothed.x = pose.x;
          smoothed.y = pose.y;
          smoothed.initialised = true;
        }

        pointerRef.current = { x: (smoothed.x + 1) / 2, y: (smoothed.y + 1) / 2 };
        cursor.pinching = false;
        cursor.scrolling = false;
        cursor.source = "head";
        setModeIfChanged("head");
        return;
      }

      pointerRef.current = null;
      cursor.source = null;
      setModeIfChanged("idle");
    },
    [processPinch, setModeIfChanged],
  );

  /** Hands left the frame: release any gesture they were holding. */
  const handleHandsLost = useCallback(() => {
    pinchStatesRef.current.forEach((state, index) => {
      if (state.isScrolling) handOffMomentum(state.velocity);
      pinchStatesRef.current[index] = makePinchState();
    });
    fistTimesRef.current = [0, 0];
    smoothedHandsRef.current.forEach((hand) => {
      hand.initialised = false;
    });
  }, [handOffMomentum]);

  const tracking = useVisionTracking({ onFrame: handleFrame, onLost: handleHandsLost });

  /** @returns {Promise<boolean>} whether tracking actually started. */
  const enable = useCallback(async () => {
    setEnabled(true);
    await tracking.start();
    return tracking.statusRef.current === "running";
  }, [tracking]);

  const disable = useCallback(() => {
    tracking.stop();
    stopMomentum();
    momentumRef.current.velocity = 0;
    setEnabled(false);
    pointerRef.current = null;
    cursorStateRef.current = { pinching: false, scrolling: false, source: null };
    pinchStatesRef.current = [makePinchState(), makePinchState()];
    smoothedHeadRef.current.initialised = false;
    handleHandsLost();
    setModeIfChanged("idle");
  }, [tracking, stopMomentum, handleHandsLost, setModeIfChanged]);

  const value = useMemo(
    () => ({
      enabled,
      enable,
      disable,
      pointerRef,
      cursorStateRef,
      mode,
      status: tracking.status,
      error: tracking.error,
      delegate: tracking.delegate,
      progress: tracking.progress,
      isRunning: tracking.isRunning,
      videoRef: tracking.videoRef,
      handLandmarksRef: tracking.handLandmarksRef,
      faceLandmarksRef: tracking.faceLandmarksRef,
      statsRef: tracking.statsRef,
    }),
    [enabled, enable, disable, mode, tracking],
  );

  return <HandControlContext.Provider value={value}>{children}</HandControlContext.Provider>;
}
