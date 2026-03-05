"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import RichTextEditor from "@/components/admin/RichTextEditor";
import AdminImageUpload from "@/components/admin/AdminImageUpload";
import { useAdminI18n } from "@/components/admin/AdminI18nProvider";

interface AgePrice { label: string; price: string; }

interface EventFormData {
  titleDe: string; titleEn: string;
  descriptionDe: string; descriptionEn: string;
  location: string; startDate: string; endDate: string;
  depositAmount: string;
  maxParticipants: string; registrationDeadline: string;
  imageUrl: string;
  bookable: boolean;
  surchargeNonMemberAdult: string;
  surchargeNonMemberChild: string;
  busSurcharge: string;
  roomSingleSurcharge: string;
  roomDoubleSurcharge: string;
  agePrices: AgePrice[];
}

const EMPTY: EventFormData = {
  titleDe: "", titleEn: "", descriptionDe: "", descriptionEn: "",
  location: "", startDate: "", endDate: "",
  depositAmount: "", maxParticipants: "", registrationDeadline: "",
  imageUrl: "",
  bookable: true,
  surchargeNonMemberAdult: "0",
  surchargeNonMemberChild: "0",
  busSurcharge: "0",
  roomSingleSurcharge: "0",
  roomDoubleSurcharge: "0",
  agePrices: [],
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
  const [derivingPrices, setDerivingPrices] = useState(false);

  const set = (field: keyof EventFormData) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("saving");
    const body = {
      ...form,
      bookable: form.bookable,
      depositAmount: Number(form.depositAmount),
      maxParticipants: form.maxParticipants ? Number(form.maxParticipants) : null,
      registrationDeadline: form.registrationDeadline ? new Date(form.registrationDeadline).toISOString() : null,
      startDate: new Date(form.startDate).toISOString(),
      endDate: new Date(form.endDate).toISOString(),
      surchargeNonMemberAdult: Number(form.surchargeNonMemberAdult),
      surchargeNonMemberChild: Number(form.surchargeNonMemberChild),
      busSurcharge: Number(form.busSurcharge),
      roomSingleSurcharge: Number(form.roomSingleSurcharge),
      roomDoubleSurcharge: Number(form.roomDoubleSurcharge),
      agePrices: form.agePrices
        .filter((ap) => ap.label.trim() !== "")
        .map((ap) => ({ label: ap.label.trim(), price: Number(ap.price) })),
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

  const handleDeriveSurcharges = async () => {
    const text = form.descriptionDe || form.descriptionEn;
    if (!text) return;
    setDerivingPrices(true);
    try {
      const res = await fetch("/api/admin/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, action: "extract_surcharges", locale: "de" }),
      });
      if (!res.ok) return;
      const { suggestion } = await res.json();
      // Strip markdown code fences if present (e.g. ```json ... ```)
      const cleaned = suggestion.replace(/^```[\w]*\n?/m, "").replace(/```$/m, "").trim();
      const parsed = JSON.parse(cleaned);
      setForm((f) => ({
        ...f,
        ...(parsed.depositAmount != null && { depositAmount: String(parsed.depositAmount) }),
        ...(parsed.surchargeNonMemberAdult != null && { surchargeNonMemberAdult: String(parsed.surchargeNonMemberAdult) }),
        ...(parsed.surchargeNonMemberChild != null && { surchargeNonMemberChild: String(parsed.surchargeNonMemberChild) }),
        ...(parsed.busSurcharge != null && { busSurcharge: String(parsed.busSurcharge) }),
        ...(parsed.roomSingleSurcharge != null && { roomSingleSurcharge: String(parsed.roomSingleSurcharge) }),
        ...(parsed.roomDoubleSurcharge != null && { roomDoubleSurcharge: String(parsed.roomDoubleSurcharge) }),
        ...(Array.isArray(parsed.agePrices) && parsed.agePrices.length > 0 && {
          agePrices: parsed.agePrices.slice(0, 10).map((ap: { label: string; price: number }) => ({
            label: String(ap.label),
            price: String(ap.price),
          })),
        }),
      }));
    } catch {
      // silently ignore parse errors
    } finally {
      setDerivingPrices(false);
    }
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
          isEventDescription
        />
      </FormField>

      <FormField label={t.eventForm.descriptionEn} required>
        <RichTextEditor
          content={form.descriptionEn}
          onChange={(v) => setForm((f) => ({ ...f, descriptionEn: v }))}
          locale="en"
          isEventDescription
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
        <FormField label={t.eventForm.maxParticipants}>
          <Input type="number" min="1" value={form.maxParticipants} onChange={set("maxParticipants")} />
        </FormField>
      </div>

      <AdminImageUpload
        label={t.eventForm.imageUrl}
        value={form.imageUrl}
        onChange={(url) => setForm((f) => ({ ...f, imageUrl: url }))}
      />

      <label className="flex items-center gap-3 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={form.bookable}
          onChange={(e) => setForm((f) => ({ ...f, bookable: e.target.checked }))}
          className="w-4 h-4 accent-[#4577ac]"
        />
        <span className="text-sm font-medium text-gray-700">{t.eventForm.bookable}</span>
      </label>

      {form.bookable && (
      <div>
        <div className="flex items-center gap-3 mb-3">
          <p className="text-sm font-semibold text-gray-700">{t.eventForm.pricingSurchargesSection}</p>
          <button
            type="button"
            onClick={handleDeriveSurcharges}
            disabled={derivingPrices || (!form.descriptionDe && !form.descriptionEn)}
            className="inline-flex items-center gap-1 text-xs text-[#4577ac] hover:underline disabled:opacity-40 disabled:no-underline"
          >
            <span className="material-symbols-rounded text-sm">{derivingPrices ? "progress_activity" : "auto_awesome"}</span>
            {t.eventForm.deriveSurcharges}
          </button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label={t.eventForm.depositAmount} required>
            <Input type="number" min="0" step="0.01" value={form.depositAmount} onChange={set("depositAmount")} required />
          </FormField>
          <FormField label={t.eventForm.surchargeNonMemberAdult}>
            <Input type="number" min="0" step="0.01" value={form.surchargeNonMemberAdult} onChange={set("surchargeNonMemberAdult")} />
          </FormField>
          <FormField label={t.eventForm.surchargeNonMemberChild}>
            <Input type="number" min="0" step="0.01" value={form.surchargeNonMemberChild} onChange={set("surchargeNonMemberChild")} />
          </FormField>
          <FormField label={t.eventForm.busSurcharge}>
            <Input type="number" min="0" step="0.01" value={form.busSurcharge} onChange={set("busSurcharge")} />
          </FormField>
          <FormField label={t.eventForm.roomSingleSurcharge}>
            <Input type="number" min="0" step="0.01" value={form.roomSingleSurcharge} onChange={set("roomSingleSurcharge")} />
          </FormField>
          <FormField label={t.eventForm.roomDoubleSurcharge}>
            <Input type="number" min="0" step="0.01" value={form.roomDoubleSurcharge} onChange={set("roomDoubleSurcharge")} />
          </FormField>
        </div>

        {/* Age-based prices */}
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-700 mb-2">{t.eventForm.agePricesSection}</p>
          <div className="flex flex-col gap-2">
            {form.agePrices.map((ap, i) => (
              <div key={i} className="flex gap-2 items-center">
                <Input
                  placeholder={t.eventForm.agePriceLabel}
                  value={ap.label}
                  onChange={(e) => setForm((f) => {
                    const agePrices = [...f.agePrices];
                    agePrices[i] = { ...agePrices[i], label: e.target.value };
                    return { ...f, agePrices };
                  })}
                  className="flex-1"
                />
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder={t.eventForm.agePriceAmount}
                  value={ap.price}
                  onChange={(e) => setForm((f) => {
                    const agePrices = [...f.agePrices];
                    agePrices[i] = { ...agePrices[i], price: e.target.value };
                    return { ...f, agePrices };
                  })}
                  className="w-28"
                />
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, agePrices: f.agePrices.filter((_, idx) => idx !== i) }))}
                  className="text-red-400 hover:text-red-600 text-xs shrink-0"
                >
                  {t.eventForm.agePriceRemove}
                </button>
              </div>
            ))}
          </div>
          {form.agePrices.length < 10 && (
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, agePrices: [...f.agePrices, { label: "", price: "0" }] }))}
              className="mt-2 text-xs text-[#4577ac] hover:underline"
            >
              + {t.eventForm.agePriceAdd}
            </button>
          )}
        </div>
      </div>
      )}

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
