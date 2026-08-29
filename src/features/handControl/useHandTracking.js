/**
 * Webcam hand tracking via MediaPipe's HandLandmarker.
 *
 * Owns the whole camera lifecycle: request the stream, load the model, run a
 * rAF detection loop, and tear everything down on stop. It reports gestures
 * upward and deliberately knows nothing about scrolling or clicking — that
 * mapping lives in HandControlProvider.
 *
 * Two things this has to get right to work everywhere:
 *
 *   1. The GPU delegate is not always available. Chrome with hardware
 *      acceleration disabled, and plenty of mobile browsers, fail inside
 *      emscripten_webgl_create_context() with a "kGpuService ... was not
 *      provided" graph error. So we try GPU and fall back to CPU.
 *   2. getUserMedia only exists in a secure context. Over plain http on a
 *      phone (hitting a laptop's LAN IP, say) it is simply undefined, which
 *      deserves a better message than "cannot read property getUserMedia".
 *
 * Landmark indices (MediaPipe hand model):
 *   0 wrist · 4 thumb tip · 8 index tip · 12 middle tip · 16 ring tip · 20 pinky tip
 *   5/9/13/17 finger MCP joints · 2 thumb MCP
 */

import { useCallback, useEffect, useRef, useState } from "react";

const WASM_PATH = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

/** Pinch closes when thumb/index distance drops below this (hand-size relative). */
const PINCH_ON = 0.36;
/** ...and only re-opens above this. The gap is hysteresis against flicker. */
const PINCH_OFF = 0.5;

/** Cap inference at ~25/sec; more than that buys no accuracy and costs a lot on CPU. */
const DETECT_INTERVAL_MS = 40;
/** Failing frames in a row before we assume the delegate is broken and rebuild. */
const MAX_FRAME_ERRORS = 12;

/** Bone pairs for drawing the hand skeleton. Mirrors MediaPipe's HAND_CONNECTIONS. */
export const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4], // thumb
  [0, 5], [5, 6], [6, 7], [7, 8], // index
  [9, 10], [10, 11], [11, 12], // middle
  [13, 14], [14, 15], [15, 16], // ring
  [17, 18], [18, 19], [19, 20], // pinky
  [5, 9], [9, 13], [13, 17], [0, 17], // palm
];

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

/**
 * Can this browser actually give out a WebGL2 context?
 *
 * The GPU delegate needs one. When it cannot get one, the failure surfaces from
 * deep inside the wasm graph as `emscripten_webgl_create_context() returned
 * error 0` — so probing here lets us pick CPU up front instead of relying on
 * that error being thrown cleanly. Chrome with hardware acceleration turned off
 * and several mobile browsers land in this branch.
 */
function canUseGpu() {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2");
    if (!gl) return false;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

/**
 * Read a gesture out of one hand's 21 landmarks.
 * Distances are divided by hand span so they hold up as you move nearer to or
 * further from the camera.
 */
function readGesture(landmarks) {
  const wrist = landmarks[0];
  const middleMcp = landmarks[9];
  // Wrist-to-middle-knuckle is a stable proxy for how big the hand appears.
  const span = Math.max(dist(wrist, middleMcp), 1e-4);

  const pinchDistance = dist(landmarks[4], landmarks[8]) / span;

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
    // The index fingertip is the pointer. Mirrored, because the preview is a
    // mirror image — which is what makes moving your hand right feel right.
    pointer: { x: 1 - landmarks[8].x, y: landmarks[8].y },
  };
}

/**
 * @param {object} options
 * @param {(gesture: object) => void} options.onGesture
 * @param {(error: Error) => void} [options.onError]
 */
export default function useHandTracking({ onGesture, onError }) {
  const [status, setStatusState] = useState("idle"); // idle | loading | running | error
  const [error, setError] = useState(null);
  const [delegate, setDelegate] = useState(null); // "GPU" | "CPU", for the UI to show

  const videoRef = useRef(null);
  /** Latest raw landmarks, for the skeleton overlay to draw without re-rendering. */
  const landmarksRef = useRef(null);
  /** `status` readable immediately after awaiting start(), before React re-renders. */
  const statusRef = useRef("idle");

  const landmarkerRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const lastVideoTimeRef = useRef(-1);
  const lastDetectAtRef = useRef(0);
  const pinchingRef = useRef(false);
  const runningRef = useRef(false);
  /** Consecutive failing frames, used to detect a delegate that "started" but cannot run. */
  const frameErrorsRef = useRef(0);
  const delegateRef = useRef(null);
  const rebuildRef = useRef(null);

  // Keep the latest callbacks without restarting the camera when they change.
  const onGestureRef = useRef(onGesture);
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onGestureRef.current = onGesture;
    onErrorRef.current = onError;
  }, [onGesture, onError]);

  const setStatus = useCallback((next) => {
    statusRef.current = next;
    setStatusState(next);
  }, []);

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
    landmarksRef.current = null;
    lastVideoTimeRef.current = -1;
    lastDetectAtRef.current = 0;
    pinchingRef.current = false;
    frameErrorsRef.current = 0;
    delegateRef.current = null;
    rebuildRef.current = null;
    setStatus("idle");
    setDelegate(null);
  }, [setStatus]);

  const detectLoop = useCallback(() => {
    if (!runningRef.current) return;
    const video = videoRef.current;
    const landmarker = landmarkerRef.current;
    const now = performance.now();

    if (video && landmarker && video.readyState >= 2) {
      // MediaPipe rejects a repeated timestamp, so only infer on new frames — and
      // cap the rate, because on the CPU delegate a phone cannot keep up with
      // 60 inferences a second and the whole page starts to stutter.
      if (video.currentTime !== lastVideoTimeRef.current && now - lastDetectAtRef.current >= DETECT_INTERVAL_MS) {
        lastVideoTimeRef.current = video.currentTime;
        lastDetectAtRef.current = now;
        try {
          const result = landmarker.detectForVideo(video, now);
          const landmarks = result?.landmarks?.[0];
          frameErrorsRef.current = 0;

          if (landmarks) {
            landmarksRef.current = landmarks;
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
            landmarksRef.current = null;
            pinchingRef.current = false;
            onGestureRef.current?.({ present: false });
          }
        } catch (err) {
          // A single bad frame should not kill the session.
          if (import.meta.env.DEV) console.warn("[hand] frame failed", err);
          frameErrorsRef.current += 1;
          // A GPU graph can be built successfully and then fail on every frame
          // (the "kGpuService was not provided" case). If nothing is working,
          // rebuild once on the CPU delegate rather than spinning forever.
          if (frameErrorsRef.current === MAX_FRAME_ERRORS && delegateRef.current === "GPU") {
            frameErrorsRef.current = 0;
            rebuildRef.current?.("CPU");
          }
        }
      }
    }

    rafRef.current = requestAnimationFrame(detectLoop);
  }, []);

  /**
   * Build the landmarker, preferring the GPU delegate and falling back to CPU.
   *
   * The GPU failure surfaces asynchronously from inside the wasm graph, so we
   * cannot detect it by feature-testing WebGL up front — we have to attempt it
   * and catch. CPU is slower but works essentially everywhere.
   */
  const createLandmarker = useCallback(async (vision, HandLandmarker) => {
    const options = {
      baseOptions: { modelAssetPath: MODEL_URL },
      runningMode: "VIDEO",
      numHands: 1,
      minHandDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    };

    if (canUseGpu()) {
      try {
        const gpu = await HandLandmarker.createFromOptions(vision, {
          ...options,
          baseOptions: { ...options.baseOptions, delegate: "GPU" },
        });
        return { landmarker: gpu, delegate: "GPU" };
      } catch (gpuError) {
        if (import.meta.env.DEV) {
          console.warn("[hand] GPU delegate failed, falling back to CPU:", gpuError);
        }
      }
    }

    const cpu = await HandLandmarker.createFromOptions(vision, {
      ...options,
      baseOptions: { ...options.baseOptions, delegate: "CPU" },
    });
    return { landmarker: cpu, delegate: "CPU" };
  }, []);

  const start = useCallback(async () => {
    if (runningRef.current) return;

    setError(null);
    setStatus("loading");

    try {
      if (!window.isSecureContext) {
        throw new Error(
          "Cameras are only available over HTTPS. Open this page on https:// or on localhost — on a phone, use the deployed https URL rather than a local IP address.",
        );
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("This browser does not expose a camera API.");
      }

      // Loaded lazily so ~2MB of wasm glue stays out of the initial bundle for
      // the majority of visitors who never turn this on.
      const { FilesetResolver, HandLandmarker } = await import("@mediapipe/tasks-vision");
      const vision = await FilesetResolver.forVisionTasks(WASM_PATH);
      const { landmarker, delegate: used } = await createLandmarker(vision, HandLandmarker);

      // Lets the detection loop swap delegates without re-requesting the camera.
      rebuildRef.current = async (which) => {
        if (import.meta.env.DEV) console.warn(`[hand] rebuilding landmarker on ${which}`);
        try {
          const replacement = await HandLandmarker.createFromOptions(vision, {
            baseOptions: { modelAssetPath: MODEL_URL, delegate: which },
            runningMode: "VIDEO",
            numHands: 1,
            minHandDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5,
          });
          if (!runningRef.current) {
            replacement.close?.();
            return;
          }
          landmarkerRef.current?.close?.();
          landmarkerRef.current = replacement;
          delegateRef.current = which;
          lastVideoTimeRef.current = -1;
          setDelegate(which);
        } catch (err) {
          if (import.meta.env.DEV) console.warn("[hand] rebuild failed", err);
        }
      };

      // `ideal` rather than exact: a phone's front camera may not offer 640x480,
      // and an over-specified constraint is an OverconstrainedError.
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
          frameRate: { ideal: 30 },
        },
        audio: false,
      });

      const video = videoRef.current;
      if (!video) throw new Error("Video element was not mounted.");

      landmarkerRef.current = landmarker;
      streamRef.current = stream;
      video.srcObject = stream;

      // iOS Safari reports readyState 0 until metadata arrives, and calling
      // play() before then can reject. Wait for dimensions, then play.
      if (video.readyState < 1) {
        await new Promise((resolve, reject) => {
          const onLoaded = () => {
            cleanup();
            resolve();
          };
          const onFail = () => {
            cleanup();
            reject(new Error("The camera stream could not be read."));
          };
          const cleanup = () => {
            video.removeEventListener("loadedmetadata", onLoaded);
            video.removeEventListener("error", onFail);
          };
          video.addEventListener("loadedmetadata", onLoaded);
          video.addEventListener("error", onFail);
        });
      }

      await video.play();

      runningRef.current = true;
      frameErrorsRef.current = 0;
      delegateRef.current = used;
      setDelegate(used);
      setStatus("running");
      rafRef.current = requestAnimationFrame(detectLoop);
    } catch (err) {
      const message =
        err?.name === "NotAllowedError"
          ? "Camera access was denied. Re-enable it for this site in your browser settings, then try again."
          : err?.name === "NotFoundError"
            ? "No camera was found on this device."
            : err?.name === "NotReadableError"
              ? "The camera is already in use by another app or tab. Close that and try again."
              : err?.name === "OverconstrainedError"
                ? "This camera does not support the requested video format."
                : (err?.message ?? "Could not start hand tracking.");

      const wrapped = new Error(message, { cause: err });
      stop();
      setError(wrapped);
      setStatus("error");
      onErrorRef.current?.(wrapped);
    }
  }, [createLandmarker, detectLoop, setStatus, stop]);

  // Never leave the camera light on after unmount.
  useEffect(() => stop, [stop]);

  return {
    videoRef,
    landmarksRef,
    statusRef,
    status,
    error,
    delegate,
    start,
    stop,
    isRunning: status === "running",
  };
}
