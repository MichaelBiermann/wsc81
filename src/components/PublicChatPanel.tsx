"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { useSession } from "next-auth/react";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages";

/** Minimal Markdown renderer (bold, code, links, bullet lists, numbered lists, headings). */
function renderMarkdown(text: string, onNavigate: (path: string) => void): React.ReactNode {
  const lines = text.split("\n");
  const nodes: React.ReactNode[] = [];
  let i = 0;

  function inlineFormat(s: string, key: string | number): React.ReactNode {
    const parts = s.split(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g);
    return (
      <span key={key}>
        {parts.map((p, j) => {
          if (p.startsWith("**") && p.endsWith("**")) return <strong key={j}>{p.slice(2, -2)}</strong>;
          if (p.startsWith("`") && p.endsWith("`")) return <code key={j} className="bg-gray-200 rounded px-1 text-xs font-mono">{p.slice(1, -1)}</code>;
          const linkMatch = p.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
          if (linkMatch) return <a key={j} href={linkMatch[2]} onClick={(e) => { e.preventDefault(); onNavigate(linkMatch[2]); }} className="text-[#4577ac] underline hover:text-[#2d5a8a]">{linkMatch[1]}</a>;
          return p;
        })}
      </span>
    );
  }

  while (i < lines.length) {
    const line = lines[i];

    const hMatch = line.match(/^(#{1,3})\s+(.+)/);
    if (hMatch) {
      const level = hMatch[1].length;
      const cls = level === 1 ? "font-bold text-base mt-2 mb-1" : level === 2 ? "font-semibold text-sm mt-2 mb-0.5" : "font-semibold text-xs mt-1";
      nodes.push(<p key={i} className={cls}>{inlineFormat(hMatch[2], 0)}</p>);
      i++; continue;
    }

    if (/^[-*]\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s/, ""));
        i++;
      }
      nodes.push(
        <ul key={`ul${i}`} className="list-disc pl-4 text-sm space-y-0.5 my-1">
          {items.map((it, ii) => <li key={ii}>{inlineFormat(it, ii)}</li>)}
        </ul>
      );
      continue;
    }

    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ""));
        i++;
      }
      nodes.push(
        <ol key={`ol${i}`} className="list-decimal pl-4 text-sm space-y-0.5 my-1">
          {items.map((it, ii) => <li key={ii}>{inlineFormat(it, ii)}</li>)}
        </ol>
      );
      continue;
    }

    if (line.trim() === "") {
      nodes.push(<div key={i} className="h-1" />);
      i++; continue;
    }

    nodes.push(<p key={i} className="text-sm leading-relaxed">{inlineFormat(line, 0)}</p>);
    i++;
  }

  return <>{nodes}</>;
}

interface Message {
  role: "user" | "assistant";
  text: string;
  loading?: boolean;
  navigateTo?: string;
  navigateLabel?: string;
}

export default function PublicChatPanel() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("Chat");
  const { data: session } = useSession();
  const sessionUser = session?.user as { role?: string } | undefined;
  const isLoggedIn = !!session && sessionUser?.role !== "admin";

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [history, setHistory] = useState<MessageParam[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  async function sendMessage(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput("");
    setMessages((prev) => [
      ...prev,
      { role: "user", text: msg },
      { role: "assistant", text: "", loading: true },
    ]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, history, locale, isLoggedIn }),
      });
      const data = await res.json();
      setHistory(data.updatedHistory);
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          text: data.reply ?? t("errorGeneric"),
          navigateTo: data.navigateTo ?? undefined,
          navigateLabel: data.navigateLabel ?? undefined,
        };
        return updated;
      });
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", text: t("errorConnection") };
        return updated;
      });
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  function clearHistory() {
    setMessages([]);
    setHistory([]);
  }

  const suggestions = t.raw("suggestions") as string[];

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        title={t("title")}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#4577ac] text-white shadow-xl hover:bg-[#2d5a8a] transition-colors"
      >
        <span className="material-symbols-rounded" style={{ fontSize: 28 }}>chat</span>
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Slide-in panel */}
      <div
        className={`fixed right-0 top-0 h-full w-full sm:w-[400px] z-50 bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between bg-[#4577ac] px-4 py-3 flex-shrink-0">
          <div className="flex items-center gap-2 text-white">
            <span className="material-symbols-rounded" style={{ fontSize: 20 }}>chat</span>
            <span className="font-semibold text-sm">{t("title")}</span>
            <span className="text-xs text-blue-200 ml-1">{t("subtitle")}</span>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button
                onClick={clearHistory}
                title={t("clearTitle")}
                className="text-blue-200 hover:text-white transition-colors"
              >
                <span className="material-symbols-rounded" style={{ fontSize: 18 }}>delete_sweep</span>
              </button>
            )}
            <button
              onClick={() => setOpen(false)}
              className="text-blue-200 hover:text-white transition-colors"
            >
              <span className="material-symbols-rounded" style={{ fontSize: 20 }}>close</span>
            </button>
          </div>
        </div>

        {/* Empty state / suggestions */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center flex-1 gap-4 p-8 text-center">
            <span className="material-symbols-rounded text-[#4577ac]" style={{ fontSize: 52 }}>chat</span>
            <div>
              <p className="text-sm font-semibold text-gray-700">{t("emptyHeading")}</p>
              <p className="text-xs text-gray-400 mt-1">{t("emptySubtext")}</p>
            </div>
            <div className="flex flex-col gap-2 w-full mt-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-left text-xs text-gray-600 hover:bg-[#eef3f9] hover:border-[#4577ac] transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message list */}
        {messages.length > 0 && (
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "assistant" && (
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#4577ac] flex items-center justify-center mr-2 mt-1">
                    <span className="material-symbols-rounded text-white" style={{ fontSize: 14 }}>chat</span>
                  </div>
                )}
                <div
                  className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "max-w-[85%] bg-[#4577ac] text-white rounded-tr-sm"
                      : "w-full bg-gray-100 text-gray-800 rounded-tl-sm"
                  }`}
                >
                  {m.loading ? (
                    <span className="flex gap-1 items-center py-0.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </span>
                  ) : m.role === "assistant" ? (
                    <div className="flex flex-col gap-2">
                      {renderMarkdown(m.text, (path) => { router.push(path); setOpen(false); })}
                      {m.navigateTo && m.navigateLabel && (
                        <button
                          onClick={() => { router.push(m.navigateTo!); setOpen(false); }}
                          className="mt-1 inline-flex items-center gap-1 self-start rounded-lg bg-[#4577ac] text-white text-xs px-3 py-1.5 hover:bg-[#2d5a8a] transition-colors"
                        >
                          <span className="material-symbols-rounded" style={{ fontSize: 14 }}>arrow_forward</span>
                          {m.navigateLabel}
                        </button>
                      )}
                    </div>
                  ) : (
                    <span style={{ whiteSpace: "pre-wrap" }}>{m.text}</span>
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}

        {/* Input area */}
        <div className="border-t border-gray-200 p-3 flex gap-2 flex-shrink-0 bg-white">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder={t("placeholder")}
            disabled={loading}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4577ac] disabled:opacity-50"
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#4577ac] text-white hover:bg-[#2d5a8a] disabled:opacity-40 transition-colors flex-shrink-0"
          >
            <span className="material-symbols-rounded" style={{ fontSize: 18 }}>send</span>
          </button>
        </div>
      </div>
    </>
  );
}
