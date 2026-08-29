/**
 * The RAG terminal: ask anything about Yash and get an answer grounded in the
 * local knowledge base, with the retrieved sources shown so you can see where
 * the answer came from.
 */

import { useCallback, useEffect, useRef, useState } from "react";
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

let lineId = 0;
const nextId = () => `line-${lineId++}`;

/** @typedef {{ id: string, kind: string, text?: string, lines?: string[], links?: any[], sources?: any[], mode?: string }} Line */

const line = (kind, extra = {}) => ({ id: nextId(), kind, ...extra });

export default function RagTerminal() {
  const [history, setHistory] = useState(() => [line("banner", { lines: BANNER })]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [recall, setRecall] = useState([]);
  const [recallIndex, setRecallIndex] = useState(-1);

  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);

  const append = useCallback((...lines) => {
    setHistory((prev) => [...prev, ...lines]);
  }, []);

  // Keep the newest output in view as it streams in.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [history, busy]);

  useEffect(() => () => abortRef.current?.abort(), []);

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

      setBusy(true);
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const { text, sources, mode } = await synthesize(query, { signal: controller.signal });
        if (controller.signal.aborted) return;
        append(line("answer", { text, sources, mode }));
      } catch {
        append(
          line("error", {
            text: "Something went wrong answering that. Try rephrasing, or run `help`.",
          }),
        );
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null;
          setBusy(false);
        }
      }
    },
    [append, busy],
  );

  /** Up/down arrows walk back through what you have already asked. */
  const onKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      submit(input);
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

          {busy ? <p className="mt-2 animate-pulse text-slate-500">searching…</p> : null}

          <div className="mt-2 flex items-start gap-2">
            <span aria-hidden className="select-none text-[#27C841]">
              ❯
            </span>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              disabled={busy}
              spellCheck={false}
              autoComplete="off"
              aria-label="Ask a question about Yash"
              placeholder={busy ? "" : "what did he build at Munshot?"}
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
