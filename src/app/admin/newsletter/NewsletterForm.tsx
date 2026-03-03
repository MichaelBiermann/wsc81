"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import RichTextEditor from "@/components/admin/RichTextEditor";
import { useAdminI18n } from "@/components/admin/AdminI18nProvider";

export default function NewsletterForm({
  initial,
  newsletterId,
}: {
  initial?: { subjectDe: string; subjectEn: string; bodyDe: string; bodyEn: string };
  newsletterId?: string;
}) {
  const { t } = useAdminI18n();
  const router = useRouter();
  const [form, setForm] = useState({
    subjectDe: initial?.subjectDe ?? "",
    subjectEn: initial?.subjectEn ?? "",
    bodyDe: initial?.bodyDe ?? "",
    bodyEn: initial?.bodyEn ?? "",
  });
  const [status, setStatus] = useState<"idle" | "saving" | "sending" | "error">("idle");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const save = async () => {
    setStatus("saving");
    const res = newsletterId
      ? await fetch(`/api/admin/newsletter/${newsletterId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
      : await fetch("/api/admin/newsletter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setStatus("idle");
    if (res.ok) {
      if (!newsletterId) { const data = await res.json(); router.push(`/admin/newsletter/${data.id}`); }
      else router.refresh();
    } else { setStatus("error"); setError(t.newsletterForm.saveError); }
  };

  const send = async () => {
    if (!newsletterId) return;
    if (!confirm(t.newsletterForm.sendConfirm)) return;
    setStatus("sending");
    const res = await fetch(`/api/admin/newsletter/${newsletterId}/send`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setSent(true);
      setStatus("idle");
      alert(t.newsletterForm.sentCount.replace("{count}", String(data.recipientCount)));
      router.push("/admin/newsletter");
    } else { setStatus("error"); setError(t.newsletterForm.sendError); }
  };

  if (sent) return <Alert variant="success">{t.newsletterForm.sentSuccess}</Alert>;

  return (
    <div className="flex flex-col gap-5 max-w-2xl">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={t.newsletterForm.subjectDe} required>
          <Input value={form.subjectDe} onChange={(e) => setForm((f) => ({ ...f, subjectDe: e.target.value }))} required />
        </FormField>
        <FormField label={t.newsletterForm.subjectEn} required>
          <Input value={form.subjectEn} onChange={(e) => setForm((f) => ({ ...f, subjectEn: e.target.value }))} required />
        </FormField>
      </div>

      <FormField label={t.newsletterForm.bodyDe} required>
        <RichTextEditor content={form.bodyDe} onChange={(v) => setForm((f) => ({ ...f, bodyDe: v }))} locale="de" />
      </FormField>

      <FormField label={t.newsletterForm.bodyEn} required>
        <RichTextEditor content={form.bodyEn} onChange={(v) => setForm((f) => ({ ...f, bodyEn: v }))} locale="en" />
      </FormField>

      {status === "error" && <Alert variant="error">{error}</Alert>}

      <div className="flex gap-3">
        <Button type="button" onClick={save} loading={status === "saving"} variant="secondary">{t.newsletterForm.saveDraft}</Button>
        {newsletterId && (
          <Button type="button" onClick={send} loading={status === "sending"}>{t.newsletterForm.sendNow}</Button>
        )}
        <Button type="button" variant="secondary" onClick={() => router.back()}>{t.newsletterForm.cancel}</Button>
      </div>
    </div>
  );
}
