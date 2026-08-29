/**
 * Copies MediaPipe's wasm runtime out of node_modules and into
 * `public/mediapipe/wasm`, so it is served from our own origin.
 *
 * Why not just point FilesetResolver at a CDN? Because the JS glue that loads
 * these binaries comes from the installed `@mediapipe/tasks-vision` package, and
 * a CDN URL pins a version independently. When the two drift apart the graph can
 * build without complaint and then detect nothing at all — a silent failure that
 * looks exactly like a broken camera. Copying from the installed package makes a
 * mismatch impossible, and drops a third-party runtime dependency at page load.
 *
 * Run by `predev` and `prebuild`. The output is derived, so it is gitignored.
 */

import { cp, mkdir, readdir, stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "node_modules", "@mediapipe", "tasks-vision", "wasm");
const destination = join(root, "public", "mediapipe", "wasm");

try {
  await stat(source);
} catch {
  console.error(
    `[mediapipe] ${source} is missing — run \`npm install\` before building.\n` +
      "Hand tracking will not work until it exists.",
  );
  process.exit(1);
}

await mkdir(destination, { recursive: true });
await cp(source, destination, { recursive: true });

const files = await readdir(destination);
console.log(`[mediapipe] copied ${files.length} runtime files to public/mediapipe/wasm`);
