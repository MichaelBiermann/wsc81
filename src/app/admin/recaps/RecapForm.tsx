"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import RichTextEditor from "@/components/admin/RichTextEditor";
import { useAdminI18n } from "@/components/admin/AdminI18nProvider";

interface RecapFormProps {
  recapId?: string;
  initial?: {
    slug: string;
    titleDe: string;
    titleEn: string;
    bodyDe: string;
    bodyEn: string;
    eventDate: string;
    imageUrl: string;
    status: "DRAFT" | "PUBLISHED";
  };
}

export default function RecapForm({ recapId, initial }: RecapFormProps) {
  const { t } = useAdminI18n();
  const router = useRouter();
  const [form, setForm] = useState({
    slug: initial?.slug ?? "",
    titleDe: initial?.titleDe ?? "",
    titleEn: initial?.titleEn ?? "",
    bodyDe: initial?.bodyDe ?? "",
    bodyEn: initial?.bodyEn ?? "",
    eventDate: initial?.eventDate ?? "",
    imageUrl: initial?.imageUrl ?? "",
    status: initial?.status ?? "DRAFT" as "DRAFT" | "PUBLISHED",
  });
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const autoSlug = (title: string) =>
    title
      .toLowerCase()
      .replace(/[äöü]/g, (c) => ({ ä: "ae", ö: "oe", ü: "ue" }[c] ?? c))
      .replace(/ß/g, "ss")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  const handleTitleDe = (v: string) => {
    setForm((f) => ({ ...f, titleDe: v, slug: recapId ? f.slug : autoSlug(v) }));
  };

  const save = async (overrideStatus?: "DRAFT" | "PUBLISHED") => {
    setStatus("saving");
    setError("");
    const body = { ...form, status: overrideStatus ?? form.status };
    const res = recapId
      ? await fetch(`/api/admin/recaps/${recapId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      : await fetch("/api/admin/recaps", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

    if (res.ok) {
      if (!recapId) {
        const data = await res.json();
        router.push(`/admin/recaps/${data.id}`);
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        router.refresh();
      }
      setStatus("idle");
    } else {
      const data = await res.json().catch(() => ({}));
      setStatus("error");
      setError(data.errors ? JSON.stringify(data.errors.fieldErrors) : t.recapForm.saveError);
    }
  };

  const handleDelete = async () => {
    if (!recapId || !confirm(t.recaps.deleteConfirm)) return;
    await fetch(`/api/admin/recaps/${recapId}`, { method: "DELETE" });
    router.push("/admin/recaps");
  };

  return (
    <div className="flex flex-col gap-5 max-w-3xl">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={t.recapForm.titleDe} required>
          <Input value={form.titleDe} onChange={(e) => handleTitleDe(e.target.value)} required />
        </FormField>
        <FormField label={t.recapForm.titleEn} required>
          <Input value={form.titleEn} onChange={(e) => setForm((f) => ({ ...f, titleEn: e.target.value }))} required />
        </FormField>
      </div>

      <FormField label={t.recapForm.slug} required error={form.slug && !/^[a-z0-9-]+$/.test(form.slug) ? t.recapForm.slugError : undefined}>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400 whitespace-nowrap">/rueckblicke/</span>
          <Input
            value={form.slug}
            onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))}
            placeholder="mein-rueckblick"
            required
          />
        </div>
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={t.recapForm.eventDate}>
          <Input type="date" value={form.eventDate} onChange={(e) => setForm((f) => ({ ...f, eventDate: e.target.value }))} />
        </FormField>
        <FormField label={t.recapForm.imageUrl}>
          <Input type="url" value={form.imageUrl} onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))} placeholder="https://..." />
        </FormField>
      </div>

      <FormField label={t.recapForm.status}>
        <Select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as "DRAFT" | "PUBLISHED" }))}>
          <option value="DRAFT">{t.recapForm.statusDraft}</option>
          <option value="PUBLISHED">{t.recapForm.statusPublished}</option>
        </Select>
      </FormField>

      <FormField label={t.recapForm.bodyDe} required>
        <RichTextEditor content={form.bodyDe} onChange={(v) => setForm((f) => ({ ...f, bodyDe: v }))} locale="de" />
      </FormField>

      <FormField label={t.recapForm.bodyEn} required>
        <RichTextEditor content={form.bodyEn} onChange={(v) => setForm((f) => ({ ...f, bodyEn: v }))} locale="en" />
      </FormField>

      {status === "error" && <Alert variant="error">{error}</Alert>}
      {saved && <Alert variant="success">{t.recapForm.saved}</Alert>}

      <div className="flex gap-3">
        <Button type="button" onClick={() => save("DRAFT")} loading={status === "saving"} variant="secondary">{t.recapForm.saveDraft}</Button>
        {form.status !== "PUBLISHED" && (
          <Button type="button" onClick={() => save("PUBLISHED")} loading={status === "saving"}>{t.recapForm.publish}</Button>
        )}
        {form.status === "PUBLISHED" && recapId && (
          <Button type="button" onClick={() => save()} loading={status === "saving"}>{t.recapForm.save}</Button>
        )}
        <Button type="button" variant="secondary" onClick={() => router.push("/admin/recaps")}>{t.recapForm.cancel}</Button>
        {recapId && (
          <Button type="button" variant="danger" onClick={handleDelete} className="ml-auto">{t.recapForm.delete}</Button>
        )}
      </div>
    </div>
  );
}
