"use client";

import { useState, useRef, useEffect, useCallback } from "react";
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
  const isDE = locale !== "en";

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [history, setHistory] = useState<MessageParam[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const panelTitleId = "chat-panel-title";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when panel opens; return focus to button when it closes
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      openButtonRef.current?.focus();
    }
  }, [open]);

  // Close on Escape and trap focus inside the panel
  const handlePanelKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
    // Focus trap
    if (e.key === "Tab") {
      const panel = e.currentTarget as HTMLElement;
      const focusable = panel.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }, []);

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
      {/* Floating open button */}
      <button
        ref={openButtonRef}
        onClick={() => setOpen(true)}
        aria-label={t("title")}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-white text-[#4577ac] shadow-xl hover:bg-blue-50 transition-colors border-2 border-[#4577ac]"
      >
        <span className="material-symbols-rounded" style={{ fontSize: 28 }} aria-hidden="true">chat</span>
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Slide-in dialog panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={panelTitleId}
        onKeyDown={handlePanelKeyDown}
        className={`fixed right-0 top-0 h-full w-full sm:w-[400px] z-50 bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full pointer-events-none"
        }`}
        aria-hidden={!open}
      >
        {/* Header */}
        <div className="flex items-center justify-between bg-[#4577ac] px-4 py-3 flex-shrink-0">
          <div className="flex items-center gap-2 text-white">
            <span className="material-symbols-rounded" style={{ fontSize: 20 }} aria-hidden="true">chat</span>
            <span id={panelTitleId} className="font-semibold text-sm">{t("title")}</span>
            <span className="text-xs text-blue-200 ml-1">{t("subtitle")}</span>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button
                onClick={clearHistory}
                aria-label={t("clearTitle")}
                className="text-blue-200 hover:text-white transition-colors"
              >
                <span className="material-symbols-rounded" style={{ fontSize: 18 }} aria-hidden="true">delete_sweep</span>
              </button>
            )}
            <button
              onClick={() => setOpen(false)}
              aria-label={isDE ? "Chat schließen" : "Close chat"}
              className="text-blue-200 hover:text-white transition-colors"
            >
              <span className="material-symbols-rounded" style={{ fontSize: 20 }} aria-hidden="true">close</span>
            </button>
          </div>
        </div>

        {/* Empty state / suggestions */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center flex-1 gap-4 p-8 text-center">
            <span className="material-symbols-rounded text-[#4577ac]" style={{ fontSize: 52 }} aria-hidden="true">chat</span>
            <div>
              <p className="text-sm font-semibold text-gray-700">{t("emptyHeading")}</p>
              <p className="text-xs text-gray-400 mt-1">{t("emptySubtext")}</p>
            </div>
            <ul className="flex flex-col gap-2 w-full mt-2" aria-label={isDE ? "Vorschläge" : "Suggestions"}>
              {suggestions.map((s) => (
                <li key={s}>
                  <button
                    onClick={() => sendMessage(s)}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-left text-xs text-gray-600 hover:bg-[#eef3f9] hover:border-[#4577ac] transition-colors"
                  >
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Message log */}
        {messages.length > 0 && (
          <div
            role="log"
            aria-live="polite"
            aria-label={isDE ? "Chatverlauf" : "Chat history"}
            className="flex-1 overflow-y-auto p-4 flex flex-col gap-3"
          >
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role === "assistant" && (
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#4577ac] flex items-center justify-center mr-2 mt-1" aria-hidden="true">
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
                    <span
                      className="flex gap-1 items-center py-0.5"
                      role="status"
                      aria-label={isDE ? "Assistent tippt…" : "Assistant is typing…"}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }} aria-hidden="true" />
                      <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }} aria-hidden="true" />
                      <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }} aria-hidden="true" />
                    </span>
                  ) : m.role === "assistant" ? (
                    <div className="flex flex-col gap-2">
                      {renderMarkdown(m.text, (path) => { router.push(path); setOpen(false); })}
                      {m.navigateTo && m.navigateLabel && (
                        <button
                          onClick={() => { router.push(m.navigateTo!); setOpen(false); }}
                          className="mt-1 inline-flex items-center gap-1 self-start rounded-lg bg-[#4577ac] text-white text-xs px-3 py-1.5 hover:bg-[#2d5a8a] transition-colors"
                        >
                          <span className="material-symbols-rounded" style={{ fontSize: 14 }} aria-hidden="true">arrow_forward</span>
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
          <label htmlFor="chat-input" className="sr-only">{t("placeholder")}</label>
          <input
            id="chat-input"
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
            aria-disabled={loading}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4577ac] disabled:opacity-50"
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            aria-label={isDE ? "Nachricht senden" : "Send message"}
            aria-disabled={loading || !input.trim()}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#4577ac] text-white hover:bg-[#2d5a8a] disabled:opacity-40 transition-colors flex-shrink-0"
          >
            <span className="material-symbols-rounded" style={{ fontSize: 18 }} aria-hidden="true">send</span>
          </button>
        </div>
      </div>
    </>
  );
}
