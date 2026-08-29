/**
 * The RAG terminal: ask anything about Yash and get an answer grounded in the
 * local knowledge base, with the retrieved sources shown so you can see where
 * the answer came from.
 *
 * An answer arrives in four visible stages — searching, generating, typing out,
 * settled. Retrieval is local BM25 and finishes in about a millisecond, so without
 * the floors below all of that would flash past in one frame and the answer would
 * simply appear, which reads as a canned lookup rather than something being worked
 * out. The staging is also the seam where a real model gets plugged in later: the
 * phases are already the ones a streaming completion has, so only `synthesize`
 * changes.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import MacWindow from "../../ui/MacWindow";
import { identity } from "../../data/profile";
import { chunks } from "./knowledge";
import { commands, parseCommand, suggestions } from "./commands";
import { synthesize, hasLLM } from "./synthesize";

const BANNER = [
  `${identity.name} — portfolio terminal`,
  `${chunks.length} passages indexed · retrieval runs in your browser${hasLLM ? " · LLM synthesis on" : ""}`,
  "Type a question, or `help` for commands.",
];

/** Minimum time each pre-answer stage stays on screen, so it can be read. */
const SEARCH_MS = 320;
const GENERATE_MS = 420;
/** Characters revealed per frame while typing out. ~180/sec at 60fps. */
const CHARS_PER_FRAME = 3;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let lineId = 0;
const nextId = () => `line-${lineId++}`;

/** @typedef {{ id: string, kind: string, text?: string, lines?: string[], links?: any[], sources?: any[], mode?: string }} Line */

const line = (kind, extra = {}) => ({ id: nextId(), kind, ...extra });

export default function RagTerminal() {
  const [history, setHistory] = useState(() => [line("banner", { lines: BANNER })]);
  const [input, setInput] = useState("");
  /** idle → searching → generating → typing → idle */
  const [phase, setPhase] = useState("idle");
  /** The answer being typed out: the full text plus how much of it is visible. */
  const [stream, setStream] = useState(null);
  const [recall, setRecall] = useState([]);
  const [recallIndex, setRecallIndex] = useState(-1);

  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);
  const reduceMotion = useReducedMotion();

  const busy = phase !== "idle";
  // The input stays live while typing out, because Enter skips to the end there.
  const locked = phase === "searching" || phase === "generating";

  const append = useCallback((...lines) => {
    setHistory((prev) => [...prev, ...lines]);
  }, []);

  // Keep the newest output in view as it arrives.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [history, phase, stream?.shown]);

  useEffect(() => () => abortRef.current?.abort(), []);

  // Reveal the answer a few characters at a time. Driven from a frame loop rather
  // than an interval so it stays in step with painting and pauses in background tabs.
  useEffect(() => {
    if (phase !== "typing") return undefined;
    let raf = requestAnimationFrame(function tick() {
      setStream((prev) => {
        if (!prev) return prev;
        const shown = Math.min(prev.text.length, prev.shown + CHARS_PER_FRAME);
        return shown === prev.shown ? prev : { ...prev, shown };
      });
      raf = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  // Fully revealed: commit it to history as a normal line and stand down.
  useEffect(() => {
    if (phase !== "typing" || !stream || stream.shown < stream.text.length) return;
    append(line("answer", { text: stream.text, sources: stream.sources, mode: stream.mode }));
    setStream(null);
    setPhase("idle");
  }, [phase, stream, append]);

  const finishTyping = useCallback(() => {
    setStream((prev) => (prev ? { ...prev, shown: prev.text.length } : prev));
  }, []);

  const submit = useCallback(
    async (raw) => {
      const query = raw.trim();
      if (!query || busy) return;

      setInput("");
      setRecall((prev) => (prev[prev.length - 1] === query ? prev : [...prev, query]));
      setRecallIndex(-1);
      append(line("prompt", { text: query }));

      const command = parseCommand(query);
      if (command) {
        const result = commands[command.name].run(command.args);
        if (result.type === "clear") {
          setHistory([line("banner", { lines: BANNER })]);
          return;
        }
        if (result.type === "links") {
          append(line("links", { links: result.body }));
          return;
        }
        append(line("output", { lines: result.body }));
        return;
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        setPhase("searching");
        // Retrieval and the floor run together, so a slow answer never waits on the
        // floor and a fast one still gets its moment.
        const [answer] = await Promise.all([
          synthesize(query, { signal: controller.signal }),
          wait(SEARCH_MS),
        ]);
        if (controller.signal.aborted) return;

        setPhase("generating");
        await wait(GENERATE_MS);
        if (controller.signal.aborted) return;

        if (reduceMotion || !answer.text) {
          append(line("answer", answer));
          setPhase("idle");
        } else {
          setStream({ ...answer, shown: 0 });
          setPhase("typing");
        }
      } catch {
        append(
          line("error", {
            text: "Something went wrong answering that. Try rephrasing, or run `help`.",
          }),
        );
        setPhase("idle");
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
      }
    },
    [append, busy, reduceMotion],
  );

  /** Up/down arrows walk back through what you have already asked. */
  const onKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      // Enter mid-answer means "stop teasing and show me", not "ask again".
      if (phase === "typing") finishTyping();
      else submit(input);
      return;
    }
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
    if (!recall.length) return;

    event.preventDefault();
    const atEnd = recallIndex === -1;
    if (event.key === "ArrowUp") {
      const next = atEnd ? recall.length - 1 : Math.max(0, recallIndex - 1);
      setRecallIndex(next);
      setInput(recall[next]);
    } else {
      if (atEnd) return;
      const next = recallIndex + 1;
      if (next >= recall.length) {
        setRecallIndex(-1);
        setInput("");
      } else {
        setRecallIndex(next);
        setInput(recall[next]);
      }
    }
  };

  return (
    <section id="terminal" className="mx-auto w-full max-w-4xl scroll-mt-24 px-4 py-16">
      <h2 className="text-3xl font-bold md:text-4xl">
        Ask my portfolio anything <span className="text-[#FEBD2C]">.</span>
      </h2>
      <p className="mt-2 max-w-2xl text-slate-500">
        A retrieval-augmented terminal over everything on this page. It indexes{" "}
        {chunks.length} passages about me and answers from them — no server, no API key, it all
        runs in your browser.
      </p>

      <MacWindow
        title="yash@portfolio ~ rag"
        className="mt-8"
        onClose={() => setHistory([line("banner", { lines: BANNER })])}
      >
        <div
          ref={scrollRef}
          onClick={() => inputRef.current?.focus()}
          className="h-[26rem] cursor-text overflow-y-auto bg-[#0f1115] p-4 font-mono text-[13px] leading-relaxed text-slate-200"
        >
          {history.map((entry) => (
            <TerminalLine key={entry.id} entry={entry} />
          ))}

          {phase === "searching" ? (
            <Working label={`searching ${chunks.length} passages`} />
          ) : null}
          {phase === "generating" ? <Working label="generating" /> : null}

          {/* The answer as it types out. Announced politely so a screen reader gets
              the finished text once, rather than every third character. */}
          {stream ? (
            <p className="mt-1 whitespace-pre-wrap text-slate-200" aria-live="polite">
              {stream.text.slice(0, stream.shown)}
              <span aria-hidden className="ml-0.5 animate-pulse text-[#27C841]">
                ▌
              </span>
            </p>
          ) : null}

          <div className="mt-2 flex items-start gap-2">
            <span aria-hidden className="select-none text-[#27C841]">
              ❯
            </span>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              disabled={locked}
              spellCheck={false}
              autoComplete="off"
              aria-label="Ask a question about Yash"
              placeholder={
                locked ? "" : phase === "typing" ? "↵ to skip" : "what did he build at Munshot?"
              }
              className="flex-1 border-none bg-transparent text-slate-100 caret-[#27C841] outline-none placeholder:text-slate-600 disabled:opacity-50"
            />
          </div>
        </div>
      </MacWindow>

      <div className="mt-4 flex flex-wrap gap-2">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => submit(s)}
            disabled={busy}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 transition hover:border-[#006AFF] hover:text-[#006AFF] disabled:opacity-40"
          >
            {s}
          </button>
        ))}
      </div>
    </section>
  );
}

/** A pre-answer stage: label plus three dots pulsing in sequence. */
function Working({ label }) {
  return (
    <p className="mt-2 flex items-center gap-1 text-slate-500">
      {label}
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          aria-hidden
          className="animate-pulse"
          // Staggered so the dots chase each other instead of blinking as one block.
          style={{ animationDelay: `${i * 160}ms` }}
        >
          .
        </span>
      ))}
    </p>
  );
}

function TerminalLine({ entry }) {
  switch (entry.kind) {
    case "banner":
      return (
        <div className="mb-3 border-b border-slate-800 pb-3 text-slate-400">
          {entry.lines.map((l, i) => (
            <p key={i} className={i === 0 ? "font-bold text-[#27C841]" : ""}>
              {l}
            </p>
          ))}
        </div>
      );

    case "prompt":
      return (
        <p className="mt-3 text-slate-100">
          <span aria-hidden className="text-[#27C841]">
            ❯{" "}
          </span>
          {entry.text}
        </p>
      );

    case "output":
      return (
        <div className="mt-1 whitespace-pre-wrap text-slate-300">
          {entry.lines.map((l, i) => (
            <p key={i}>{l || " "}</p>
          ))}
        </div>
      );

    case "links":
      return (
        <ul className="mt-1 space-y-1">
          {entry.links.map((l) => (
            <li key={l.href}>
              <span className="inline-block w-24 text-slate-500">{l.label}</span>
              <a
                href={l.href}
                target="_blank"
                rel="noreferrer noopener"
                className="text-[#5ac8fa] underline decoration-dotted hover:text-white"
              >
                {l.handle}
              </a>
            </li>
          ))}
        </ul>
      );

    case "answer":
      return (
        <div className="mt-1">
          <div className="whitespace-pre-wrap text-slate-200">{entry.text}</div>
          {entry.sources?.length ? (
            <p className="mt-2 text-[11px] text-slate-500">
              sources: {entry.sources.map((s) => `${s.section}/${s.title}`).join(" · ")}
              {entry.mode === "llm" ? "  [synthesised]" : ""}
            </p>
          ) : null}
        </div>
      );

    case "error":
      return <p className="mt-1 text-[#FE5E58]">{entry.text}</p>;

    default:
      return null;
  }
}
