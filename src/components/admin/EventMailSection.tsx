"use client";

import { useState } from "react";
import { useAdminI18n } from "@/components/admin/AdminI18nProvider";

interface Booking {
  id: string;
  person1Name: string;
  email: string;
}

interface SentMail {
  id: string;
  purpose: string;
  subject: string;
  recipientCount: number;
  sentAt: string;
}

interface EventMailSectionProps {
  eventId: string;
  eventTitleDe: string;
  eventDescriptionDe: string;
  eventLocation: string;
  eventStartDate: string;
  bookings: Booking[];
  initialMails: SentMail[];
}

export default function EventMailSection({
  eventId,
  eventTitleDe,
  eventDescriptionDe,
  eventLocation,
  eventStartDate,
  bookings,
  initialMails,
}: EventMailSectionProps) {
  const { t, locale } = useAdminI18n();
  const em = t.eventMail;

  const [purpose, setPurpose] = useState("");
  const [subject, setSubject] = useState(eventTitleDe);
  const [body, setBody] = useState("");
  const [targetBookingId, setTargetBookingId] = useState<string>("all");
  const [sending, setSending] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
  const [sentMails, setSentMails] = useState<SentMail[]>(initialMails);

  // Prompt review state: null = hidden, string = editable prompt shown
  const [promptDraft, setPromptDraft] = useState<string | null>(null);

  function buildPromptText() {
    const desc = eventDescriptionDe.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 800);
    return [
      `Veranstaltung: ${eventTitleDe}`,
      `Ort: ${eventLocation}`,
      `Datum: ${new Date(eventStartDate).toLocaleDateString("de-DE")}`,
      `Zweck der Mail: ${purpose.trim()}`,
      ``,
      `Veranstaltungsbeschreibung:`,
      desc,
    ].join("\n");
  }

  function handleOpenPromptReview() {
    if (!purpose.trim()) return;
    setPromptDraft(buildPromptText());
  }

  async function handleGenerate() {
    if (!promptDraft) return;
    setGenerating(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: promptDraft,
          action: "generate_event_mail",
          locale,
        }),
      });
      if (!res.ok) return;
      const { suggestion } = await res.json();
      setBody(suggestion);
      if (subject === eventTitleDe || !subject.trim()) {
        setSubject(`${purpose.trim()}: ${eventTitleDe}`);
      }
      setPromptDraft(null);
    } finally {
      setGenerating(false);
    }
  }

  async function handleSend() {
    if (!purpose.trim() || !subject.trim() || !body.trim()) return;
    setSending(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/admin/events/${eventId}/mail`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purpose: purpose.trim(),
          subject: subject.trim(),
          mailBody: body,
          ...(targetBookingId !== "all" && { bookingId: targetBookingId }),
        }),
      });
      if (!res.ok) {
        setFeedback({ ok: false, msg: em.sentError });
        return;
      }
      const saved: SentMail = await res.json();
      setSentMails((prev) => [saved, ...prev]);
      setFeedback({ ok: true, msg: em.sentSuccess.replace("{n}", String(saved.recipientCount)) });
      // Clear form for next mail
      setPurpose("");
      setSubject("");
      setBody("");
      setTargetBookingId("all");
    } finally {
      setSending(false);
    }
  }

  const uniqueRecipients = targetBookingId === "all"
    ? new Set(bookings.map((b) => b.email)).size
    : 1;

  return (
    <div className="mt-10">
      <h2 className="text-lg font-bold text-gray-900 mb-4">{em.sectionTitle}</h2>

      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm flex flex-col gap-4">
        {/* Purpose */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">{em.purposeLabel}</label>
          <input
            type="text"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder={em.purposePlaceholder}
            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4577ac]"
          />
        </div>

        {/* Subject */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">{em.subjectLabel}</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4577ac]"
          />
        </div>

        {/* Body + AI generate */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-medium text-gray-500">{em.bodyLabel}</label>
            <button
              type="button"
              onClick={handleOpenPromptReview}
              disabled={generating || !purpose.trim()}
              className="inline-flex items-center gap-1 text-xs text-[#4577ac] hover:underline disabled:opacity-40 disabled:no-underline"
            >
              <span className="material-symbols-rounded text-sm">auto_awesome</span>
              {em.generateAi}
            </button>
          </div>

          {/* Prompt review panel */}
          {promptDraft !== null && (
            <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <div className="flex items-start gap-2 mb-2">
                <span className="material-symbols-rounded text-amber-500 text-base mt-0.5">edit_note</span>
                <p className="text-xs text-amber-800 leading-snug">
                  <strong>Prompt prüfen:</strong> Ergänze persönliche Details, spezifische Hinweise oder einen besonderen Ton, um dem Text eine persönliche Note zu geben.
                </p>
              </div>
              <textarea
                value={promptDraft}
                onChange={(e) => setPromptDraft(e.target.value)}
                rows={6}
                className="w-full rounded border border-amber-200 bg-white px-2 py-1.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-400 resize-y"
              />
              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={generating}
                  className="inline-flex items-center gap-1.5 rounded bg-[#4577ac] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#3a6699] disabled:opacity-50 transition-colors"
                >
                  <span className="material-symbols-rounded text-sm">{generating ? "progress_activity" : "auto_awesome"}</span>
                  {generating ? "Generiere…" : "Generieren"}
                </button>
                <button
                  type="button"
                  onClick={() => setPromptDraft(null)}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  Abbrechen
                </button>
              </div>
            </div>
          )}

          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={8}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#4577ac] resize-y"
          />
          <p className="mt-1 text-xs text-gray-400">
            Tipp: <code className="bg-gray-100 px-1 rounded">{"{{name}}"}</code> wird durch den Namen des Empfängers ersetzt.
          </p>
        </div>

        {/* Recipient selector */}
        {bookings.length > 1 && (
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Empfänger</label>
            <select
              value={targetBookingId}
              onChange={(e) => setTargetBookingId(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#4577ac]"
            >
              <option value="all">
                {em.recipientAll.replace("{n}", String(new Set(bookings.map((b) => b.email)).size))}
              </option>
              {bookings.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.person1Name} ({b.email})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Send button + feedback */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSend}
            disabled={sending || !purpose.trim() || !subject.trim() || !body.trim()}
            className="inline-flex items-center gap-1.5 rounded-md bg-[#4577ac] px-4 py-2 text-sm font-medium text-white hover:bg-[#3a6699] disabled:opacity-50 transition-colors"
          >
            <span className="material-symbols-rounded text-base leading-none">send</span>
            {sending ? em.sending : (targetBookingId === "all" ? em.sendAll : em.sendOne)}
            {!sending && uniqueRecipients > 0 && (
              <span className="ml-1 text-xs opacity-75">({uniqueRecipients})</span>
            )}
          </button>
          {feedback && (
            <span className={`text-sm ${feedback.ok ? "text-green-600" : "text-red-500"}`}>
              {feedback.msg}
            </span>
          )}
        </div>
      </div>

      {/* Sent mail history */}
      <div className="mt-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">{em.historyTitle}</h3>
        {sentMails.length === 0 ? (
          <p className="text-sm text-gray-400">{em.historyEmpty}</p>
        ) : (
          <div className="flex flex-col gap-2">
            {sentMails.map((m) => (
              <div key={m.id} className="flex items-start justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 text-sm">
                <div>
                  <span className="inline-flex items-center rounded-full bg-[#eef3f9] px-2 py-0.5 text-xs font-medium text-[#4577ac] mr-2">
                    {m.purpose}
                  </span>
                  <span className="font-medium text-gray-800">{m.subject}</span>
                  <span className="ml-2 text-xs text-gray-400">
                    {em.historyRecipients.replace("{n}", String(m.recipientCount))}
                  </span>
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap ml-4">
                  {new Date(m.sentAt).toLocaleDateString("de-DE")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
