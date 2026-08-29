/**
 * Unit tests for src/features/handControl/gestures.js.
 *
 * Gesture geometry is the one part of hand control that can be tested without a
 * camera, a GPU or a DOM — and it is also the part where a wrong threshold shows up
 * as "the page randomly clicks itself", which is miserable to debug live. So the
 * traps get pinned down here: fist-versus-pinch confusion, the release hysteresis
 * band, and the sign of the head-pose axes.
 *
 * Run with: node scripts/test-gestures.mjs
 */

import {
  countExtendedFingers,
  detectPinch,
  extractHeadPose,
  isFist,
  isPinchReleased,
  palmPosition,
  PINCH_RELEASE_THRESHOLD,
  PINCH_THRESHOLD,
} from "../src/features/handControl/gestures.js";

let failures = 0;

function check(name, condition) {
  if (condition) {
    console.log(`  ok   ${name}`);
  } else {
    failures += 1;
    console.error(`  FAIL ${name}`);
  }
}

function near(name, actual, expected, tolerance = 1e-6) {
  check(`${name} (${actual.toFixed(4)} ≈ ${expected})`, Math.abs(actual - expected) <= tolerance);
}

const WRIST = { x: 0.5, y: 0.9 };
/** Fanned-out directions for thumb → pinky, in radians from straight up. */
const FINGER_ANGLES = [-1.0, -0.35, 0, 0.35, 0.7];
const MCP_LENGTH = 0.1;
const EXTENDED_LENGTH = 0.22;
/** Short enough that tip distance < mcp distance × 1.15, i.e. reads as curled. */
const CURLED_LENGTH = 0.08;

/**
 * Build a 21-landmark hand.
 *
 * @param {boolean[]} extended five flags, thumb → pinky
 * @param {Record<number, {x:number,y:number}>} [overrides] landmark index → position
 */
function makeHand(extended, overrides = {}) {
  const landmarks = new Array(21);
  landmarks[0] = { ...WRIST, z: 0 };

  FINGER_ANGLES.forEach((angle, finger) => {
    const dx = Math.sin(angle);
    const dy = -Math.cos(angle);
    const tipLength = extended[finger] ? EXTENDED_LENGTH : CURLED_LENGTH;
    // Each finger owns four landmarks; index 1 of the four is the MCP knuckle used
    // by countExtendedFingers (2 for the thumb, per MediaPipe's numbering).
    const base = 1 + finger * 4;
    const mcpSlot = finger === 0 ? base + 1 : base;
    for (let joint = 0; joint < 4; joint += 1) {
      const slot = base + joint;
      const length = slot === mcpSlot ? MCP_LENGTH : (tipLength * (joint + 1)) / 4;
      landmarks[slot] = { x: WRIST.x + dx * length, y: WRIST.y + dy * length, z: 0 };
    }
    // Force the MCP and the tip to their exact lengths; the interpolation above only
    // needs to put the intermediate joints somewhere plausible.
    landmarks[mcpSlot] = { x: WRIST.x + dx * MCP_LENGTH, y: WRIST.y + dy * MCP_LENGTH, z: 0 };
    landmarks[base + 3] = { x: WRIST.x + dx * tipLength, y: WRIST.y + dy * tipLength, z: 0 };
  });

  Object.entries(overrides).forEach(([index, point]) => {
    landmarks[Number(index)] = { z: 0, ...point };
  });
  return landmarks;
}

const ALL = [true, true, true, true, true];
const NONE = [false, false, false, false, false];

console.log("\nopen hand");
{
  const hand = makeHand(ALL);
  check("counts five extended fingers", countExtendedFingers(hand) === 5);
  check("is not a fist", !isFist(hand));
  check("is not pinching", !detectPinch(hand));
  check("reads as released", isPinchReleased(hand));
}

console.log("\nfist");
{
  const hand = makeHand(NONE);
  check("counts no extended fingers", countExtendedFingers(hand) === 0);
  check("is a fist", isFist(hand));
  check("is not pinching", !detectPinch(hand));
}

console.log("\nfist with the thumb resting on the curled index finger");
{
  // The trap: thumb and index tips are touching, so a pure distance check calls this
  // a pinch and every closed hand fires a click.
  const hand = makeHand(NONE);
  const indexTip = hand[8];
  hand[4] = { x: indexTip.x + 0.005, y: indexTip.y + 0.005, z: 0 };
  check("thumb and index are within the pinch distance", Math.hypot(hand[4].x - indexTip.x, hand[4].y - indexTip.y) < PINCH_THRESHOLD);
  check("still classified as a fist", isFist(hand));
  check("is NOT reported as a pinch", !detectPinch(hand));
}

console.log("\npinch");
{
  // Thumb and index extended and touching; the other three curled.
  const hand = makeHand([true, true, false, false, false]);
  const indexTip = hand[8];
  hand[4] = { x: indexTip.x + 0.02, y: indexTip.y, z: 0 };
  check("counts two extended fingers", countExtendedFingers(hand) === 2);
  check("is not a fist", !isFist(hand));
  check("is pinching", detectPinch(hand));
  check("is not yet released", !isPinchReleased(hand));
}

console.log("\nhysteresis band between the pinch and release thresholds");
{
  const hand = makeHand([true, true, false, false, false]);
  const indexTip = hand[8];
  const gap = (PINCH_THRESHOLD + PINCH_RELEASE_THRESHOLD) / 2; // 0.065
  hand[4] = { x: indexTip.x + gap, y: indexTip.y, z: 0 };
  // Neither condition fires here, which is the whole point: a hand hovering at the
  // boundary holds its previous state instead of flickering click/release.
  check("does not start a pinch", !detectPinch(hand));
  check("does not report a release", !isPinchReleased(hand));
}

console.log("\nhead pose");
{
  const face = [];
  const setFace = ({ nose, forehead = { x: 0.5, y: 0.3 }, chin = { x: 0.5, y: 0.7 } }) => {
    face[4] = nose;
    face[263] = { x: 0.6, y: 0.5 }; // left eye outer corner
    face[33] = { x: 0.4, y: 0.5 }; // right eye outer corner
    face[10] = forehead;
    face[152] = chin;
    return face;
  };

  const centred = extractHeadPose(setFace({ nose: { x: 0.5, y: 0.5 } }));
  near("centred head yields x = 0", centred.x, 0);
  near("centred head yields y = 0", centred.y, 0);

  // Nose right of centre in image space is the visitor turning to *their* left; the
  // preview is mirrored, so the cursor must go left — a negative x.
  const noseRight = extractHeadPose(setFace({ nose: { x: 0.52, y: 0.5 } }));
  check(`turning right moves the cursor left (x = ${noseRight.x.toFixed(3)})`, noseRight.x < 0);

  // Chin down puts the nose below centre, and the cursor should follow downward.
  const noseDown = extractHeadPose(setFace({ nose: { x: 0.5, y: 0.55 } }));
  check(`looking down moves the cursor down (y = ${noseDown.y.toFixed(3)})`, noseDown.y > 0);

  const extreme = extractHeadPose(setFace({ nose: { x: 0.99, y: 0.99 } }));
  check("x stays clamped to 1", Math.abs(extreme.x) <= 1);
  check("y stays clamped to 1", Math.abs(extreme.y) <= 1);

  // Sitting twice as far from the camera halves every offset, but normalising by
  // face size means the same head turn must still report the same direction.
  const near1 = extractHeadPose(setFace({ nose: { x: 0.52, y: 0.5 } }));
  face[263] = { x: 0.55, y: 0.5 };
  face[33] = { x: 0.45, y: 0.5 };
  face[10] = { x: 0.5, y: 0.4 };
  face[152] = { x: 0.5, y: 0.6 };
  face[4] = { x: 0.51, y: 0.5 };
  const far = extractHeadPose(face);
  near("scale-invariant: same turn at half the face size gives the same x", far.x, near1.x, 1e-9);
}

console.log("\npalm position");
{
  const hand = makeHand(ALL, { 9: { x: 0.75, y: 0.25 } });
  const palm = palmPosition(hand);
  // Mirrored on x: a palm in the right half of the *image* is the visitor's hand on
  // their left, so it maps to the negative half.
  near("x is mirrored into −1..1", palm.x, -0.5);
  near("y maps straight into −1..1", palm.y, -0.5);
}

console.log(failures === 0 ? "\nAll gesture tests passed.\n" : `\n${failures} test(s) failed.\n`);
process.exit(failures === 0 ? 0 : 1);
