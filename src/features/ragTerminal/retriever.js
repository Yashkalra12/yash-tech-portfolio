/**
 * A tiny BM25 retriever that runs entirely in the browser.
 *
 * No API key, no network call, no embedding model — the corpus is ~30 short
 * passages, so lexical scoring with a synonym layer beats the complexity of
 * shipping a vector model. `answer()` composes a reply from the top passages;
 * if an LLM endpoint is configured it hands the same passages to the model as
 * grounding context instead (see `synthesize.js`).
 */

import { chunks } from "./knowledge";

const STOPWORDS = new Set(
  `a about above after again against all am an and any are aren as at be because been before being below
   between both but by can cannot could couldn did didn do does doesn doing don down during each few for
   from further had hadn has hasn have haven having he her here hers herself him himself his how i if in
   into is isn it its itself let me more most mustn my myself no nor not of off on once only or other
   ought our ours ourselves out over own same shan she should shouldn so some such than that the their
   theirs them themselves then there these they this those through to too under until up very was wasn
   we were weren what when where which while who whom why with won would wouldn you your yours yourself
   yourselves tell give show s t`
    .split(/\s+/)
    .filter(Boolean),
);

/**
 * Maps the words visitors actually type onto the vocabulary in the corpus.
 * Each key expands to extra query terms; it never removes the original term.
 */
const SYNONYMS = {
  job: ["work", "experience", "role", "company"],
  jobs: ["work", "experience", "role", "company"],
  workplace: ["work", "company", "experience"],
  employer: ["company", "work", "experience"],
  intern: ["internship", "work", "experience"],
  internship: ["work", "experience", "role"],
  career: ["work", "experience", "job"],
  cv: ["resume"],
  résumé: ["resume"],
  uni: ["university", "college", "education"],
  college: ["university", "education", "school"],
  grades: ["grade", "cgpa", "marks"],
  gpa: ["cgpa", "grade"],
  marks: ["grade", "percentage", "cgpa"],
  stack: ["skills", "technologies", "tech"],
  tech: ["skills", "technologies", "stack"],
  technologies: ["skills", "tech", "stack"],
  language: ["languages", "skills"],
  languages: ["skills", "javascript", "typescript", "python"],
  framework: ["skills", "react", "node"],
  frameworks: ["skills", "react", "node"],
  know: ["skills", "technologies"],
  built: ["projects", "project", "build"],
  build: ["projects", "project", "built"],
  made: ["projects", "project", "built"],
  ship: ["projects", "built"],
  shipped: ["projects", "built"],
  side: ["projects", "project"],
  repo: ["github", "project"],
  repos: ["github", "projects"],
  code: ["github", "projects", "skills"],
  hire: ["contact", "availability", "email", "available"],
  hiring: ["contact", "availability", "available"],
  available: ["availability", "relocate", "remote"],
  availability: ["available", "relocate", "remote", "contact"],
  reach: ["contact", "email"],
  contact: ["email", "linkedin", "phone", "whatsapp"],
  email: ["contact", "mail"],
  mail: ["email", "contact"],
  phone: ["whatsapp", "contact", "number"],
  number: ["phone", "whatsapp", "contact"],
  linkedin: ["contact", "social"],
  github: ["contact", "social", "projects"],
  where: ["location", "based", "city"],
  live: ["location", "based"],
  lives: ["location", "based"],
  based: ["location", "city"],
  from: ["location", "based"],
  relocate: ["relocation", "remote", "location"],
  remote: ["relocation", "relocate", "location"],
  ai: ["llm", "langchain", "rag", "artificial"],
  llm: ["ai", "langchain", "rag"],
  ml: ["ai", "llm"],
  frontend: ["front", "react", "ui"],
  backend: ["back", "node", "api"],
  fullstack: ["full", "stack", "developer"],
  who: ["yash", "about", "intro"],
  yourself: ["yash", "about", "intro"],
  you: ["yash"],
  studying: ["learning", "study", "education"],
  learning: ["study", "currently"],
  hobby: ["interests", "athlete"],
  hobbies: ["interests", "athlete"],
  fun: ["interests", "athlete"],
  strength: ["skills", "working"],
  strengths: ["skills", "working"],
  portfolio: ["site", "projects", "website"],
  site: ["portfolio", "website"],
  website: ["portfolio", "site"],
};

/** Crude but predictable suffix stripping — good enough for a 30-doc corpus. */
function stem(word) {
  if (word.length <= 4) return word;
  return word
    .replace(/(ies)$/, "y")
    .replace(/(sses|shes|ches|xes)$/, "s")
    .replace(/([^s])s$/, "$1")
    .replace(/(ing|edly|ed|ly)$/, "");
}

function tokenizeRaw(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s-]/g, " ")
    .split(/[\s\-.]+/)
    .filter((t) => t.length > 1);
}

function tokenize(text) {
  return tokenizeRaw(text).filter((t) => !STOPWORDS.has(t));
}

/** Synonyms count for less than the words the visitor actually typed. */
const SYNONYM_WEIGHT = 0.4;

/**
 * Turn a query into weighted search terms.
 *
 * Synonyms are looked up against the *unfiltered* tokens, because several
 * useful question words ("who", "where", "from") are stopwords yet still carry
 * intent — "who is yash" has no content words at all once they are stripped.
 *
 * @returns {{ term: string, weight: number }[]}
 */
function buildQueryTerms(query) {
  const raw = tokenizeRaw(query);
  const weights = new Map();

  const add = (token, weight) => {
    const term = stem(token);
    // A term reached by two routes keeps its strongest weight.
    weights.set(term, Math.max(weights.get(term) ?? 0, weight));
  };

  raw.forEach((token) => {
    if (!STOPWORDS.has(token)) add(token, 1);
    SYNONYMS[token]?.forEach((synonym) => add(synonym, SYNONYM_WEIGHT));
  });

  return [...weights].map(([term, weight]) => ({ term, weight }));
}

// --- Index ------------------------------------------------------------------

const K1 = 1.4;
const B = 0.72;

const index = (() => {
  const docs = chunks.map((chunk) => {
    // Title and keywords are repeated so that matching them outweighs a body hit.
    const terms = [
      ...tokenize(chunk.text),
      ...tokenize(chunk.title),
      ...tokenize(chunk.title),
      ...chunk.keywords.flatMap((k) => tokenize(k)),
      ...tokenize(chunk.section),
    ].map(stem);

    const tf = new Map();
    terms.forEach((t) => tf.set(t, (tf.get(t) ?? 0) + 1));
    return { chunk, tf, length: terms.length };
  });

  const df = new Map();
  docs.forEach(({ tf }) => {
    for (const term of tf.keys()) df.set(term, (df.get(term) ?? 0) + 1);
  });

  const avgLength = docs.reduce((sum, d) => sum + d.length, 0) / (docs.length || 1);
  return { docs, df, avgLength, total: docs.length };
})();

function idf(term) {
  const n = index.df.get(term) ?? 0;
  // BM25 IDF, floored so that a common term can never contribute negatively.
  return Math.max(0.05, Math.log(1 + (index.total - n + 0.5) / (n + 0.5)));
}

/**
 * Retrieve the passages most relevant to `query`.
 *
 * @param {string} query
 * @param {{ topK?: number, minScore?: number }} [options]
 * @returns {{ chunk: import('./knowledge').Chunk, score: number }[]}
 */
export function retrieve(query, { topK = 4, minScore = 0.12 } = {}) {
  const queryTerms = buildQueryTerms(query);
  if (!queryTerms.length) return [];

  const scored = index.docs.map(({ chunk, tf, length }) => {
    let score = 0;
    for (const { term, weight } of queryTerms) {
      const freq = tf.get(term);
      if (!freq) continue;
      const norm = freq * (K1 + 1);
      const denom = freq + K1 * (1 - B + B * (length / index.avgLength));
      score += weight * idf(term) * (norm / denom);
    }
    return { chunk, score };
  });

  const best = scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score);
  if (!best.length) return [];

  // Keep hits that are within a reasonable band of the top hit, so a confident
  // single match does not drag in three unrelated passages behind it.
  const ceiling = best[0].score;
  return best
    .filter((s) => s.score >= Math.max(minScore, ceiling * 0.45))
    .slice(0, topK);
}

/**
 * Compose a grounded, extractive answer from the retrieved passages.
 * Used when no LLM endpoint is configured — and as the fallback if one fails.
 *
 * @param {string} query
 * @returns {{ text: string, sources: import('./knowledge').Chunk[], grounded: boolean }}
 */
export function answerLocally(query) {
  const hits = retrieve(query);
  if (!hits.length) {
    return {
      text:
        "I could not find that in Yash's knowledge base. Try asking about his experience, projects, skills, education, or how to contact him — or type `help` to see what I know.",
      sources: [],
      grounded: false,
    };
  }

  const text = hits.map(({ chunk }) => chunk.text).join("\n\n");
  return { text, sources: hits.map((h) => h.chunk), grounded: true };
}
