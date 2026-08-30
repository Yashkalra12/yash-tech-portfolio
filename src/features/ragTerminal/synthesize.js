/**
 * Optional LLM layer for the RAG terminal.
 *
 * The terminal works with zero configuration: `retriever.answerLocally()`
 * returns the retrieved passages verbatim. If you want conversational answers,
 * point the app at a small proxy that holds your API key and forwards to a
 * model — never put a key in the frontend bundle, since anything in `VITE_*`
 * ships to the browser in plain text.
 *
 *   # .env.local
 *   VITE_RAG_ENDPOINT=https://your-proxy.vercel.app/api/chat
 *
 * The endpoint receives `{ question, context, system }` and should reply with
 * either `{ answer: "..." }` or `{ text: "..." }`. Anything else, or any
 * failure, falls back to the local extractive answer.
 */

import { answerLocally } from "./retriever";

const ENDPOINT = import.meta.env.VITE_RAG_ENDPOINT ?? "";
const TIMEOUT_MS = 20000;

export const hasLLM = Boolean(ENDPOINT);

const SYSTEM_PROMPT = `You are the assistant embedded in Yash Kalra's portfolio terminal.
Answer questions about Yash using ONLY the CONTEXT provided. If the context does
not contain the answer, say so plainly and suggest what the visitor could ask
instead — never invent employers, dates, grades or links.
Write in third person about Yash. Keep answers to 1-3 short sentences unless the
visitor asks for detail. Plain text, no markdown headings.`;

/**
 * Answer a question, using the LLM when configured and the local retriever
 * otherwise. Retrieval always runs, so answers stay grounded either way.
 *
 * @param {string} question
 * @param {{ signal?: AbortSignal }} [options]
 * @returns {Promise<{ text: string, sources: import('./knowledge').Chunk[], mode: 'llm' | 'local' }>}
 */
export async function synthesize(question, { signal } = {}) {
  const local = answerLocally(question);

  if (!ENDPOINT) return { ...local, mode: "local" };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const onOuterAbort = () => controller.abort();
  signal?.addEventListener("abort", onOuterAbort);

  try {
    const context = local.sources
      .map((c, i) => `[${i + 1}] ${c.section} — ${c.title}\n${c.text}`)
      .join("\n\n");

    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question,
        context,
        system: SYSTEM_PROMPT,
      }),
      signal: controller.signal,
    });

    if (!response.ok) throw new Error(`RAG endpoint returned ${response.status}`);

    const data = await response.json();
    const text = data.answer ?? data.text ?? data.content;
    if (typeof text !== "string" || !text.trim()) {
      throw new Error("RAG endpoint returned no answer text");
    }

    return { text: text.trim(), sources: local.sources, mode: "llm" };
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn("[rag] falling back to local answer:", error);
    }
    return { ...local, mode: "local" };
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onOuterAbort);
  }
}
