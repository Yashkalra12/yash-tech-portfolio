/**
 * Pure geometry for reading gestures out of MediaPipe landmarks.
 *
 * Everything here is a plain function of landmark arrays — no React, no DOM — so
 * it can be reasoned about and tested directly (see `scripts/test-gestures.mjs`).
 * The stateful parts (debouncing, pinch/scroll transitions, momentum) live in
 * HandControlProvider.
 *
 * Hand landmark indices:
 *   0 wrist · 4 thumb tip · 8 index tip · 12 middle · 16 ring · 20 pinky
 *   2/5/9/13/17 the matching MCP knuckles · 9 doubles as palm centre
 */

/** Bone pairs for drawing the hand skeleton. Mirrors MediaPipe's HAND_CONNECTIONS. */
export const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4], // thumb
  [0, 5], [5, 6], [6, 7], [7, 8], // index
  [5, 9], [9, 10], [10, 11], [11, 12], // middle
  [9, 13], [13, 14], [14, 15], [15, 16], // ring
  [13, 17], [17, 18], [18, 19], [19, 20], // pinky
  [0, 17], // palm base
];

/**
 * Face mesh has 478 points, which is far too many to draw legibly in a 200px
 * preview. These are the contours worth showing: the outline, both eyes, lips.
 */
export const FACE_OVAL = [
  10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288,
  397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136,
  172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109, 10,
];
export const LEFT_EYE = [
  362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398, 362,
];
export const RIGHT_EYE = [
  33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246, 33,
];
export const LIPS_OUTER = [
  61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185, 61,
];
/** Landmarks worth marking with a dot: nose, eye corners, mouth corners, crown, chin. */
export const FACE_KEY_POINTS = [4, 1, 33, 263, 61, 291, 10, 152];

/** Thumb-index distance below which a pinch begins (normalised image units). */
export const PINCH_THRESHOLD = 0.05;
/** ...and above which it ends. The gap is hysteresis, so a held pinch cannot flicker. */
export const PINCH_RELEASE_THRESHOLD = 0.08;

const dist2d = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

/**
 * How many fingers are extended, thumb included.
 *
 * Rotation-invariant: a finger is extended when its tip is further from the wrist
 * than its knuckle is. Comparing raw y values instead would break the moment you
 * tilt your hand.
 */
export function countExtendedFingers(landmarks) {
  const wrist = landmarks[0];
  const tips = [4, 8, 12, 16, 20];
  const mcps = [2, 5, 9, 13, 17];

  let count = 0;
  for (let i = 0; i < 5; i += 1) {
    if (dist2d(landmarks[tips[i]], wrist) > dist2d(landmarks[mcps[i]], wrist) * 1.15) count += 1;
  }
  return count;
}

/**
 * A fist is 0–1 extended fingers.
 *
 * Deliberately does *not* look at thumb-index distance: in a closed fist the
 * thumb rests against the curled index finger, which measures exactly like a
 * pinch. Finger extension is the only reliable signal here.
 */
export function isFist(landmarks) {
  return countExtendedFingers(landmarks) <= 1;
}

/**
 * Is the hand pinching — thumb and index tip touching, with the index actually
 * extended?
 *
 * The second condition is what separates a pinch from a fist. In a fist the index
 * tip curls in towards the palm centre; in a pinch it reaches outward to meet the
 * thumb. Without this check every fist reads as a pinch and the page clicks
 * itself.
 */
export function detectPinch(landmarks) {
  if (isFist(landmarks)) return false;
  if (dist2d(landmarks[4], landmarks[8]) >= PINCH_THRESHOLD) return false;

  const palmCentre = landmarks[9];
  const palmSize = dist2d(palmCentre, landmarks[0]);
  const tipToPalm = dist2d(landmarks[8], palmCentre);
  return tipToPalm >= palmSize * 0.4;
}

/** Has a pinch opened far enough to count as released? */
export function isPinchReleased(landmarks) {
  return dist2d(landmarks[4], landmarks[8]) > PINCH_RELEASE_THRESHOLD;
}

/**
 * Turn face landmarks into a head direction in −1..1 on each axis.
 *
 * Uses the nose's offset from the face centre rather than decomposing the
 * transformation matrix: it is far steadier, and it is naturally scale-free once
 * divided by face width and height, so it does not care how close you sit.
 *
 * x is negated to match the mirrored preview; y is not, so dropping your chin
 * (nose below centre) moves the cursor down.
 *
 * @returns {{ x: number, y: number }} clamped to −1..1
 */
export function extractHeadPose(landmarks) {
  const nose = landmarks[4];
  const leftEye = landmarks[263]; // outer corner
  const rightEye = landmarks[33]; // outer corner
  const forehead = landmarks[10];
  const chin = landmarks[152];

  const centreX = (leftEye.x + rightEye.x) / 2;
  const centreY = (forehead.y + chin.y) / 2;
  const faceWidth = Math.abs(leftEye.x - rightEye.x) || 0.1;
  const faceHeight = Math.abs(chin.y - forehead.y) || 0.1;

  const yaw = (nose.x - centreX) / faceWidth;
  const pitch = (nose.y - centreY) / faceHeight;

  // ×3 turns the small offsets a natural head turn produces into full range.
  return {
    x: Math.max(-1, Math.min(1, -yaw * 3)),
    y: Math.max(-1, Math.min(1, pitch * 3)),
  };
}

/** Palm centre as a −1..1 point, mirrored on x to match the preview. */
export function palmPosition(landmarks) {
  const palm = landmarks[9];
  return { x: -(palm.x * 2 - 1), y: palm.y * 2 - 1 };
}
