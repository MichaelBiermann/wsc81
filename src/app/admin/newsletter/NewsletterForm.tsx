"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import RichTextEditor from "@/components/admin/RichTextEditor";

export default function NewsletterForm({
  initial,
  newsletterId,
}: {
  initial?: { subjectDe: string; subjectEn: string; bodyDe: string; bodyEn: string };
  newsletterId?: string;
}) {
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
    } else { setStatus("error"); setError("Fehler beim Speichern."); }
  };

  const send = async () => {
    if (!newsletterId) return;
    if (!confirm(`Newsletter an alle Mitglieder senden?`)) return;
    setStatus("sending");
    const res = await fetch(`/api/admin/newsletter/${newsletterId}/send`, { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setSent(true);
      setStatus("idle");
      alert(`Newsletter an ${data.recipientCount} Mitglieder gesendet.`);
      router.push("/admin/newsletter");
    } else { setStatus("error"); setError("Fehler beim Senden."); }
  };

  if (sent) return <Alert variant="success">Newsletter wurde erfolgreich gesendet!</Alert>;

  return (
    <div className="flex flex-col gap-5 max-w-2xl">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Betreff (DE)" required>
          <Input value={form.subjectDe} onChange={(e) => setForm((f) => ({ ...f, subjectDe: e.target.value }))} required />
        </FormField>
        <FormField label="Subject (EN)" required>
          <Input value={form.subjectEn} onChange={(e) => setForm((f) => ({ ...f, subjectEn: e.target.value }))} required />
        </FormField>
      </div>

      <FormField label="Inhalt (DE)" required>
        <RichTextEditor content={form.bodyDe} onChange={(v) => setForm((f) => ({ ...f, bodyDe: v }))} locale="de" />
      </FormField>

      <FormField label="Content (EN)" required>
        <RichTextEditor content={form.bodyEn} onChange={(v) => setForm((f) => ({ ...f, bodyEn: v }))} locale="en" />
      </FormField>

      {status === "error" && <Alert variant="error">{error}</Alert>}

      <div className="flex gap-3">
        <Button type="button" onClick={save} loading={status === "saving"} variant="secondary">Als Entwurf speichern</Button>
        {newsletterId && (
          <Button type="button" onClick={send} loading={status === "sending"}>Jetzt senden</Button>
        )}
        <Button type="button" variant="secondary" onClick={() => router.back()}>Abbrechen</Button>
      </div>
    </div>
  );
}
