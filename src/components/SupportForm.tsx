"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";

type TicketType = "BUG" | "FEATURE" | "QUESTION" | "OTHER";
type Step = 1 | 2;

const TYPE_ICONS: Record<TicketType, string> = {
  BUG: "bug_report",
  FEATURE: "lightbulb",
  QUESTION: "help",
  OTHER: "chat",
};

export default function SupportForm() {
  const t = useTranslations("Support");
  const locale = useLocale();

  const [step, setStep] = useState<Step>(1);
  const [type, setType] = useState<TicketType | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [screenshotDataUrl, setScreenshotDataUrl] = useState<string | null>(null);
  const [screenshotUploading, setScreenshotUploading] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [screenshotError, setScreenshotError] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const types: { value: TicketType; label: string; desc: string }[] = [
    { value: "BUG", label: t("typeBug"), desc: t("typeBugDesc") },
    { value: "FEATURE", label: t("typeFeature"), desc: t("typeFeatureDesc") },
    { value: "QUESTION", label: t("typeQuestion"), desc: t("typeQuestionDesc") },
    { value: "OTHER", label: t("typeOther"), desc: t("typeOtherDesc") },
  ];

  // Capture screenshot of the current page BEFORE transitioning to step 2,
  // so the wizard form is not visible in the screenshot.
  async function captureAndProceed(selectedType: TicketType) {
    setType(selectedType);
    setScreenshotError(false);
    setScreenshotUploading(true);

    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(document.body, {
        pixelRatio: 0.5,
        filter: (node) => {
          if ((node as HTMLElement).id === "support-wizard-overlay") return false;
          return true;
        },
      });
      setScreenshotDataUrl(dataUrl);

      // Upload — non-fatal
      try {
        const fetchRes = await fetch(dataUrl);
        const blob = await fetchRes.blob();
        const formData = new FormData();
        formData.append("file", blob, "screenshot.png");
        const res = await fetch("/api/support/screenshot", { method: "POST", body: formData });
        if (res.ok) {
          const data = await res.json();
          setScreenshotUrl(data.url);
        }
      } catch { /* upload failed silently */ }
    } catch (err) {
      console.error("[ss] capture failed:", err);
      setScreenshotError(true);
    } finally {
      setScreenshotUploading(false);
      setStep(2);
    }
  }

  const handleBack = () => {
    setStep(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!type) return;
    setSubmitStatus("submitting");
    setErrorMsg("");

    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, subject, body, screenshotUrl: screenshotUrl ?? "" }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data?.error ?? "Fehler beim Absenden.");
        setSubmitStatus("error");
        return;
      }

      setSubmitStatus("success");
    } catch {
      setErrorMsg("Verbindungsfehler.");
      setSubmitStatus("error");
    }
  };

  if (submitStatus === "success") {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <span className="material-symbols-rounded text-green-600 text-4xl" aria-hidden="true">check_circle</span>
        <h2 className="text-xl font-semibold text-green-800 mt-2">{t("successTitle")}</h2>
        <p className="text-green-700 mt-1">{t("successBody")}</p>
      </div>
    );
  }

  return (
    <div id="support-wizard-overlay">
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6" aria-label={t("stepIndicator")}>
        {([1, 2] as Step[]).map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
              step === s ? "bg-[#4577ac] text-white" : step > s ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"
            }`}>
              {step > s
                ? <span className="material-symbols-rounded" style={{ fontSize: 16 }} aria-hidden="true">check</span>
                : s}
            </div>
            <span className={`text-sm ${step === s ? "text-gray-800 font-medium" : "text-gray-400"}`}>
              {s === 1 ? t("step1Label") : t("step2Label")}
            </span>
            {s < 2 && <span className="text-gray-300 mx-1">→</span>}
          </div>
        ))}
      </div>

      {/* Step 1: Type selection */}
      {step === 1 && (
        <div>
          <p className="text-sm text-gray-600 mb-4">{t("step1Prompt")}</p>
          {screenshotUploading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-500">
              <span className="material-symbols-rounded animate-spin text-[#4577ac]" style={{ fontSize: 20 }} aria-hidden="true">progress_activity</span>
              {t("screenshotCapturing")}
            </div>
          ) : (
          <div className="grid grid-cols-2 gap-3">
            {types.map(({ value, label, desc }) => (
              <button
                key={value}
                type="button"
                onClick={() => captureAndProceed(value)}
                className="flex flex-col items-start gap-2 rounded-xl border-2 border-gray-200 bg-white p-4 text-left transition-all hover:border-[#4577ac] hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-[#4577ac]"
              >
                <span className="material-symbols-rounded text-[#4577ac] text-2xl" aria-hidden="true">{TYPE_ICONS[value]}</span>
                <span className="font-semibold text-gray-800 text-sm">{label}</span>
                <span className="text-xs text-gray-500">{desc}</span>
              </button>
            ))}
          </div>
          )}
        </div>
      )}

      {/* Step 2: Details + screenshot */}
      {step === 2 && type && (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Selected type badge + back */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-rounded text-[#4577ac]" style={{ fontSize: 20 }} aria-hidden="true">{TYPE_ICONS[type]}</span>
              <span className="text-sm font-medium text-[#4577ac]">{types.find(t => t.value === type)?.label}</span>
            </div>
            <button
              type="button"
              onClick={handleBack}
              className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              <span className="material-symbols-rounded" style={{ fontSize: 14 }} aria-hidden="true">arrow_back</span>
              {t("back")}
            </button>
          </div>

          <FormField htmlFor="support-subject" label={t("subjectLabel")}>
            <Input
              id="support-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              maxLength={200}
              placeholder={t("subjectPlaceholder")}
            />
          </FormField>

          <FormField htmlFor="support-body" label={t("bodyLabel")}>
            <Textarea
              id="support-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              maxLength={2000}
              placeholder={t("bodyPlaceholder")}
              rows={5}
            />
          </FormField>

          {/* Screenshot preview */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
              <span className="material-symbols-rounded text-gray-500" style={{ fontSize: 16 }} aria-hidden="true">screenshot</span>
              {t("screenshotLabel")}
            </p>
            {screenshotUploading && (
              <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 rounded-lg p-3 border border-gray-200">
                <span className="material-symbols-rounded animate-spin text-[#4577ac]" style={{ fontSize: 18 }} aria-hidden="true">progress_activity</span>
                {t("screenshotCapturing")}
              </div>
            )}
            {!screenshotUploading && screenshotError && (
              <p className="text-xs text-amber-600 bg-amber-50 rounded-lg p-3 border border-amber-200">
                {t("screenshotFailed")}
              </p>
            )}
            {!screenshotUploading && screenshotDataUrl && !screenshotError && (
              <div className="relative">
                <img
                  src={screenshotDataUrl}
                  alt={t("screenshotAlt")}
                  className="w-full rounded-lg border border-gray-200 shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => { setScreenshotDataUrl(null); setScreenshotUrl(null); }}
                  className="absolute top-2 right-2 bg-white/90 rounded-full p-1 shadow text-gray-500 hover:text-red-500 transition-colors"
                  aria-label={t("screenshotRemove")}
                >
                  <span className="material-symbols-rounded" style={{ fontSize: 18 }} aria-hidden="true">close</span>
                </button>
                {screenshotUrl && (
                  <div className="absolute bottom-2 right-2 bg-green-500 text-white rounded-full px-2 py-0.5 text-xs flex items-center gap-1">
                    <span className="material-symbols-rounded" style={{ fontSize: 12 }} aria-hidden="true">check</span>
                    {t("screenshotUploaded")}
                  </div>
                )}
              </div>
            )}
          </div>

          {submitStatus === "error" && (
            <p className="text-red-600 text-sm" role="alert">{errorMsg}</p>
          )}

          <Button type="submit" loading={submitStatus === "submitting"} disabled={screenshotUploading}>
            {t("submit")}
          </Button>
        </form>
      )}
    </div>
  );
}
