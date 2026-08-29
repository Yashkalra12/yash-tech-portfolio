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
  const [pointer, setPointer] = useState(null);
  const [pinching, setPinching] = useState(false);
  const [mode, setMode] = useState("idle"); // idle | scroll | click

  const smoothedRef = useRef(null);
  const scrollAnchorRef = useRef(null);
  const lastClickRef = useRef(0);

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
    const previousPointerEvents = overlay?.style.pointerEvents;
    if (overlay) overlay.style.pointerEvents = "none";

    const target = document.elementFromPoint(px, py);

    if (overlay && previousPointerEvents !== undefined) {
      overlay.style.pointerEvents = previousPointerEvents;
    }
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
        setPointer(null);
        setMode("idle");
        setPinching(false);
        smoothedRef.current = null;
        scrollAnchorRef.current = null;
        return;
      }

      // Smooth the raw fingertip position — landmark output is noisy frame to
      // frame, and an unsmoothed cursor is unusable for aiming at a button.
      const previous = smoothedRef.current;
      const next = previous
        ? {
            x: previous.x + (gesture.pointer.x - previous.x) * SMOOTHING,
            y: previous.y + (gesture.pointer.y - previous.y) * SMOOTHING,
          }
        : gesture.pointer;
      smoothedRef.current = next;
      setPointer(next);
      setPinching(gesture.pinching);

      if (gesture.pinchStarted) {
        setMode("click");
        clickAtPointer(next.x, next.y);
        scrollAnchorRef.current = null;
        return;
      }

      if (gesture.isOpenPalm && !gesture.pinching) {
        setMode("scroll");
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

      setMode("idle");
      scrollAnchorRef.current = null;
    },
    [clickAtPointer],
  );

  const tracking = useHandTracking({ onGesture: handleGesture });

  const enable = useCallback(async () => {
    setEnabled(true);
    await tracking.start();
  }, [tracking]);

  const disable = useCallback(() => {
    tracking.stop();
    setEnabled(false);
    setPointer(null);
    setPinching(false);
    setMode("idle");
    smoothedRef.current = null;
    scrollAnchorRef.current = null;
  }, [tracking]);

  const value = useMemo(
    () => ({
      enabled,
      enable,
      disable,
      pointer,
      pinching,
      mode,
      status: tracking.status,
      error: tracking.error,
      isRunning: tracking.isRunning,
      videoRef: tracking.videoRef,
    }),
    [enabled, enable, disable, pointer, pinching, mode, tracking],
  );

  return <HandControlContext.Provider value={value}>{children}</HandControlContext.Provider>;
}
