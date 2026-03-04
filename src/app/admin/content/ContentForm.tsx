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

type ContentType = "news" | "pages";

interface ContentFormProps {
  type: ContentType;
  contentId?: string;
  initial?: {
    slug: string;
    titleDe: string;
    titleEn: string;
    bodyDe: string;
    bodyEn: string;
    status: "DRAFT" | "PUBLISHED";
  };
}

export default function ContentForm({ type, contentId, initial }: ContentFormProps) {
  const { t } = useAdminI18n();
  const router = useRouter();
  const [form, setForm] = useState({
    slug: initial?.slug ?? "",
    titleDe: initial?.titleDe ?? "",
    titleEn: initial?.titleEn ?? "",
    bodyDe: initial?.bodyDe ?? "",
    bodyEn: initial?.bodyEn ?? "",
    status: initial?.status ?? "DRAFT",
  });
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const apiBase = `/api/admin/content/${type}`;
  const backPath = `/admin/content/${type}`;

  const autoSlug = (title: string) =>
    title
      .toLowerCase()
      .replace(/[äöü]/g, (c) => ({ ä: "ae", ö: "oe", ü: "ue" }[c] ?? c))
      .replace(/ß/g, "ss")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  const handleTitleDe = (v: string) => {
    setForm((f) => ({
      ...f,
      titleDe: v,
      slug: contentId ? f.slug : autoSlug(v),
    }));
  };

  const save = async () => {
    setStatus("saving");
    setError("");
    const res = contentId
      ? await fetch(`${apiBase}/${contentId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        })
      : await fetch(apiBase, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });

    if (res.ok) {
      if (!contentId) {
        const data = await res.json();
        router.push(`/admin/content/${type}/${data.id}`);
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        router.refresh();
      }
      setStatus("idle");
    } else {
      const data = await res.json().catch(() => ({}));
      setStatus("error");
      setError(data.errors ? JSON.stringify(data.errors.fieldErrors) : t.contentForm.saveError);
    }
  };

  const publish = async () => {
    setForm((f) => ({ ...f, status: "PUBLISHED" }));
    await save();
  };

  return (
    <div className="flex flex-col gap-5 max-w-3xl">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={t.contentForm.titleDe} required>
          <Input
            value={form.titleDe}
            onChange={(e) => handleTitleDe(e.target.value)}
            placeholder={`${t.contentForm.titleDe}...`}
            required
          />
        </FormField>
        <FormField label={t.contentForm.titleEn} required>
          <Input
            value={form.titleEn}
            onChange={(e) => setForm((f) => ({ ...f, titleEn: e.target.value }))}
            placeholder={`${t.contentForm.titleEn}...`}
            required
          />
        </FormField>
      </div>

      <FormField
        label={t.contentForm.slug}
        required
        error={
          form.slug && !/^[a-z0-9-]+$/.test(form.slug)
            ? t.contentForm.slugError
            : undefined
        }
      >
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400 whitespace-nowrap">/{type === "news" ? "news" : "seite"}/</span>
          <Input
            value={form.slug}
            onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))}
            placeholder="mein-beitrag"
            required
          />
          {form.slug && /^[a-z0-9-]+$/.test(form.slug) && (
            <a
              href={`/de/${type === "news" ? "news" : "seite"}/${form.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-[#4577ac] hover:text-[#2d5a8a] transition-colors"
              title="Öffentliche Seite öffnen"
            >
              <span className="material-symbols-rounded" style={{ fontSize: "20px" }}>open_in_new</span>
            </a>
          )}
        </div>
      </FormField>

      <FormField label={t.contentForm.status}>
        <Select
          value={form.status}
          onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as "DRAFT" | "PUBLISHED" }))}
        >
          <option value="DRAFT">{t.contentForm.statusDraft}</option>
          <option value="PUBLISHED">{t.contentForm.statusPublished}</option>
        </Select>
      </FormField>

      <FormField label={t.contentForm.bodyDe} required>
        <RichTextEditor
          content={form.bodyDe}
          onChange={(v) => setForm((f) => ({ ...f, bodyDe: v }))}
          locale="de"
        />
      </FormField>

      <FormField label={t.contentForm.bodyEn} required>
        <RichTextEditor
          content={form.bodyEn}
          onChange={(v) => setForm((f) => ({ ...f, bodyEn: v }))}
          locale="en"
        />
      </FormField>

      {status === "error" && <Alert variant="error">{error}</Alert>}
      {saved && <Alert variant="success">{t.contentForm.saved}</Alert>}

      <div className="flex gap-3">
        <Button type="button" onClick={save} loading={status === "saving"} variant="secondary">
          {t.contentForm.saveDraft}
        </Button>
        {form.status !== "PUBLISHED" && (
          <Button type="button" onClick={publish} loading={status === "saving"}>
            {t.contentForm.publish}
          </Button>
        )}
        {form.status === "PUBLISHED" && contentId && (
          <Button type="button" onClick={save} loading={status === "saving"}>
            {t.contentForm.save}
          </Button>
        )}
        <Button type="button" variant="secondary" onClick={() => router.push(backPath)}>
          {t.contentForm.cancel}
        </Button>
      </div>
    </div>
  );
}
