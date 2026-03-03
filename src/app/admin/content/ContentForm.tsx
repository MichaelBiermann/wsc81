"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import RichTextEditor from "@/components/admin/RichTextEditor";

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
  const typeLabel = type === "news" ? "Neuigkeit" : "Seite";

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
      setError(data.errors ? JSON.stringify(data.errors.fieldErrors) : "Fehler beim Speichern.");
    }
  };

  const publish = async () => {
    setForm((f) => ({ ...f, status: "PUBLISHED" }));
    await save();
  };

  return (
    <div className="flex flex-col gap-5 max-w-3xl">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Titel (DE)" required>
          <Input
            value={form.titleDe}
            onChange={(e) => handleTitleDe(e.target.value)}
            placeholder={`${typeLabel}titel auf Deutsch`}
            required
          />
        </FormField>
        <FormField label="Title (EN)" required>
          <Input
            value={form.titleEn}
            onChange={(e) => setForm((f) => ({ ...f, titleEn: e.target.value }))}
            placeholder={`${typeLabel} title in English`}
            required
          />
        </FormField>
      </div>

      <FormField
        label="URL-Slug"
        required
        error={
          form.slug && !/^[a-z0-9-]+$/.test(form.slug)
            ? "Nur Kleinbuchstaben, Ziffern und Bindestriche"
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
        </div>
      </FormField>

      <FormField label="Status">
        <Select
          value={form.status}
          onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as "DRAFT" | "PUBLISHED" }))}
        >
          <option value="DRAFT">Entwurf</option>
          <option value="PUBLISHED">Veröffentlicht</option>
        </Select>
      </FormField>

      <FormField label="Inhalt (DE)" required>
        <RichTextEditor
          content={form.bodyDe}
          onChange={(v) => setForm((f) => ({ ...f, bodyDe: v }))}
          locale="de"
        />
      </FormField>

      <FormField label="Content (EN)" required>
        <RichTextEditor
          content={form.bodyEn}
          onChange={(v) => setForm((f) => ({ ...f, bodyEn: v }))}
          locale="en"
        />
      </FormField>

      {status === "error" && <Alert variant="error">{error}</Alert>}
      {saved && <Alert variant="success">Gespeichert.</Alert>}

      <div className="flex gap-3">
        <Button type="button" onClick={save} loading={status === "saving"} variant="secondary">
          Als Entwurf speichern
        </Button>
        {form.status !== "PUBLISHED" && (
          <Button type="button" onClick={publish} loading={status === "saving"}>
            Veröffentlichen
          </Button>
        )}
        {form.status === "PUBLISHED" && contentId && (
          <Button type="button" onClick={save} loading={status === "saving"}>
            Speichern
          </Button>
        )}
        <Button type="button" variant="secondary" onClick={() => router.push(backPath)}>
          Abbrechen
        </Button>
      </div>
    </div>
  );
}
