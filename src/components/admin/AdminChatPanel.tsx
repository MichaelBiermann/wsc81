"use client";

import { useState, useRef, useEffect } from "react";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages";

interface Message {
  role: "user" | "assistant";
  text: string;
  loading?: boolean;
}

const SUGGESTIONS = [
  { de: "Zeige alle kommenden Veranstaltungen", en: "Show all upcoming events" },
  { de: "Wie viele ausstehende Mitgliedschaftsanträge gibt es?", en: "How many pending membership applications?" },
  { de: "Zeige alle Mitglieder", en: "Show all members" },
];

export default function AdminChatPanel() {
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
      const res = await fetch("/api/admin/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, history }),
      });
      const data = await res.json();
      setHistory(data.updatedHistory);
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", text: data.reply ?? "Fehler – bitte erneut versuchen." };
        return updated;
      });
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", text: "Verbindungsfehler. Bitte erneut versuchen." };
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

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        title="KI-Assistent"
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#4577ac] text-white shadow-xl hover:bg-[#2d5a8a] transition-colors"
      >
        <span className="material-symbols-rounded" style={{ fontSize: 28 }}>smart_toy</span>
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
        className={`fixed right-0 top-0 h-full w-[440px] z-50 bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between bg-[#1a2a3a] px-4 py-3 flex-shrink-0">
          <div className="flex items-center gap-2 text-white">
            <span className="material-symbols-rounded" style={{ fontSize: 20 }}>smart_toy</span>
            <span className="font-semibold text-sm">KI-Assistent</span>
            <span className="text-xs text-gray-400 ml-1">WSC 81 Admin</span>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button
                onClick={clearHistory}
                title="Verlauf löschen"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <span className="material-symbols-rounded" style={{ fontSize: 18 }}>delete_sweep</span>
              </button>
            )}
            <button
              onClick={() => setOpen(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <span className="material-symbols-rounded" style={{ fontSize: 20 }}>close</span>
            </button>
          </div>
        </div>

        {/* Empty state / suggestions */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center flex-1 gap-4 p-8 text-center">
            <span className="material-symbols-rounded text-[#4577ac]" style={{ fontSize: 52 }}>smart_toy</span>
            <div>
              <p className="text-sm font-semibold text-gray-700">Wie kann ich helfen?</p>
              <p className="text-xs text-gray-400 mt-1">Daten abfragen, erstellen, bearbeiten oder löschen.</p>
            </div>
            <div className="flex flex-col gap-2 w-full mt-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s.de}
                  onClick={() => sendMessage(s.de)}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-left text-xs text-gray-600 hover:bg-[#eef3f9] hover:border-[#4577ac] transition-colors"
                >
                  {s.de}
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
                    <span className="material-symbols-rounded text-white" style={{ fontSize: 14 }}>smart_toy</span>
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-[#4577ac] text-white rounded-tr-sm"
                      : "bg-gray-100 text-gray-800 rounded-tl-sm"
                  }`}
                >
                  {m.loading ? (
                    <span className="flex gap-1 items-center py-0.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </span>
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
            placeholder="Nachricht eingeben…"
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
