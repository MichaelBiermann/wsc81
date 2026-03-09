"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";

type TicketType = "BUG" | "FEATURE" | "QUESTION" | "OTHER";

export default function SupportForm() {
  const t = useTranslations("Support");
  const locale = useLocale();

  const [type, setType] = useState<TicketType>("BUG");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const types: { value: TicketType; label: string }[] = [
    { value: "BUG", label: t("typeBug") },
    { value: "FEATURE", label: t("typeFeature") },
    { value: "QUESTION", label: t("typeQuestion") },
    { value: "OTHER", label: t("typeOther") },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");

    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, subject, body }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data?.error ?? "Fehler beim Absenden.");
        setStatus("error");
        return;
      }

      setStatus("success");
    } catch {
      setErrorMsg("Verbindungsfehler.");
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <span className="material-symbols-rounded text-green-600 text-4xl" aria-hidden="true">check_circle</span>
        <h2 className="text-xl font-semibold text-green-800 mt-2">{t("successTitle")}</h2>
        <p className="text-green-700 mt-1">{t("successBody")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Type selector */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">{t("typeLabel")}</p>
        <div className="flex flex-wrap gap-2" role="group" aria-label={t("typeLabel")}>
          {types.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setType(value)}
              className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors focus:outline-none focus:ring-2 focus:ring-[#4577ac] ${
                type === value
                  ? "bg-[#4577ac] text-white border-[#4577ac]"
                  : "bg-white text-gray-700 border-gray-300 hover:border-[#4577ac]"
              }`}
              aria-pressed={type === value}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <FormField htmlFor="support-subject" label={t("subjectLabel")}>
        <Input
          id="support-subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
          maxLength={200}
          placeholder=""
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
          rows={6}
        />
      </FormField>

      {status === "error" && (
        <p className="text-red-600 text-sm" role="alert">{errorMsg}</p>
      )}

      <Button type="submit" loading={status === "submitting"}>
        {t("submit")}
      </Button>
    </form>
  );
}
