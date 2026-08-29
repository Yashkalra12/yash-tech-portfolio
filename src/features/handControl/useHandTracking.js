/**
 * Webcam hand tracking via MediaPipe's HandLandmarker.
 *
 * Owns the whole camera lifecycle: request the stream, load the model, run a
 * rAF detection loop, and tear everything down on stop. It reports gestures
 * upward and deliberately knows nothing about scrolling or clicking — that
 * mapping lives in HandControlProvider.
 *
 * Landmark indices used (MediaPipe hand model):
 *   0 wrist · 4 thumb tip · 8 index tip · 12 middle tip · 16 ring tip · 20 pinky tip
 *   plus 5/9/13/17 as the finger MCP joints, and 2 as the thumb MCP.
 */

import { useCallback, useEffect, useRef, useState } from "react";

const WASM_PATH =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

/** Pinch closes when thumb/index distance drops below this (hand-size relative). */
const PINCH_ON = 0.36;
/** ...and only re-opens above this. The gap is hysteresis against flicker. */
const PINCH_OFF = 0.5;

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

/**
 * Read a gesture out of one hand's 21 landmarks.
 * Distances are divided by hand span so they hold up as you move nearer or
 * further from the camera.
 */
function readGesture(landmarks) {
  const wrist = landmarks[0];
  const middleMcp = landmarks[9];
  // Wrist-to-middle-knuckle is a stable proxy for how big the hand appears.
  const span = Math.max(dist(wrist, middleMcp), 1e-4);

  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];

  const pinchDistance = dist(thumbTip, indexTip) / span;

  // A finger counts as extended when its tip sits further from the wrist than
  // its knuckle does — orientation-independent, unlike comparing raw y values.
  const extended = [
    [4, 2],
    [8, 5],
    [12, 9],
    [16, 13],
    [20, 17],
  ].map(([tip, mcp]) => dist(landmarks[tip], wrist) > dist(landmarks[mcp], wrist) * 1.15);

  const fingersUp = extended.slice(1).filter(Boolean).length;

  return {
    pinchDistance,
    fingersUp,
    isOpenPalm: fingersUp >= 4,
    isFist: fingersUp === 0,
    // The index fingertip is the pointer; mirrored because the preview is a
    // mirror image, which is what makes moving your hand right feel right.
    pointer: { x: 1 - indexTip.x, y: indexTip.y },
  };
}

/**
 * @param {object} options
 * @param {(gesture: ReturnType<typeof readGesture> & { pinching: boolean, pinchStarted: boolean, pinchEnded: boolean }) => void} options.onGesture
 * @param {(error: Error) => void} [options.onError]
 */
export default function useHandTracking({ onGesture, onError }) {
  const [status, setStatus] = useState("idle"); // idle | loading | running | error
  const [error, setError] = useState(null);

  const videoRef = useRef(null);
  const landmarkerRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const lastVideoTimeRef = useRef(-1);
  const pinchingRef = useRef(false);
  const runningRef = useRef(false);

  // Keep the latest callbacks without restarting the camera when they change.
  const onGestureRef = useRef(onGesture);
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onGestureRef.current = onGesture;
    onErrorRef.current = onError;
  }, [onGesture, onError]);

  const stop = useCallback(() => {
    runningRef.current = false;
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    landmarkerRef.current?.close?.();
    landmarkerRef.current = null;
    lastVideoTimeRef.current = -1;
    pinchingRef.current = false;
    setStatus("idle");
  }, []);

  const detectLoop = useCallback(() => {
    if (!runningRef.current) return;
    const video = videoRef.current;
    const landmarker = landmarkerRef.current;

    if (video && landmarker && video.readyState >= 2) {
      // MediaPipe rejects a repeated timestamp, so only infer on new frames.
      if (video.currentTime !== lastVideoTimeRef.current) {
        lastVideoTimeRef.current = video.currentTime;
        try {
          const result = landmarker.detectForVideo(video, performance.now());
          const landmarks = result?.landmarks?.[0];

          if (landmarks) {
            const gesture = readGesture(landmarks);
            const wasPinching = pinchingRef.current;
            const pinching = wasPinching
              ? gesture.pinchDistance < PINCH_OFF
              : gesture.pinchDistance < PINCH_ON;
            pinchingRef.current = pinching;

            onGestureRef.current?.({
              ...gesture,
              present: true,
              pinching,
              pinchStarted: pinching && !wasPinching,
              pinchEnded: !pinching && wasPinching,
            });
          } else {
            pinchingRef.current = false;
            onGestureRef.current?.({ present: false });
          }
        } catch (err) {
          // A single bad frame should not kill the session.
          if (import.meta.env.DEV) console.warn("[hand] frame failed", err);
        }
      }
    }

    rafRef.current = requestAnimationFrame(detectLoop);
  }, []);

  const start = useCallback(async () => {
    if (runningRef.current) return;

    setError(null);
    setStatus("loading");

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("This browser does not expose a camera API.");
      }

      // Loaded lazily so that ~2MB of wasm glue stays out of the initial bundle
      // for the majority of visitors who never turn this on.
      const { FilesetResolver, HandLandmarker } = await import("@mediapipe/tasks-vision");

      const vision = await FilesetResolver.forVisionTasks(WASM_PATH);
      const landmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
        runningMode: "VIDEO",
        numHands: 1,
        minHandDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
        audio: false,
      });

      const video = videoRef.current;
      if (!video) throw new Error("Video element was not mounted.");

      landmarkerRef.current = landmarker;
      streamRef.current = stream;
      video.srcObject = stream;
      await video.play();

      runningRef.current = true;
      setStatus("running");
      rafRef.current = requestAnimationFrame(detectLoop);
    } catch (err) {
      const message =
        err?.name === "NotAllowedError"
          ? "Camera access was denied. You can re-enable it in your browser's site settings."
          : err?.name === "NotFoundError"
            ? "No camera was found on this device."
            : (err?.message ?? "Could not start hand tracking.");
      const wrapped = new Error(message, { cause: err });
      setError(wrapped);
      setStatus("error");
      onErrorRef.current?.(wrapped);
      stop();
      setStatus("error");
    }
  }, [detectLoop, stop]);

  // Never leave the camera light on after unmount.
  useEffect(() => stop, [stop]);

  return { videoRef, status, error, start, stop, isRunning: status === "running" };
}
