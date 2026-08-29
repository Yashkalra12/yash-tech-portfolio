/**
 * Turns hand gestures into page interaction.
 *
 * The gesture vocabulary, kept deliberately small so it is learnable in one
 * sentence of on-screen help:
 *
 *   Open palm, move up/down  →  scroll the page
 *   Pinch (thumb + index)    →  click whatever the cursor is over
 *   Fist                     →  hold still / do nothing
 *
 * Nothing here runs until the visitor explicitly opts in via PermissionGate;
 * the camera is only ever requested from a user gesture.
 *
 * Note on state: the cursor position lives in a ref, not in state. Gestures
 * arrive at up to 60Hz, and re-rendering the whole page subtree that often made
 * the cursor stutter. HandCursor reads the ref from its own animation frame and
 * writes the position straight to the DOM. Only coarse things that change a few
 * times a second — mode, pinching, whether a hand is visible — are state.
 */

import { useCallback, useMemo, useRef, useState } from "react";
import useHandTracking from "./useHandTracking";
import { HandControlContext } from "./context";

/** Ignore pointer jitter below this (normalised units) before scrolling. */
const SCROLL_DEADZONE = 0.012;
/** Normalised hand travel → pixels of scroll. */
const SCROLL_GAIN = 2600;
/** Minimum gap between two gesture clicks, so one pinch is never two clicks. */
const CLICK_COOLDOWN_MS = 600;
/** Exponential smoothing on the cursor: lower is smoother but laggier. */
const SMOOTHING = 0.35;

export function HandControlProvider({ children }) {
  const [enabled, setEnabled] = useState(false);
  const [pinching, setPinching] = useState(false);
  const [handPresent, setHandPresent] = useState(false);
  const [mode, setMode] = useState("idle"); // idle | scroll | click

  /** Latest smoothed cursor position in normalised units, or null. */
  const pointerRef = useRef(null);
  const scrollAnchorRef = useRef(null);
  const lastClickRef = useRef(0);

  // Mirror the coarse state in refs so the gesture handler can compare against
  // the current value without re-subscribing every render.
  const pinchingStateRef = useRef(false);
  const modeRef = useRef("idle");
  const presentRef = useRef(false);

  const setPinchingIfChanged = useCallback((value) => {
    if (pinchingStateRef.current === value) return;
    pinchingStateRef.current = value;
    setPinching(value);
  }, []);

  const setModeIfChanged = useCallback((value) => {
    if (modeRef.current === value) return;
    modeRef.current = value;
    setMode(value);
  }, []);

  const setPresentIfChanged = useCallback((value) => {
    if (presentRef.current === value) return;
    presentRef.current = value;
    setHandPresent(value);
  }, []);

  /**
   * Dispatch a real click at the cursor. We hide the overlay for the hit test
   * so `elementFromPoint` returns the page element underneath rather than our
   * own cursor, then click the nearest interactive ancestor.
   */
  const clickAtPointer = useCallback((x, y) => {
    const now = performance.now();
    if (now - lastClickRef.current < CLICK_COOLDOWN_MS) return;
    lastClickRef.current = now;

    const px = x * window.innerWidth;
    const py = y * window.innerHeight;

    const overlay = document.getElementById("hand-cursor-layer");
    const previousVisibility = overlay?.style.visibility;
    if (overlay) overlay.style.visibility = "hidden";

    const target = document.elementFromPoint(px, py);

    if (overlay) overlay.style.visibility = previousVisibility ?? "";
    if (!target) return;

    const clickable = target.closest(
      'a, button, [role="button"], input, select, textarea, summary, [data-hand-clickable]',
    );
    const node = clickable ?? target;

    if (typeof node.focus === "function") node.focus({ preventScroll: true });
    node.dispatchEvent(
      new MouseEvent("click", { bubbles: true, cancelable: true, view: window, clientX: px, clientY: py }),
    );
  }, []);

  const handleGesture = useCallback(
    (gesture) => {
      if (!gesture.present) {
        pointerRef.current = null;
        scrollAnchorRef.current = null;
        setPresentIfChanged(false);
        setModeIfChanged("idle");
        setPinchingIfChanged(false);
        return;
      }

      // Smooth the raw fingertip position — landmark output is noisy frame to
      // frame, and an unsmoothed cursor is unusable for aiming at a button.
      const previous = pointerRef.current;
      const next = previous
        ? {
            x: previous.x + (gesture.pointer.x - previous.x) * SMOOTHING,
            y: previous.y + (gesture.pointer.y - previous.y) * SMOOTHING,
          }
        : gesture.pointer;
      pointerRef.current = next;

      setPresentIfChanged(true);
      setPinchingIfChanged(gesture.pinching);

      if (gesture.pinchStarted) {
        setModeIfChanged("click");
        clickAtPointer(next.x, next.y);
        scrollAnchorRef.current = null;
        return;
      }

      if (gesture.isOpenPalm && !gesture.pinching) {
        setModeIfChanged("scroll");
        const anchor = scrollAnchorRef.current;
        if (anchor === null) {
          scrollAnchorRef.current = next.y;
        } else {
          const delta = next.y - anchor;
          if (Math.abs(delta) > SCROLL_DEADZONE) {
            window.scrollBy({ top: delta * SCROLL_GAIN * 0.06, behavior: "auto" });
            // Re-anchor each frame so holding your palm off-centre scrolls
            // continuously, rather than snapping once and stopping.
            scrollAnchorRef.current = next.y - delta * 0.85;
          }
        }
        return;
      }

      setModeIfChanged("idle");
      scrollAnchorRef.current = null;
    },
    [clickAtPointer, setModeIfChanged, setPinchingIfChanged, setPresentIfChanged],
  );

  const tracking = useHandTracking({ onGesture: handleGesture });

  /** @returns {Promise<boolean>} whether tracking actually started. */
  const enable = useCallback(async () => {
    setEnabled(true);
    await tracking.start();
    return tracking.statusRef.current === "running";
  }, [tracking]);

  const disable = useCallback(() => {
    tracking.stop();
    setEnabled(false);
    pointerRef.current = null;
    scrollAnchorRef.current = null;
    setPresentIfChanged(false);
    setPinchingIfChanged(false);
    setModeIfChanged("idle");
  }, [tracking, setModeIfChanged, setPinchingIfChanged, setPresentIfChanged]);

  const value = useMemo(
    () => ({
      enabled,
      enable,
      disable,
      pointerRef,
      handPresent,
      pinching,
      mode,
      status: tracking.status,
      error: tracking.error,
      delegate: tracking.delegate,
      isRunning: tracking.isRunning,
      videoRef: tracking.videoRef,
      landmarksRef: tracking.landmarksRef,
    }),
    [enabled, enable, disable, handPresent, pinching, mode, tracking],
  );

  return <HandControlContext.Provider value={value}>{children}</HandControlContext.Provider>;
}
