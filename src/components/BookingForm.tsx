"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import FormField from "@/components/ui/FormField";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";

interface PersonData { name: string; dob: string; isMember: boolean; agePriceIndex: number | null; }
interface FormState {
  persons: PersonData[];
  street: string; postalCode: string; city: string; phone: string; email: string;
  remarks: string;
  roomsSingle: number; roomsDouble: number;
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

interface EventProps {
  id: string;
  titleDe: string;
  titleEn: string;
  depositAmount: number;
  registrationDeadline: string | null;
  surchargeNonMemberAdult: number;
  surchargeNonMemberChild: number;
  busSurcharge: number;
  roomSingleSurcharge: number;
  roomDoubleSurcharge: number;
  agePrices: { label: string; price: number; minAge?: number | null; maxAge?: number | null }[];
}

function calcAge(dob: string): number {
  if (!dob) return 99;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function matchAgeTier(dob: string, agePrices: EventProps["agePrices"]): number | null {
  if (!dob || agePrices.length === 0) return null;
  const age = calcAge(dob);
  const idx = agePrices.findIndex((ap) => {
    const aboveMin = ap.minAge == null || age >= ap.minAge;
    const belowMax = ap.maxAge == null || age <= ap.maxAge;
    return aboveMin && belowMax;
  });
  return idx >= 0 ? idx : null;
}

export default function BookingForm({
  event,
  locale,
  prefill,
}: {
  event: EventProps;
  locale: string;
  prefill?: Prefill;
}) {
  const t = useTranslations("Booking");
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [form, setForm] = useState<FormState>({
    persons: [{ name: prefill?.person1Name ?? "", dob: prefill?.person1Dob ?? "", isMember: prefill?.isMember ?? false, agePriceIndex: matchAgeTier(prefill?.person1Dob ?? "", event.agePrices) }],
    street: prefill?.street ?? "",
    postalCode: prefill?.postalCode ?? "",
    city: prefill?.city ?? "",
    phone: prefill?.phone ?? "",
    email: prefill?.email ?? "",
    remarks: "",
    roomsSingle: 0,
    roomsDouble: 0,
  });

  const updatePerson = (i: number, field: keyof PersonData, value: string | boolean | number | null) => {
    setForm((f) => {
      const persons = [...f.persons];
      persons[i] = { ...persons[i], [field]: value };
      // Auto-match age tier when DOB changes
      if (field === "dob" && typeof value === "string") {
        persons[i].agePriceIndex = matchAgeTier(value, event.agePrices);
      }
      return { ...f, persons };
    });
  };

  const addPerson = () => {
    if (form.persons.length < 10) setForm((f) => ({ ...f, persons: [...f.persons, { name: "", dob: "", isMember: false, agePriceIndex: null }] }));
  };
  const removePerson = (i: number) => {
    if (i === 0) return;
    setForm((f) => ({ ...f, persons: f.persons.filter((_, idx) => idx !== i) }));
  };

  const isFree = event.depositAmount === 0 &&
    event.surchargeNonMemberAdult === 0 &&
    event.surchargeNonMemberChild === 0 &&
    event.busSurcharge === 0 &&
    event.roomSingleSurcharge === 0 &&
    event.roomDoubleSurcharge === 0 &&
    event.agePrices.length === 0;

  function calcPricing(): { lines: { label: string; amount: number }[]; total: number; deposit: number; remaining: number } {
    const lines: { label: string; amount: number }[] = [];
    let total = 0;

    const namedPersons = form.persons.filter((p) => p.name.trim() !== "");

    for (const person of namedPersons) {
      const age = calcAge(person.dob);

      // Age-based price tier (mutually exclusive with non-member surcharge)
      if (person.agePriceIndex !== null && event.agePrices[person.agePriceIndex]) {
        const ap = event.agePrices[person.agePriceIndex];
        if (ap.price > 0) {
          lines.push({ label: `${person.name || "Person"} – ${ap.label}`, amount: ap.price });
          total += ap.price;
        }
      } else if (!person.isMember) {
        const surcharge = age < 18
          ? event.surchargeNonMemberChild
          : event.surchargeNonMemberAdult;
        if (surcharge > 0) {
          const surchargeLabel = age < 18 ? t("surchargeNonMemberChild") : t("surchargeNonMemberAdult");
          lines.push({ label: `${person.name || "Person"} – ${surchargeLabel}`, amount: surcharge });
          total += surcharge;
        }
      }

      if (event.busSurcharge > 0) {
        lines.push({ label: `${person.name || "Person"} – ${t("busSurcharge")}`, amount: event.busSurcharge });
        total += event.busSurcharge;
      }
    }

    if (form.roomsSingle > 0 && event.roomSingleSurcharge > 0) {
      const roomTotal = form.roomsSingle * event.roomSingleSurcharge;
      lines.push({ label: `${form.roomsSingle}× ${t("fields.roomsSingle")} (${t("roomSingleSurcharge")})`, amount: roomTotal });
      total += roomTotal;
    }

    if (form.roomsDouble > 0 && event.roomDoubleSurcharge > 0) {
      const roomTotal = form.roomsDouble * 2 * event.roomDoubleSurcharge;
      lines.push({ label: `${form.roomsDouble}× ${t("fields.roomsDouble")} (${t("roomDoubleSurcharge")})`, amount: roomTotal });
      total += roomTotal;
    }

    const deposit = event.depositAmount;
    const remaining = Math.max(0, total - deposit);
    return { lines, total, deposit, remaining };
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");

    const [p1, p2, p3, p4, p5, p6, p7, p8, p9, p10] = form.persons;
    const body = {
      eventId: event.id,
      person1: { name: p1.name, dob: p1.dob, isMember: p1.isMember, agePriceIndex: p1.agePriceIndex ?? null },
      person2: p2?.name ? { name: p2.name, dob: p2.dob, isMember: p2.isMember, agePriceIndex: p2.agePriceIndex ?? null } : undefined,
      person3: p3?.name ? { name: p3.name, dob: p3.dob, isMember: p3.isMember, agePriceIndex: p3.agePriceIndex ?? null } : undefined,
      person4: p4?.name ? { name: p4.name, dob: p4.dob, isMember: p4.isMember, agePriceIndex: p4.agePriceIndex ?? null } : undefined,
      person5: p5?.name ? { name: p5.name, dob: p5.dob, isMember: p5.isMember, agePriceIndex: p5.agePriceIndex ?? null } : undefined,
      person6: p6?.name ? { name: p6.name, dob: p6.dob, isMember: p6.isMember, agePriceIndex: p6.agePriceIndex ?? null } : undefined,
      person7: p7?.name ? { name: p7.name, dob: p7.dob, isMember: p7.isMember, agePriceIndex: p7.agePriceIndex ?? null } : undefined,
      person8: p8?.name ? { name: p8.name, dob: p8.dob, isMember: p8.isMember, agePriceIndex: p8.agePriceIndex ?? null } : undefined,
      person9: p9?.name ? { name: p9.name, dob: p9.dob, isMember: p9.isMember, agePriceIndex: p9.agePriceIndex ?? null } : undefined,
      person10: p10?.name ? { name: p10.name, dob: p10.dob, isMember: p10.isMember, agePriceIndex: p10.agePriceIndex ?? null } : undefined,
      street: form.street, postalCode: form.postalCode, city: form.city,
      phone: form.phone, email: form.email,
      remarks: form.remarks || undefined,
      roomsSingle: form.roomsSingle, roomsDouble: form.roomsDouble,
      locale,
    };

    const res = await fetch("/api/booking/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.free) {
        router.push(data.redirectUrl);
      } else if (data.url) {
        window.location.href = data.url;
      }
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

  const personLabels = [
    t("person1"), t("person2"), t("person3"), t("person4"), t("person5"),
    t("person6"), t("person7"), t("person8"), t("person9"), t("person10"),
  ];

  const pricing = isFree ? null : calcPricing();

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Participants */}
      {form.persons.map((person, i) => (
        <fieldset key={i} className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between mb-3">
            <legend className="font-semibold text-gray-800 float-left">{personLabels[i]}</legend>
            {i > 0 && (
              <button
                type="button"
                onClick={() => removePerson(i)}
                aria-label={`${personLabels[i]} ${t("removePerson")}`}
                className="text-xs text-red-500 hover:text-red-700"
              >
                {t("removePerson")}
              </button>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label={t("fields.name")} htmlFor={`person-${i}-name`} required={i === 0}>
              <Input
                id={`person-${i}-name`}
                value={person.name}
                onChange={(e) => updatePerson(i, "name", e.target.value)}
                required={i === 0}
              />
            </FormField>
            <FormField label={t("fields.dob")} htmlFor={`person-${i}-dob`} required={i === 0}>
              <Input
                id={`person-${i}-dob`}
                type="date"
                value={person.dob}
                onChange={(e) => updatePerson(i, "dob", e.target.value)}
                required={i === 0}
              />
            </FormField>
          </div>
          <label htmlFor={`person-${i}-member`} className="flex items-center gap-2 cursor-pointer mt-3">
            <input
              id={`person-${i}-member`}
              type="checkbox"
              checked={person.isMember}
              onChange={(e) => updatePerson(i, "isMember", e.target.checked)}
              className="w-4 h-4 accent-[#4577ac]"
              disabled={i === 0 && prefill?.isMember === true}
            />
            <span className="text-sm">{t("fields.isMemberPerson")}</span>
            {i === 0 && prefill?.isMember === true && (
              <span className="text-xs text-green-600 ml-1">(automatisch — Mitglied)</span>
            )}
          </label>
          {event.agePrices.length > 0 && person.dob && person.agePriceIndex !== null && event.agePrices[person.agePriceIndex] && (
            <p className="mt-2 text-xs text-[#4577ac]">
              <span className="material-symbols-rounded align-middle mr-0.5" style={{ fontSize: 14 }} aria-hidden="true">sell</span>
              {event.agePrices[person.agePriceIndex].label} – €{event.agePrices[person.agePriceIndex].price.toFixed(2)}
            </p>
          )}
        </fieldset>
      ))}

      {form.persons.length < 10 && (
        <button type="button" onClick={addPerson} className="self-start text-sm text-[#4577ac] hover:underline">
          + {t("addPerson")}
        </button>
      )}

      {/* Contact */}
      <fieldset className="rounded-lg border border-gray-200 bg-white p-4">
        <legend className="font-semibold text-gray-800 mb-3">Kontakt</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField label={t("fields.street")} htmlFor="contact-street" required>
            <Input id="contact-street" value={form.street} onChange={(e) => setForm((f) => ({ ...f, street: e.target.value }))} required />
          </FormField>
          <FormField label={t("fields.postalCode")} htmlFor="contact-postalCode" required>
            <Input id="contact-postalCode" value={form.postalCode} onChange={(e) => setForm((f) => ({ ...f, postalCode: e.target.value }))} pattern="\d{5}" required />
          </FormField>
          <FormField label={t("fields.city")} htmlFor="contact-city" required>
            <Input id="contact-city" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} required />
          </FormField>
          <FormField label={t("fields.phone")} htmlFor="contact-phone" required>
            <Input id="contact-phone" type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} required />
          </FormField>
          <FormField label={t("fields.email")} htmlFor="contact-email" required>
            <Input id="contact-email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required className="sm:col-span-2" />
          </FormField>
        </div>
      </fieldset>

      {/* Room selection + price summary */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        {/* Room selection */}
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2" id="rooms-label">{t("fields.rooms")}</p>
          <div className="grid grid-cols-2 gap-3" role="group" aria-labelledby="rooms-label">
            <div className="flex items-center gap-2">
              <span id="rooms-single-label" className="text-sm text-gray-600 w-28 shrink-0">{t("fields.roomsSingle")}</span>
              <div className="flex items-center border border-gray-300 rounded overflow-hidden" role="group" aria-labelledby="rooms-single-label">
                <button type="button" onClick={() => setForm((f) => ({ ...f, roomsSingle: Math.max(0, f.roomsSingle - 1) }))} aria-label={`${t("fields.roomsSingle")} verringern`} className="px-2 py-1 text-gray-500 hover:bg-gray-100 text-base leading-none">−</button>
                <span className="px-3 py-1 text-sm min-w-[2rem] text-center" aria-live="polite" aria-atomic="true">{form.roomsSingle}</span>
                <button type="button" onClick={() => setForm((f) => ({ ...f, roomsSingle: f.roomsSingle + 1 }))} aria-label={`${t("fields.roomsSingle")} erhöhen`} className="px-2 py-1 text-gray-500 hover:bg-gray-100 text-base leading-none">+</button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span id="rooms-double-label" className="text-sm text-gray-600 w-28 shrink-0">{t("fields.roomsDouble")}</span>
              <div className="flex items-center border border-gray-300 rounded overflow-hidden" role="group" aria-labelledby="rooms-double-label">
                <button type="button" onClick={() => setForm((f) => ({ ...f, roomsDouble: Math.max(0, f.roomsDouble - 1) }))} aria-label={`${t("fields.roomsDouble")} verringern`} className="px-2 py-1 text-gray-500 hover:bg-gray-100 text-base leading-none">−</button>
                <span className="px-3 py-1 text-sm min-w-[2rem] text-center" aria-live="polite" aria-atomic="true">{form.roomsDouble}</span>
                <button type="button" onClick={() => setForm((f) => ({ ...f, roomsDouble: f.roomsDouble + 1 }))} aria-label={`${t("fields.roomsDouble")} erhöhen`} className="px-2 py-1 text-gray-500 hover:bg-gray-100 text-base leading-none">+</button>
              </div>
            </div>
          </div>
        </div>

        {pricing && (
          <div className="bg-[#eef3f9] rounded p-3 text-sm">
            <p className="font-semibold mb-2">{t("priceSummary")}</p>
            {pricing.lines.length === 0 ? (
              <p className="text-gray-500 text-xs">{t("noSurcharges")}</p>
            ) : (
              pricing.lines.map((line, idx) => (
                <div key={idx} className="flex justify-between py-0.5">
                  <span className="text-gray-700">{line.label}</span>
                  <span>€{line.amount.toFixed(2)}</span>
                </div>
              ))
            )}
            <div className="flex justify-between font-bold border-t border-gray-300 mt-2 pt-2">
              <span>{t("totalSurcharges")}</span><span>€{pricing.total.toFixed(2)}</span>
            </div>
            {pricing.deposit > 0 && (
              <div className="flex justify-between text-gray-600 mt-1">
                <span>{t("depositDue")}</span><span>€{pricing.deposit.toFixed(2)}</span>
              </div>
            )}
            {pricing.remaining > 0 && (
              <div className="flex justify-between text-gray-500 text-xs mt-0.5">
                <span>{t("remainingDue")}</span><span>€{pricing.remaining.toFixed(2)}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Remarks */}
      <FormField label={t("fields.remarks")} htmlFor="booking-remarks">
        <Textarea id="booking-remarks" value={form.remarks} onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))} />
      </FormField>

      {/* Payment info */}
      {!isFree && (
      <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-800">
        <p className="font-semibold mb-1">{t("payment.title")}</p>
        <p className="text-xs text-blue-600">{t("payment.depositNote")}</p>
      </div>
      )}

      {/* Terms */}
      <p className="text-xs text-gray-500">{t("terms")}</p>

      {status === "error" && <Alert variant="error">{errorMsg}</Alert>}

      <Button type="submit" loading={status === "submitting"} className="w-full">
        {isFree ? t("submit") : t("submitPay", { amount: event.depositAmount.toFixed(2) })}
      </Button>
    </form>
  );
}
