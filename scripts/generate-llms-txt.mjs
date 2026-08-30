/**
 * Generates `public/llms.txt` from `src/data/profile.js`.
 *
 * llms.txt is a proposed convention (https://llmstxt.org) for serving a clean,
 * plain-text summary of a site at a well-known path, so that language models
 * and their crawlers read curated prose instead of scraping the DOM. Run via
 * `npm run llms`; it is also wired into `npm run build` so the deployed file can
 * never drift from the profile data.
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");

const {
  identity,
  socials,
  skillGroups,
  skills,
  experience,
  projects,
  education,
  extraFacts,
} = await import(resolve(root, "src/data/profile.js"));

const out = [];
const h = (level, text) => out.push(`${"#".repeat(level)} ${text}`, "");
const p = (text) => out.push(text, "");
const li = (items) => out.push(...items.map((i) => `- ${i}`), "");

h(1, identity.name);
p(`> ${identity.tagline} — ${identity.headline}`);
p(identity.blurb);

h(2, "At a glance");
li([
  `**Name**: ${identity.name}`,
  `**Role**: ${identity.tagline}`,
  `**Location**: ${identity.location}`,
  `**Availability**: ${identity.relocation}`,
  `**Currently learning**: ${identity.learning.join(", ")}`,
  `**Resume**: ${identity.resume}`,
]);

h(2, "About");
identity.about.forEach(p);

h(2, "Experience");
experience.forEach((job) => {
  h(3, `${job.role} — ${job.company} (${job.duration})`);
  const meta = [job.type, job.place].filter(Boolean);
  if (meta.length) p(meta.join(" · "));
  li(job.highlights);
  p(`More about the company: ${job.link}`);
});

h(2, "Projects");
projects.forEach((project) => {
  h(3, project.title);
  p(project.description);
  li([
    `**Stack**: ${project.stack.join(", ")}`,
    `**Live**: ${project.src}`,
    `**Source**: ${project.github}`,
  ]);
});

h(2, "Skills");
li(skillGroups.map(([group, items]) => `**${group}**: ${items}`));
p(`Full list: ${skills.map((s) => s.title).join(", ")}.`);

h(2, "Education");
education.forEach((edu) => {
  h(3, edu.school);
  li([
    `**Degree**: ${edu.degree}`,
    `**Dates**: ${edu.date}`,
    `**Grade**: ${edu.grade}`,
    `**Place**: ${edu.place}`,
  ]);
  if (edu.desc) p(edu.desc);
});

h(2, "More");
extraFacts.forEach((fact) => {
  h(3, fact.topic);
  p(fact.text);
});

h(2, "Contact");
li(socials.map((s) => `**${s.label}**: ${s.handle} — ${s.href}`));

out.push(
  "---",
  "",
  `Generated from src/data/profile.js on ${new Date().toISOString().slice(0, 10)}. Do not edit by hand.`,
  "",
);

const target = resolve(root, "public/llms.txt");
mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, out.join("\n"), "utf8");

console.log(`llms.txt written to public/llms.txt (${out.join("\n").length} bytes)`);
