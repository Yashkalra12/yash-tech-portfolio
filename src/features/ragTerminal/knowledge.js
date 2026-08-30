/**
 * Builds the RAG knowledge base out of `src/data/profile.js`.
 *
 * Every chunk is a small, self-contained passage of text plus a bit of metadata
 * so the terminal can cite where an answer came from. Because the chunks are
 * derived from the profile, adding a job or a project automatically makes it
 * answerable — there is no second copy of the data to keep in sync.
 */

import {
  identity,
  socials,
  skillGroups,
  skills,
  experience,
  projects,
  education,
  extraFacts,
} from "../../data/profile";

/** @typedef {{ id: string, section: string, title: string, text: string, keywords: string[] }} Chunk */

/** @returns {Chunk[]} */
function buildChunks() {
  /** @type {Chunk[]} */
  const chunks = [];
  const push = (id, section, title, text, keywords = []) => {
    if (!text || !text.trim()) return;
    chunks.push({ id, section, title, text: text.trim(), keywords });
  };

  // --- Identity -------------------------------------------------------------
  push(
    "identity:intro",
    "About",
    "Who is Yash Kalra",
    `${identity.name} is a ${identity.tagline} based in ${identity.location}. ${identity.blurb} He describes himself as: ${identity.roles.join(", ")}.`,
    ["who", "yash", "name", "intro", "introduction", "about", "bio", "summary", "hello"],
  );

  identity.about.forEach((paragraph, i) => {
    push(`identity:about:${i}`, "About", "About Yash", paragraph, [
      "about",
      "background",
      "experience",
      "story",
    ]);
  });

  push(
    "identity:location",
    "About",
    "Location and relocation",
    `Yash is based in ${identity.location}. ${identity.relocation}.`,
    ["location", "where", "based", "relocate", "relocation", "remote", "city", "country", "visa"],
  );

  push(
    "identity:learning",
    "About",
    "Currently learning",
    `Yash is currently learning: ${identity.learning.join(", ")}.`,
    ["learning", "studying", "currently", "now", "next", "growing", "llm", "langchain", "rag"],
  );

  push(
    "identity:services",
    "About",
    "What Yash can build",
    `Yash builds ${identity.offers.join(", ")}. He can take a vision or a business idea and turn it into a working product.`,
    ["build", "services", "hire", "freelance", "offer", "capabilities", "can you"],
  );

  push(
    "identity:resume",
    "Contact",
    "Resume",
    `Yash's resume is available at ${identity.resume}`,
    ["resume", "cv", "download", "pdf"],
  );

  // --- Contact --------------------------------------------------------------
  push(
    "contact:all",
    "Contact",
    "How to reach Yash",
    `You can reach Yash at: ${socials
      .map((s) => `${s.label} — ${s.handle} (${s.href})`)
      .join("; ")}.`,
    ["contact", "reach", "email", "mail", "phone", "linkedin", "github", "whatsapp", "leetcode", "hire", "connect", "dm", "message"],
  );

  // --- Experience -----------------------------------------------------------
  experience.forEach((job) => {
    push(
      `experience:${job.id}`,
      "Experience",
      `${job.role} at ${job.company}`,
      `${identity.firstName} worked as ${job.role} at ${job.company} (${[job.type, job.place].filter(Boolean).join(", ")}) from ${job.duration}. What he did there: ${job.highlights.join(" ")}`,
      [
        "work",
        "job",
        "experience",
        "role",
        "company",
        "employer",
        "internship",
        "career",
        job.company.toLowerCase(),
        job.shortName.toLowerCase(),
      ],
    );
  });

  push(
    "experience:summary",
    "Experience",
    "Work history summary",
    `Yash's work history: ${experience
      .map((j) => `${j.role} at ${j.company} (${j.duration})`)
      .join("; ")}.`,
    ["work", "history", "jobs", "experience", "career", "timeline", "how long", "years"],
  );

  // --- Projects -------------------------------------------------------------
  projects.forEach((project) => {
    push(
      `project:${project.id}`,
      "Projects",
      project.title,
      `${project.title} is a project by Yash. ${project.description} It is built with ${project.stack.join(", ")}. Live at ${project.src} and the source is at ${project.github}.`,
      [
        "project",
        "projects",
        "built",
        "portfolio",
        "app",
        "side project",
        "github",
        "repo",
        project.title.toLowerCase(),
        ...project.stack.map((s) => s.toLowerCase()),
      ],
    );
  });

  push(
    "project:summary",
    "Projects",
    "All projects",
    `Yash has built: ${projects.map((p) => `${p.title} (${p.description.split(".")[0]})`).join("; ")}.`,
    ["projects", "what have you built", "list", "portfolio", "showcase"],
  );

  // --- Skills ---------------------------------------------------------------
  skillGroups.forEach(([group, items]) => {
    push(
      `skills:${group.toLowerCase().replace(/\s+/g, "-")}`,
      "Skills",
      `${group} skills`,
      `${group}: ${items}.`,
      ["skill", "skills", "tech", "stack", "technologies", "know", "tools", group.toLowerCase(), ...items.toLowerCase().split(/,\s*/)],
    );
  });

  push(
    "skills:all",
    "Skills",
    "Full tech stack",
    `Yash's full tech stack: ${skills.map((s) => s.title).join(", ")}.`,
    ["skills", "stack", "tech", "technologies", "languages", "frameworks", "tools", "know"],
  );

  // --- Education ------------------------------------------------------------
  education.forEach((edu) => {
    push(
      `education:${edu.id}`,
      "Education",
      edu.school,
      `${edu.degree} at ${edu.school}, ${edu.place}, ${edu.date}, graded ${edu.grade}. ${edu.desc}`,
      [
        "education",
        "school",
        "college",
        "university",
        "degree",
        "study",
        "studied",
        "cgpa",
        "gpa",
        "grade",
        "marks",
        "graduate",
        "graduation",
        edu.school.toLowerCase(),
      ],
    );
  });

  push(
    "education:summary",
    "Education",
    "Education summary",
    `Yash's education: ${education
      .map((e) => `${e.degree} — ${e.school} (${e.date}, ${e.grade})`)
      .join("; ")}.`,
    ["education", "academics", "qualifications", "degree", "college", "university"],
  );

  // --- Extras ---------------------------------------------------------------
  extraFacts.forEach((fact, i) => {
    push(`extra:${i}`, "More", fact.topic, fact.text, [
      fact.topic.toLowerCase(),
      ...fact.topic.toLowerCase().split(/\s+/),
    ]);
  });

  return chunks;
}

export const chunks = buildChunks();

export const sections = [...new Set(chunks.map((c) => c.section))];
