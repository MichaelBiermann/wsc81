"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import RichTextEditor from "@/components/admin/RichTextEditor";
import { useAdminI18n } from "@/components/admin/AdminI18nProvider";

interface EventFormData {
  titleDe: string; titleEn: string;
  descriptionDe: string; descriptionEn: string;
  location: string; startDate: string; endDate: string;
  depositAmount: string; totalAmount: string;
  maxParticipants: string; registrationDeadline: string;
}

const EMPTY: EventFormData = {
  titleDe: "", titleEn: "", descriptionDe: "", descriptionEn: "",
  location: "", startDate: "", endDate: "",
  depositAmount: "", totalAmount: "", maxParticipants: "", registrationDeadline: "",
};

export default function EventForm({
  initial = EMPTY,
  eventId,
}: {
  initial?: EventFormData;
  eventId?: string;
}) {
  const { t } = useAdminI18n();
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [error, setError] = useState("");

  const set = (field: keyof EventFormData) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("saving");
    const body = {
      ...form,
      depositAmount: Number(form.depositAmount),
      totalAmount: Number(form.totalAmount),
      maxParticipants: form.maxParticipants ? Number(form.maxParticipants) : null,
      registrationDeadline: form.registrationDeadline ? new Date(form.registrationDeadline).toISOString() : null,
      startDate: new Date(form.startDate).toISOString(),
      endDate: new Date(form.endDate).toISOString(),
    };

    const res = await fetch(eventId ? `/api/admin/events/${eventId}` : "/api/admin/events", {
      method: eventId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      router.push("/admin/events");
      router.refresh();
    } else {
      setStatus("error");
      setError(t.eventForm.saveError);
    }
  };

  const handleDelete = async () => {
    if (!eventId || !confirm(t.eventForm.deleteConfirm)) return;
    await fetch(`/api/admin/events/${eventId}`, { method: "DELETE" });
    router.push("/admin/events");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 max-w-2xl">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={t.eventForm.titleDe} required>
          <Input value={form.titleDe} onChange={set("titleDe")} required />
        </FormField>
        <FormField label={t.eventForm.titleEn} required>
          <Input value={form.titleEn} onChange={set("titleEn")} required />
        </FormField>
      </div>

      <FormField label={t.eventForm.descriptionDe} required>
        <RichTextEditor
          content={form.descriptionDe}
          onChange={(v) => setForm((f) => ({ ...f, descriptionDe: v }))}
          locale="de"
        />
      </FormField>

      <FormField label={t.eventForm.descriptionEn} required>
        <RichTextEditor
          content={form.descriptionEn}
          onChange={(v) => setForm((f) => ({ ...f, descriptionEn: v }))}
          locale="en"
        />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={t.eventForm.location} required>
          <Input value={form.location} onChange={set("location")} required />
        </FormField>
        <FormField label={t.eventForm.registrationDeadline}>
          <Input type="datetime-local" value={form.registrationDeadline} onChange={set("registrationDeadline")} />
        </FormField>
        <FormField label={t.eventForm.startDate} required>
          <Input type="datetime-local" value={form.startDate} onChange={set("startDate")} required />
        </FormField>
        <FormField label={t.eventForm.endDate} required>
          <Input type="datetime-local" value={form.endDate} onChange={set("endDate")} required />
        </FormField>
        <FormField label={t.eventForm.depositAmount} required>
          <Input type="number" min="0" step="0.01" value={form.depositAmount} onChange={set("depositAmount")} required />
        </FormField>
        <FormField label={t.eventForm.totalAmount} required>
          <Input type="number" min="0" step="0.01" value={form.totalAmount} onChange={set("totalAmount")} required />
        </FormField>
        <FormField label={t.eventForm.maxParticipants}>
          <Input type="number" min="1" value={form.maxParticipants} onChange={set("maxParticipants")} />
        </FormField>
      </div>

      {status === "error" && <Alert variant="error">{error}</Alert>}

      <div className="flex gap-3">
        <Button type="submit" loading={status === "saving"}>{t.eventForm.save}</Button>
        <Button type="button" variant="secondary" onClick={() => router.back()}>{t.eventForm.cancel}</Button>
        {eventId && (
          <Button type="button" variant="danger" onClick={handleDelete} className="ml-auto">{t.eventForm.delete}</Button>
        )}
      </div>
    </form>
  );
}
