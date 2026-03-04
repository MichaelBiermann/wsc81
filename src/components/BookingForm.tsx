"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";

interface PersonData { name: string; dob: string; }
interface FormState {
  persons: PersonData[];
  street: string; postalCode: string; city: string; phone: string; email: string;
  isMember: boolean; remarks: string;
}

interface Prefill {
  person1Name?: string;
  person1Dob?: string;
  street?: string;
  postalCode?: string;
  city?: string;
  phone?: string;
  email?: string;
  isMember?: boolean;
}

const NON_MEMBER_SURCHARGE = 40;

export default function BookingForm({
  event,
  locale,
  prefill,
}: {
  event: { id: string; titleDe: string; titleEn: string; totalAmount: number; depositAmount: number; registrationDeadline: string | null };
  locale: string;
  prefill?: Prefill;
}) {
  const t = useTranslations("Booking");
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [form, setForm] = useState<FormState>({
    persons: [{ name: prefill?.person1Name ?? "", dob: prefill?.person1Dob ?? "" }],
    street: prefill?.street ?? "",
    postalCode: prefill?.postalCode ?? "",
    city: prefill?.city ?? "",
    phone: prefill?.phone ?? "",
    email: prefill?.email ?? "",
    isMember: prefill?.isMember ?? false,
    remarks: "",
  });

  const updatePerson = (i: number, field: keyof PersonData, value: string) => {
    setForm((f) => {
      const persons = [...f.persons];
      persons[i] = { ...persons[i], [field]: value };
      return { ...f, persons };
    });
  };

  const addPerson = () => {
    if (form.persons.length < 5) setForm((f) => ({ ...f, persons: [...f.persons, { name: "", dob: "" }] }));
  };
  const removePerson = (i: number) => {
    if (i === 0) return;
    setForm((f) => ({ ...f, persons: f.persons.filter((_, idx) => idx !== i) }));
  };

  const isFree = event.totalAmount === 0;
  const totalWithSurcharge = event.totalAmount + (!isFree && !form.isMember ? NON_MEMBER_SURCHARGE : 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");

    const [p1, p2, p3, p4, p5] = form.persons;
    const body = {
      eventId: event.id,
      person1: p1,
      person2: p2?.name ? p2 : undefined,
      person3: p3?.name ? p3 : undefined,
      person4: p4?.name ? p4 : undefined,
      person5: p5?.name ? p5 : undefined,
      street: form.street, postalCode: form.postalCode, city: form.city,
      phone: form.phone, email: form.email,
      isMember: form.isMember, remarks: form.remarks || undefined,
      locale,
    };

    const res = await fetch("/api/booking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      router.push(`/${locale}/events/${event.id}/book/success?email=${encodeURIComponent(form.email)}`);
    } else {
      const data = await res.json();
      setStatus("error");
      if (res.status === 401 || data.error === "unauthorized") {
        setErrorMsg(t("errors.unauthorized"));
      } else if (data.error === "deadline_passed") {
        setErrorMsg(t("errors.deadlinePassed"));
      } else {
        setErrorMsg(t("errors.generic"));
      }
    }
  };

  const personLabels = [t("person1"), t("person2"), t("person3"), t("person4"), t("person5")];

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Participants */}
      {form.persons.map((person, i) => (
        <div key={i} className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">{personLabels[i]}</h3>
            {i > 0 && (
              <button type="button" onClick={() => removePerson(i)} className="text-xs text-red-500 hover:text-red-700">
                {t("removePerson")}
              </button>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label={t("fields.name")} required={i === 0}>
              <Input
                value={person.name}
                onChange={(e) => updatePerson(i, "name", e.target.value)}
                required={i === 0}
              />
            </FormField>
            <FormField label={t("fields.dob")} required={i === 0}>
              <Input
                type="date"
                value={person.dob}
                onChange={(e) => updatePerson(i, "dob", e.target.value)}
                required={i === 0}
              />
            </FormField>
          </div>
        </div>
      ))}

      {form.persons.length < 5 && (
        <button type="button" onClick={addPerson} className="self-start text-sm text-[#4577ac] hover:underline">
          + {t("addPerson")}
        </button>
      )}

      {/* Contact */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <h3 className="font-semibold text-gray-800 mb-3">Kontakt</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label={t("fields.street")} required>
            <Input value={form.street} onChange={(e) => setForm((f) => ({ ...f, street: e.target.value }))} required />
          </FormField>
          <FormField label={t("fields.postalCode")} required>
            <Input value={form.postalCode} onChange={(e) => setForm((f) => ({ ...f, postalCode: e.target.value }))} pattern="\d{5}" required />
          </FormField>
          <FormField label={t("fields.city")} required>
            <Input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} required />
          </FormField>
          <FormField label={t("fields.phone")} required>
            <Input type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} required />
          </FormField>
          <FormField label={t("fields.email")} required>
            <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required className="sm:col-span-2" />
          </FormField>
        </div>
      </div>

      {/* Member checkbox + price summary */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <label className="flex items-center gap-2 cursor-pointer mb-4">
          <input
            type="checkbox"
            checked={form.isMember}
            onChange={(e) => setForm((f) => ({ ...f, isMember: e.target.checked }))}
            className="w-4 h-4 accent-[#4577ac]"
            disabled={prefill?.isMember === true}
          />
          <span className="text-sm">{t("fields.isMember")}</span>
          {prefill?.isMember === true && (
            <span className="text-xs text-green-600 ml-1">(automatisch — Mitglied)</span>
          )}
        </label>

        {!isFree && (
        <div className="bg-[#eef3f9] rounded p-3 text-sm">
          <p className="font-semibold mb-1">{t("priceSummary")}</p>
          <div className="flex justify-between"><span>{t("basePrice")}</span><span>€{event.totalAmount.toFixed(2)}</span></div>
          {!form.isMember && (
            <div className="flex justify-between text-orange-600"><span>{t("surcharge")}</span><span>+€{NON_MEMBER_SURCHARGE.toFixed(2)}</span></div>
          )}
          <div className="flex justify-between font-bold border-t border-gray-300 mt-2 pt-2">
            <span>{t("totalPrice")}</span><span>€{totalWithSurcharge.toFixed(2)}</span>
          </div>
        </div>
        )}
      </div>

      {/* Remarks */}
      <FormField label={t("fields.remarks")}>
        <Textarea value={form.remarks} onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))} />
      </FormField>

      {/* Payment info */}
      <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-800">
        <p className="font-semibold mb-1">{t("payment.title")}</p>
        <p>{t("payment.info")}</p>
        <p className="mt-1"><strong>{t("payment.bank")}</strong> · {t("payment.iban")} · {t("payment.bic")}</p>
        <p className="mt-1 text-xs text-blue-600">{t("payment.depositNote")}</p>
      </div>

      {/* Terms */}
      <p className="text-xs text-gray-500">{t("terms")}</p>

      {status === "error" && <Alert variant="error">{errorMsg}</Alert>}

      <Button type="submit" loading={status === "submitting"} className="w-full">
        {t("submit")}
      </Button>
    </form>
  );
}
