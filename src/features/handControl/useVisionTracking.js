/**
 * Webcam face + hand tracking via MediaPipe's FaceLandmarker and HandLandmarker.
 *
 * Owns the whole camera lifecycle: request the stream, load both models, run one
 * rAF loop over the same video, and tear everything down on stop. It reports raw
 * landmarks upward and knows nothing about cursors, clicking or scrolling — that
 * mapping lives in HandControlProvider.
 *
 * Two models, two different budgets. Hands drive gestures, so they run on every
 * frame; the face only steers the cursor, which tolerates half the rate, so it
 * runs on alternate frames. That keeps the pair affordable on one CPU core.
 *
 * Three things this has to get right to work everywhere:
 *
 *   1. The GPU delegate is not always usable. Chrome with hardware acceleration
 *      disabled, and plenty of mobile browsers, fail inside
 *      emscripten_webgl_create_context() with a "kGpuService ... was not
 *      provided" graph error.
 *
 *      Crucially, that failure is often *not* a thrown exception: the graph is
 *      built, the error is logged from wasm, and detectForVideo then quietly
 *      returns an empty result on every frame. So the fallback cannot rely on
 *      catching anything — instead we watch for "produced no detection at all in
 *      the first few seconds" and rebuild on CPU.
 *
 *   2. getUserMedia only exists in a secure context. Over plain http on a phone
 *      (hitting a laptop's LAN IP, say) it is simply undefined.
 *
 *   3. iOS Safari needs metadata before play(), and rejects over-specified video
 *      constraints.
 */

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Served from our own origin, copied out of the installed package by
 * `scripts/copy-mediapipe-wasm.mjs`. Loading these from a CDN pins a version
 * independently of the JS glue we import, and a mismatch there produces a graph
 * that builds happily and then never detects anything.
 */
const WASM_PATH = `${import.meta.env.BASE_URL}mediapipe/wasm`;
const HAND_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";
const FACE_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

/** Cap inference at ~30/sec; more buys no accuracy and costs a lot on CPU. */
const DETECT_INTERVAL_MS = 33;
/**
 * How long a delegate gets to produce its first detection before we assume its
 * graph is silently dead and switch to CPU. Long enough to get a hand or face
 * into frame, short enough not to feel broken.
 */
const PROBE_MS = 3000;
/** Failing frames in a row before we assume the delegate throws on everything. */
const MAX_FRAME_ERRORS = 12;
/** Track two hands — either one can drive a gesture, so neither is favoured. */
const MAX_HANDS = 2;

/**
 * Can this browser actually give out a WebGL2 context?
 *
 * A cheap pre-filter for the GPU delegate. Necessary but not sufficient —
 * MediaPipe creates its own context inside wasm and can fail even when this
 * passes, which is what the PROBE_MS watchdog is for.
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
 * @param {object} options
 * @param {(frame: { hands: object[][], face: object[]|null }) => void} options.onFrame
 *   Called once per inferred frame with the raw landmarks.
 * @param {() => void} [options.onLost] Called when tracking loses every hand.
 */
export default function useVisionTracking({ onFrame, onLost }) {
  const [status, setStatusState] = useState("idle"); // idle | loading | running | error
  const [error, setError] = useState(null);
  const [delegate, setDelegate] = useState(null); // "GPU" | "CPU", for the UI to show
  const [progress, setProgress] = useState(0); // 0-100 while models download

  const videoRef = useRef(null);
  /** Latest raw landmarks, for the preview overlay to draw without re-rendering. */
  const handLandmarksRef = useRef([]);
  const faceLandmarksRef = useRef(null);
  /** `status` readable immediately after awaiting start(), before React re-renders. */
  const statusRef = useRef("idle");
  /** Live counters for the on-screen readout, written every frame. */
  const statsRef = useRef({ inferences: 0, detections: 0, fps: 0, delegate: null });

  const handLandmarkerRef = useRef(null);
  const faceLandmarkerRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const frameCountRef = useRef(0);
  const lastDetectAtRef = useRef(0);
  const runningRef = useRef(false);
  const frameErrorsRef = useRef(0);
  const delegateRef = useRef(null);
  const rebuildRef = useRef(null);
  const startedAtRef = useRef(0);
  const gaveUpOnGpuRef = useRef(false);
  const fpsWindowRef = useRef({ at: 0, count: 0 });

  // Keep the latest callbacks without restarting the camera when they change.
  const onFrameRef = useRef(onFrame);
  const onLostRef = useRef(onLost);
  useEffect(() => {
    onFrameRef.current = onFrame;
    onLostRef.current = onLost;
  }, [onFrame, onLost]);

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
    handLandmarkerRef.current?.close?.();
    faceLandmarkerRef.current?.close?.();
    handLandmarkerRef.current = null;
    faceLandmarkerRef.current = null;
    handLandmarksRef.current = [];
    faceLandmarksRef.current = null;
    frameCountRef.current = 0;
    lastDetectAtRef.current = 0;
    frameErrorsRef.current = 0;
    delegateRef.current = null;
    rebuildRef.current = null;
    gaveUpOnGpuRef.current = false;
    startedAtRef.current = 0;
    statsRef.current = { inferences: 0, detections: 0, fps: 0, delegate: null };
    setStatus("idle");
    setDelegate(null);
    setProgress(0);
  }, [setStatus]);

  const detectLoop = useCallback(() => {
    if (!runningRef.current) return;
    rafRef.current = requestAnimationFrame(detectLoop);

    const video = videoRef.current;
    const hands = handLandmarkerRef.current;
    if (!video || !hands || video.readyState < 2 || !video.videoWidth) return;

    const now = performance.now();
    const stats = statsRef.current;

    // A GPU graph can be built successfully and then never produce anything — no
    // exception, just empty results forever. If we have run for a while with zero
    // detections, stop trusting it and rebuild on CPU.
    if (
      !gaveUpOnGpuRef.current &&
      delegateRef.current === "GPU" &&
      stats.detections === 0 &&
      now - startedAtRef.current > PROBE_MS
    ) {
      gaveUpOnGpuRef.current = true;
      rebuildRef.current?.("CPU");
      return;
    }

    if (now - lastDetectAtRef.current < DETECT_INTERVAL_MS) return;
    lastDetectAtRef.current = now;
    frameCountRef.current += 1;

    try {
      // Hands every frame: gestures need to feel immediate.
      const handResult = hands.detectForVideo(video, now);
      const handLandmarks = (handResult?.landmarks ?? []).slice(0, MAX_HANDS);
      handLandmarksRef.current = handLandmarks;

      // Face on alternate frames. Cursor steering tolerates ~15fps, and this is
      // the more expensive of the two models.
      const face = faceLandmarkerRef.current;
      if (face && frameCountRef.current % 2 === 0) {
        // MediaPipe rejects a timestamp it has already seen for a given graph, and
        // each landmarker keeps its own clock — but they share `now`, so nudge the
        // face one forward to keep both strictly increasing.
        const faceResult = face.detectForVideo(video, now + 1);
        faceLandmarksRef.current = faceResult?.faceLandmarks?.[0] ?? null;
      }

      frameErrorsRef.current = 0;
      stats.inferences += 1;
      if (handLandmarks.length || faceLandmarksRef.current) stats.detections += 1;

      const fpsWindow = fpsWindowRef.current;
      fpsWindow.count += 1;
      if (now - fpsWindow.at >= 1000) {
        stats.fps = Math.round((fpsWindow.count * 1000) / (now - fpsWindow.at));
        fpsWindow.at = now;
        fpsWindow.count = 0;
      }

      onFrameRef.current?.({ hands: handLandmarks, face: faceLandmarksRef.current });
      if (!handLandmarks.length) onLostRef.current?.();
    } catch (err) {
      frameErrorsRef.current += 1;
      // Log the first few unconditionally: if tracking is dead in production this
      // is the only clue anyone will have.
      if (frameErrorsRef.current <= 3) console.warn("[vision] inference failed", err);
      if (frameErrorsRef.current >= MAX_FRAME_ERRORS && !gaveUpOnGpuRef.current) {
        gaveUpOnGpuRef.current = true;
        rebuildRef.current?.("CPU");
      }
    }
  }, []);

  const start = useCallback(async () => {
    if (runningRef.current) return;

    setError(null);
    setStatus("loading");
    setProgress(5);

    try {
      if (!window.isSecureContext) {
        throw new Error(
          "Cameras are only available over HTTPS. Open this page on https:// or on localhost — on a phone, use the deployed https URL rather than a local IP address.",
        );
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("This browser does not expose a camera API.");
      }

      // Loaded lazily so ~2MB of wasm glue stays out of the initial bundle for the
      // majority of visitors who never turn this on.
      const { FilesetResolver, HandLandmarker, FaceLandmarker } = await import(
        "@mediapipe/tasks-vision"
      );
      setProgress(15);
      const vision = await FilesetResolver.forVisionTasks(WASM_PATH);
      setProgress(30);

      const buildHands = (which) =>
        HandLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: HAND_MODEL_URL, delegate: which },
          runningMode: "VIDEO",
          numHands: MAX_HANDS,
          // Deliberately permissive: the 0.5 defaults drop a lot of real hands in
          // the dim, off-angle light of an actual laptop webcam.
          minHandDetectionConfidence: 0.3,
          minHandPresenceConfidence: 0.3,
          minTrackingConfidence: 0.3,
        });

      const buildFace = (which) =>
        FaceLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: FACE_MODEL_URL, delegate: which },
          runningMode: "VIDEO",
          numFaces: 1,
          outputFaceBlendshapes: false,
          outputFacialTransformationMatrixes: false,
        });

      const buildBoth = async (which) => {
        const hands = await buildHands(which);
        setProgress(which === "GPU" ? 65 : 70);
        const face = await buildFace(which);
        return { hands, face };
      };

      let built = null;
      let used = "CPU";
      if (canUseGpu()) {
        try {
          built = await buildBoth("GPU");
          used = "GPU";
        } catch (gpuError) {
          console.warn("[vision] GPU delegate failed to build, using CPU:", gpuError);
          built = null;
        }
      }
      if (!built) built = await buildBoth("CPU");
      setProgress(85);

      // Lets the detection loop swap delegates without re-requesting the camera.
      rebuildRef.current = async (which) => {
        console.warn(`[vision] switching to the ${which} delegate`);
        try {
          const replacement = await buildBoth(which);
          if (!runningRef.current) {
            replacement.hands.close?.();
            replacement.face.close?.();
            return;
          }
          handLandmarkerRef.current?.close?.();
          faceLandmarkerRef.current?.close?.();
          handLandmarkerRef.current = replacement.hands;
          faceLandmarkerRef.current = replacement.face;
          delegateRef.current = which;
          statsRef.current.delegate = which;
          frameErrorsRef.current = 0;
          startedAtRef.current = performance.now();
          setDelegate(which);
        } catch (err) {
          console.warn("[vision] delegate switch failed", err);
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

      handLandmarkerRef.current = built.hands;
      faceLandmarkerRef.current = built.face;
      streamRef.current = stream;
      video.srcObject = stream;

      // iOS Safari reports readyState 0 until metadata arrives, and calling play()
      // before then can reject. Wait for dimensions, then play.
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
      gaveUpOnGpuRef.current = false;
      frameCountRef.current = 0;
      delegateRef.current = used;
      startedAtRef.current = performance.now();
      fpsWindowRef.current = { at: performance.now(), count: 0 };
      statsRef.current = { inferences: 0, detections: 0, fps: 0, delegate: used };
      setDelegate(used);
      setProgress(100);
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
                : (err?.message ?? "Could not start tracking.");

      const wrapped = new Error(message, { cause: err });
      stop();
      setError(wrapped);
      setStatus("error");
    }
  }, [detectLoop, setStatus, stop]);

  // Never leave the camera light on after unmount.
  useEffect(() => stop, [stop]);

  return {
    videoRef,
    handLandmarksRef,
    faceLandmarksRef,
    statusRef,
    statsRef,
    status,
    error,
    delegate,
    progress,
    start,
    stop,
    isRunning: status === "running",
  };
}
