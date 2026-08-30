/**
 * Built-in terminal commands.
 *
 * Anything that is not a command falls through to the RAG pipeline, so the
 * terminal is usable both as a shell ("projects", "whoami") and as a chat
 * ("what did he do at Lumio?").
 */

import {
  identity,
  socials,
  experience,
  projects,
  education,
  skillGroups,
} from "../../data/profile";
import { sections } from "./knowledge";

/** @typedef {{ type: 'text' | 'list' | 'links' | 'clear' | 'answer', body?: any }} CommandResult */

const bullet = (lines) => ({ type: "list", body: lines });

/** @type {Record<string, { help: string, run: (args: string) => CommandResult }>} */
export const commands = {
  help: {
    help: "list every command",
    run: () =>
      bullet([
        "Commands you can run:",
        ...Object.entries(commands).map(([name, c]) => `  ${name.padEnd(12)} ${c.help}`),
        "",
        `Or just ask a question in plain English — I search ${sections.length} sections of Yash's knowledge base.`,
        '  e.g. "what did he build at Munshot?"  ·  "does he know typescript?"  ·  "is he open to relocating?"',
      ]),
  },

  whoami: {
    help: "who is Yash Kalra",
    run: () =>
      bullet([
        identity.name,
        identity.headline,
        "",
        identity.blurb,
        "",
        `Location   ${identity.location}`,
        `Status     ${identity.relocation}`,
      ]),
  },

  experience: {
    help: "work history",
    run: () =>
      bullet(
        experience.flatMap((job) => [
          `${job.role} · ${job.company}`,
          `  ${[job.type, job.duration, job.place].filter(Boolean).join(" · ")}`,
          ...job.highlights.map((h) => `  - ${h}`),
          "",
        ]),
      ),
  },

  projects: {
    help: "things Yash has shipped",
    run: () =>
      bullet(
        projects.flatMap((p) => [
          `${p.title}  ${p.src}`,
          `  ${p.description}`,
          `  stack: ${p.stack.join(", ")}`,
          "",
        ]),
      ),
  },

  skills: {
    help: "tech stack by area",
    run: () => bullet(skillGroups.map(([group, items]) => `${group.padEnd(12)} ${items}`)),
  },

  education: {
    help: "schools and grades",
    run: () =>
      bullet(
        education.flatMap((e) => [`${e.degree}`, `  ${e.school} · ${e.date} · ${e.grade}`, ""]),
      ),
  },

  contact: {
    help: "how to reach Yash",
    run: () => ({
      type: "links",
      body: socials.map((s) => ({ label: s.label, handle: s.handle, href: s.href })),
    }),
  },

  resume: {
    help: "open the resume",
    run: () => ({
      type: "links",
      body: [{ label: "Resume", handle: "open in Google Drive", href: identity.resume }],
    }),
  },

  clear: {
    help: "clear the screen",
    run: () => ({ type: "clear" }),
  },
};

export const commandNames = Object.keys(commands);

/**
 * Resolve raw input to a command, if it looks like one.
 * A bare word that matches a command name wins; a question never does, so
 * "what are your projects?" still goes to retrieval rather than to `projects`.
 *
 * @param {string} input
 * @returns {{ name: string, args: string } | null}
 */
export function parseCommand(input) {
  const trimmed = input.trim().replace(/^\//, "");
  if (!trimmed || /[?]/.test(trimmed)) return null;

  const [head, ...rest] = trimmed.toLowerCase().split(/\s+/);
  if (!Object.hasOwn(commands, head)) return null;

  // "projects" is a command; "projects that use react" is a question.
  if (rest.length > 1) return null;

  return { name: head, args: rest.join(" ") };
}

export const suggestions = [
  "whoami",
  "What did he do at Lumio AI?",
  "Does he know TypeScript?",
  "Is he open to relocating?",
  "projects",
  "What is his CGPA?",
  "contact",
];
