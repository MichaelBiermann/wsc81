"use client";

import { useState } from "react";
import { useAdminI18n } from "@/components/admin/AdminI18nProvider";
import RichTextEditor from "@/components/admin/RichTextEditor";

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
  eventEndDate: string;
  bookings: Booking[];
  initialMails: SentMail[];
}

export default function EventMailSection({
  eventId,
  eventTitleDe,
  eventDescriptionDe,
  eventLocation,
  eventStartDate,
  eventEndDate,
  bookings,
  initialMails,
}: EventMailSectionProps) {
  const { t } = useAdminI18n();
  const em = t.eventMail;

  function formatDateRange() {
    const fmt = (d: string) => new Date(d).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
    const start = fmt(eventStartDate);
    const end = fmt(eventEndDate);
    return start === end ? start : `${start}–${end}`;
  }

  const [purpose, setPurpose] = useState("Kick Off");
  const [subject, setSubject] = useState(`${eventTitleDe} ${em.dateRangeVom} ${formatDateRange()}`);
  const [body, setBody] = useState("");
  const [mailLang, setMailLang] = useState<"de" | "en">("de");
  const [targetBookingId, setTargetBookingId] = useState<string>("all");  const [sending, setSending] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);
  const [sentMails, setSentMails] = useState<SentMail[]>(initialMails);
  const [showPreview, setShowPreview] = useState(false);

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
          locale: mailLang,
        }),
      });
      if (!res.ok) return;
      const { suggestion } = await res.json();
      setBody(suggestion);
      if (subject === `${eventTitleDe} ${em.dateRangeVom} ${formatDateRange()}` || !subject.trim()) {
        setSubject(`${purpose.trim()}: ${eventTitleDe} ${em.dateRangeVom} ${formatDateRange()}`);
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

  // Replace {{name}} with a sample name for preview
  const previewHtml = body.replace(/\{\{name\}\}/g, "Max Mustermann");

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
            <div className="flex items-center gap-2">
              {(["de", "en"] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => { setMailLang(lang); handleOpenPromptReview(); }}
                  disabled={generating || !purpose.trim()}
                  className="inline-flex items-center gap-1 text-xs text-[#4577ac] hover:underline disabled:opacity-40 disabled:no-underline"
                >
                  <span className="material-symbols-rounded text-sm">auto_awesome</span>
                  {em.generateAi} ({lang.toUpperCase()})
                </button>
              ))}
            </div>
          </div>

          {/* Prompt review panel */}
          {promptDraft !== null && (
            <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <div className="flex items-start gap-2 mb-2">
                <span className="material-symbols-rounded text-amber-500 text-base mt-0.5">edit_note</span>
                <p className="text-xs text-amber-800 leading-snug">{em.promptReviewHint}</p>
              </div>
              <textarea
                value={promptDraft}
                onChange={(e) => setPromptDraft(e.target.value)}
                rows={12}
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
                  {generating ? em.generating : `${em.generate} (${mailLang.toUpperCase()})`}
                </button>
                <button
                  type="button"
                  onClick={() => setPromptDraft(null)}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  {em.cancelGenerate}
                </button>
              </div>
            </div>
          )}

          <RichTextEditor
            content={body}
            onChange={(v) => setBody(v)}
            locale={mailLang}
            minHeight="480px"
          />
          <div className="mt-1 flex items-center justify-between">
            <p className="text-xs text-gray-400">{em.namePlaceholderHint}</p>
            {body.trim() && (
              <button
                type="button"
                onClick={() => setShowPreview(true)}
                className="inline-flex items-center gap-1 text-xs text-[#4577ac] hover:underline"
              >
                <span className="material-symbols-rounded text-sm">preview</span>
                {em.previewBtn}
              </button>
            )}
          </div>
        </div>

        {/* Recipient selector */}
        {bookings.length > 1 && (
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{em.recipientsLabel}</label>
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

      {/* Preview modal */}
      {showPreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowPreview(false); }}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">{em.subjectLabel}: <span className="font-medium text-gray-700">{subject}</span></p>
                <h3 className="text-sm font-semibold text-gray-900">{em.previewTitle}</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label={em.previewClose}
              >
                <span className="material-symbols-rounded">close</span>
              </button>
            </div>
            <div
              className="overflow-y-auto p-6 prose prose-sm max-w-none text-gray-800"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
            <div className="px-5 py-3 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="rounded-md border border-gray-300 px-4 py-1.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                {em.previewClose}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
