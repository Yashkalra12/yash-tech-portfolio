/**
 * Webcam hand tracking via MediaPipe's HandLandmarker.
 *
 * Owns the whole camera lifecycle: request the stream, load the model, run a
 * rAF detection loop, and tear everything down on stop. It reports gestures
 * upward and deliberately knows nothing about scrolling or clicking — that
 * mapping lives in HandControlProvider.
 *
 * Three things this has to get right to work everywhere:
 *
 *   1. The GPU delegate is not always usable. Chrome with hardware acceleration
 *      disabled, and plenty of mobile browsers, fail inside
 *      emscripten_webgl_create_context() with a "kGpuService ... was not
 *      provided" graph error.
 *
 *      Crucially, that failure is often *not* a thrown exception: the graph is
 *      built fine, the error is logged from wasm, and detectForVideo then
 *      quietly returns an empty result on every single frame. So the fallback
 *      cannot rely on catching anything — instead we watch for "the delegate has
 *      produced no detection at all in the first few seconds" and rebuild on
 *      CPU. That is the case that made this feature look like the camera worked
 *      but tracking did nothing.
 *
 *   2. getUserMedia only exists in a secure context. Over plain http on a phone
 *      (hitting a laptop's LAN IP, say) it is simply undefined.
 *
 *   3. iOS Safari needs metadata before play(), and rejects over-specified
 *      video constraints.
 *
 * Landmark indices (MediaPipe hand model):
 *   0 wrist · 4 thumb tip · 8 index tip · 12 middle tip · 16 ring tip · 20 pinky tip
 *   5/9/13/17 finger MCP joints · 2 thumb MCP
 */

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Served from our own origin, copied out of the installed package by
 * `scripts/copy-mediapipe-wasm.mjs`. Loading these from a CDN pins a version
 * independently of the JS glue we import, and a mismatch there produces a graph
 * that builds happily and then never detects anything.
 */
const WASM_PATH = `${import.meta.env.BASE_URL}mediapipe/wasm`;
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
/**
 * How long the GPU delegate gets to produce its first detection before we assume
 * its graph is silently dead and switch to CPU. Long enough for the visitor to
 * get a hand into frame, short enough not to feel broken.
 */
const GPU_PROBE_MS = 2500;

/** Bone pairs for drawing the hand skeleton. Mirrors MediaPipe's HAND_CONNECTIONS. */
export const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4], // thumb
  [0, 5], [5, 6], [6, 7], [7, 8], // index
  [9, 10], [10, 11], [11, 12], // middle
  [13, 14], [14, 15], [15, 16], // ring
  [17, 18], [18, 19], [19, 20], // pinky
  [5, 9], [9, 13], [13, 17], [0, 17], // palm
];

/** Model options shared by both delegates. */
const MODEL_OPTIONS = {
  runningMode: "VIDEO",
  numHands: 1,
  // Deliberately permissive. The defaults (0.5) drop a lot of real hands in the
  // dim, off-angle, half-cropped conditions of an actual laptop webcam, and a
  // jittery skeleton is far better feedback than no skeleton.
  minHandDetectionConfidence: 0.3,
  minHandPresenceConfidence: 0.3,
  minTrackingConfidence: 0.3,
};

const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

/**
 * Can this browser actually give out a WebGL2 context?
 *
 * A cheap pre-filter for the GPU delegate. It is necessary but not sufficient —
 * MediaPipe creates its own context inside wasm and can fail even when this
 * passes, which is what the GPU_PROBE_MS watchdog below is for.
 */
function canUseGpu() {
  if (new URLSearchParams(window.location.search).has("handcpu")) return false; // debug override
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
  /**
   * Live counters for the on-screen readout. Written every frame, so they live in
   * a ref — the preview reads them from its own animation frame.
   */
  const statsRef = useRef({ inferences: 0, detections: 0, fps: 0, delegate: null });

  const landmarkerRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const lastVideoTimeRef = useRef(-1);
  const lastDetectAtRef = useRef(0);
  const pinchingRef = useRef(false);
  const runningRef = useRef(false);
  /** Consecutive failing frames, used to detect a delegate that throws every frame. */
  const frameErrorsRef = useRef(0);
  const delegateRef = useRef(null);
  const rebuildRef = useRef(null);
  const startedAtRef = useRef(0);
  /** Set once the GPU watchdog has fired, so it never fires twice. */
  const gpuGaveUpRef = useRef(false);
  const fpsWindowRef = useRef({ at: 0, count: 0 });

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
    gpuGaveUpRef.current = false;
    startedAtRef.current = 0;
    statsRef.current = { inferences: 0, detections: 0, fps: 0, delegate: null };
    setStatus("idle");
    setDelegate(null);
  }, [setStatus]);

  const detectLoop = useCallback(() => {
    if (!runningRef.current) return;
    rafRef.current = requestAnimationFrame(detectLoop);

    const video = videoRef.current;
    const landmarker = landmarkerRef.current;
    if (!video || !landmarker || video.readyState < 2 || !video.videoWidth) return;

    const now = performance.now();
    const stats = statsRef.current;

    // The GPU graph can be built successfully and then never produce anything —
    // no exception, just empty results forever. If we have run for a while with
    // zero detections, stop trusting it and rebuild on CPU.
    if (
      !gpuGaveUpRef.current &&
      delegateRef.current === "GPU" &&
      stats.detections === 0 &&
      now - startedAtRef.current > GPU_PROBE_MS
    ) {
      gpuGaveUpRef.current = true;
      rebuildRef.current?.("CPU");
      return;
    }

    // MediaPipe rejects a repeated timestamp, so only infer on new frames — and
    // cap the rate, because on the CPU delegate a phone cannot keep up with
    // 60 inferences a second and the whole page starts to stutter.
    if (video.currentTime === lastVideoTimeRef.current) return;
    if (now - lastDetectAtRef.current < DETECT_INTERVAL_MS) return;
    lastVideoTimeRef.current = video.currentTime;
    lastDetectAtRef.current = now;

    try {
      const result = landmarker.detectForVideo(video, now);
      const landmarks = result?.landmarks?.[0];
      frameErrorsRef.current = 0;

      stats.inferences += 1;
      const fpsWindow = fpsWindowRef.current;
      fpsWindow.count += 1;
      if (now - fpsWindow.at >= 1000) {
        stats.fps = Math.round((fpsWindow.count * 1000) / (now - fpsWindow.at));
        fpsWindow.at = now;
        fpsWindow.count = 0;
      }

      if (landmarks?.length) {
        stats.detections += 1;
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
      frameErrorsRef.current += 1;
      // Log the first few unconditionally: if tracking is dead in production
      // this is the only clue anyone will have.
      if (frameErrorsRef.current <= 3) console.warn("[hand] inference failed", err);
      if (frameErrorsRef.current >= MAX_FRAME_ERRORS && !gpuGaveUpRef.current) {
        gpuGaveUpRef.current = true;
        rebuildRef.current?.("CPU");
      }
    }
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

      const build = (which) =>
        HandLandmarker.createFromOptions(vision, {
          ...MODEL_OPTIONS,
          baseOptions: { modelAssetPath: MODEL_URL, delegate: which },
        });

      let landmarker = null;
      let used = "CPU";
      if (canUseGpu()) {
        try {
          landmarker = await build("GPU");
          used = "GPU";
        } catch (gpuError) {
          console.warn("[hand] GPU delegate failed to build, using CPU:", gpuError);
        }
      }
      if (!landmarker) landmarker = await build("CPU");

      // Lets the detection loop swap delegates without re-requesting the camera.
      rebuildRef.current = async (which) => {
        console.warn(`[hand] switching to the ${which} delegate`);
        try {
          const replacement = await build(which);
          if (!runningRef.current) {
            replacement.close?.();
            return;
          }
          landmarkerRef.current?.close?.();
          landmarkerRef.current = replacement;
          delegateRef.current = which;
          statsRef.current.delegate = which;
          lastVideoTimeRef.current = -1;
          frameErrorsRef.current = 0;
          startedAtRef.current = performance.now();
          setDelegate(which);
        } catch (err) {
          console.warn("[hand] delegate switch failed", err);
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
          const cleanup = () => {
            video.removeEventListener("loadedmetadata", onLoaded);
            video.removeEventListener("error", onFail);
          };
          const onLoaded = () => {
            cleanup();
            resolve();
          };
          const onFail = () => {
            cleanup();
            reject(new Error("The camera stream could not be read."));
          };
          video.addEventListener("loadedmetadata", onLoaded);
          video.addEventListener("error", onFail);
        });
      }

      await video.play();

      runningRef.current = true;
      frameErrorsRef.current = 0;
      gpuGaveUpRef.current = false;
      delegateRef.current = used;
      startedAtRef.current = performance.now();
      fpsWindowRef.current = { at: performance.now(), count: 0 };
      statsRef.current = { inferences: 0, detections: 0, fps: 0, delegate: used };
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
  }, [detectLoop, setStatus, stop]);

  // Never leave the camera light on after unmount.
  useEffect(() => stop, [stop]);

  return {
    videoRef,
    landmarksRef,
    statusRef,
    statsRef,
    status,
    error,
    delegate,
    start,
    stop,
    isRunning: status === "running",
  };
}
