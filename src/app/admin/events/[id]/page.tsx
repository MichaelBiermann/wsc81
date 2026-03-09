"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { notFound } from "next/navigation";
import EventForm from "../EventForm";
import EventMailSection from "@/components/admin/EventMailSection";
import { useAdminI18n } from "@/components/admin/AdminI18nProvider";

interface Booking {
  id: string;
  person1Name: string; person1Dob: string;
  person2Name: string | null; person2Dob: string | null;
  person3Name: string | null; person3Dob: string | null;
  person4Name: string | null; person4Dob: string | null;
  person5Name: string | null; person5Dob: string | null;
  person6Name: string | null; person6Dob: string | null;
  person7Name: string | null; person7Dob: string | null;
  person8Name: string | null; person8Dob: string | null;
  person9Name: string | null; person9Dob: string | null;
  person10Name: string | null; person10Dob: string | null;
  email: string;
  phone: string;
  street: string;
  postalCode: string;
  city: string;
  isMember: boolean;
  remarks: string | null;
  createdAt: string;
  roomsSingle: number;
  roomsDouble: number;
  stripePaymentIntentId: string | null;
  balanceDue: string | null;
}

interface EventDetail {
  id: string;
  titleDe: string;
  titleEn: string;
  descriptionDe: string;
  descriptionEn: string;
  location: string;
  organisation: string | null;
  organisationEmail: string | null;
  organisationPhone: string | null;
  startDate: string;
  endDate: string;
  depositAmount: string;
  totalAmount: string;
  maxParticipants: number | null;
  registrationDeadline: string | null;
  imageUrl: string | null;
  bookable: boolean;
  soldOut: boolean;
  surchargeNonMemberAdult: string;
  surchargeNonMemberChild: string;
  busSurcharge: string;
  roomSingleSurcharge: string;
  roomDoubleSurcharge: string;
  agePrices: Array<{ label: string; price: number }>;
  bookings: Booking[];
}

interface SentMail {
  id: string;
  purpose: string;
  subject: string;
  recipientCount: number;
  sentAt: string;
}

const toDatetimeLocal = (d: string) => new Date(d).toISOString().slice(0, 16);

export default function EditEventPage() {
  const { t } = useAdminI18n();
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [sentMails, setSentMails] = useState<SentMail[]>([]);

  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/events/${id}`).then((r) => { if (!r.ok) { notFound(); return null; } return r.json(); }),
      fetch(`/api/admin/events/${id}/mail`).then((r) => r.ok ? r.json() : []),
    ]).then(([eventData, mailData]) => {
      if (eventData) setEvent(eventData);
      setSentMails(mailData ?? []);
      setLoading(false);
    });
  }, [id]);

  async function deleteBooking(bookingId: string) {
    if (!confirm(t.events.deleteBookingConfirm)) return;
    await fetch(`/api/admin/bookings/${bookingId}`, { method: "DELETE" });
    setEvent((prev) => prev ? { ...prev, bookings: prev.bookings.filter((b) => b.id !== bookingId) } : prev);
  }

  if (loading) return <div className="text-gray-400">…</div>;
  if (!event) return null;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{t.events.editTitle}</h1>
      <p className="text-gray-500 text-sm mb-6">{event.titleDe}</p>

      <EventForm
        eventId={id}
        initial={{
          titleDe: event.titleDe,
          titleEn: event.titleEn,
          descriptionDe: event.descriptionDe,
          descriptionEn: event.descriptionEn,
          location: event.location,
          organisation: event.organisation ?? "",
          organisationEmail: event.organisationEmail ?? "",
          organisationPhone: event.organisationPhone ?? "",
          startDate: toDatetimeLocal(event.startDate),
          endDate: toDatetimeLocal(event.endDate),
          depositAmount: String(event.depositAmount),
          maxParticipants: event.maxParticipants ? String(event.maxParticipants) : "",
          registrationDeadline: event.registrationDeadline ? toDatetimeLocal(event.registrationDeadline) : "",
          imageUrl: event.imageUrl ?? "",
          bookable: event.bookable,
          soldOut: event.soldOut,
          surchargeNonMemberAdult: String(event.surchargeNonMemberAdult),
          surchargeNonMemberChild: String(event.surchargeNonMemberChild),
          busSurcharge: String(event.busSurcharge),
          roomSingleSurcharge: String(event.roomSingleSurcharge),
          roomDoubleSurcharge: String(event.roomDoubleSurcharge),
          agePrices: (Array.isArray(event.agePrices) ? event.agePrices : []).map((ap: { label: string; price: number; minAge?: number | null; maxAge?: number | null }) => ({
            label: ap.label,
            price: String(ap.price),
            minAge: ap.minAge != null ? String(ap.minAge) : "",
            maxAge: ap.maxAge != null ? String(ap.maxAge) : "",
          })),
        }}
      />

      {event.bookings.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900">{t.events.bookings} ({event.bookings.length})</h2>
            <a
              href={`/api/admin/events/${id}/pdf`}
              download
              className="inline-flex items-center gap-1.5 rounded-md bg-[#4577ac] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#3a6699] transition-colors"
            >
              <span className="material-symbols-rounded text-base leading-none">download</span>
              {t.events.downloadPdf}
            </a>
          </div>

          {/* Summary bar */}
          {(() => {
            const totalPersons = event.bookings.reduce((sum, b) => sum + [
              b.person1Name, b.person2Name, b.person3Name, b.person4Name, b.person5Name,
              b.person6Name, b.person7Name, b.person8Name, b.person9Name, b.person10Name,
            ].filter(Boolean).length, 0);
            const totalSingle = event.bookings.reduce((sum, b) => sum + b.roomsSingle, 0);
            const totalDouble = event.bookings.reduce((sum, b) => sum + b.roomsDouble, 0);
            const totalDeposits = event.bookings.filter((b) => b.stripePaymentIntentId).length;
            const totalBalanceDue = event.bookings.reduce((sum, b) => sum + (b.balanceDue ? Number(b.balanceDue) : 0), 0);
            const depositAmount = Number(event.depositAmount);
            const totalCollected = totalDeposits * depositAmount;
            return (
              <div className="flex flex-wrap gap-4 mb-4 rounded-lg bg-[#eef3f9] px-4 py-3 text-sm">
                <span className="flex items-center gap-1.5 text-gray-700">
                  <span className="material-symbols-rounded text-[#4577ac]" style={{ fontSize: 18 }}>group</span>
                  <span className="font-medium">{totalPersons}</span> Personen gesamt
                </span>
                <span className="flex items-center gap-1.5 text-gray-700">
                  <span className="material-symbols-rounded text-[#4577ac]" style={{ fontSize: 18 }}>single_bed</span>
                  <span className="font-medium">{totalSingle}</span> Einzelzimmer
                </span>
                <span className="flex items-center gap-1.5 text-gray-700">
                  <span className="material-symbols-rounded text-[#4577ac]" style={{ fontSize: 18 }}>bed</span>
                  <span className="font-medium">{totalDouble}</span> Doppelzimmer
                </span>
                {depositAmount > 0 && (
                  <span className="flex items-center gap-1.5 text-gray-700">
                    <span className="material-symbols-rounded text-green-600" style={{ fontSize: 18 }}>payments</span>
                    Anzahlungen: <span className="font-medium text-green-700">€{totalCollected.toFixed(2)}</span>
                    <span className="text-gray-400">({totalDeposits}/{event.bookings.length})</span>
                  </span>
                )}
                {totalBalanceDue > 0 && (
                  <span className="flex items-center gap-1.5 text-gray-700">
                    <span className="material-symbols-rounded text-yellow-600" style={{ fontSize: 18 }}>schedule</span>
                    Restbeträge offen: <span className="font-medium text-yellow-700">€{totalBalanceDue.toFixed(2)}</span>
                  </span>
                )}
              </div>
            );
          })()}
          <div className="flex flex-col gap-4">
            {event.bookings.map((b, idx) => {
              const persons = [
                { name: b.person1Name, dob: b.person1Dob },
                { name: b.person2Name, dob: b.person2Dob },
                { name: b.person3Name, dob: b.person3Dob },
                { name: b.person4Name, dob: b.person4Dob },
                { name: b.person5Name, dob: b.person5Dob },
                { name: b.person6Name, dob: b.person6Dob },
                { name: b.person7Name, dob: b.person7Dob },
                { name: b.person8Name, dob: b.person8Dob },
                { name: b.person9Name, dob: b.person9Dob },
                { name: b.person10Name, dob: b.person10Dob },
              ].filter((p): p is { name: string; dob: string } => !!p.name);

              function calcAge(dob: string | null): string {
                if (!dob) return "—";
                const ref = new Date(event!.startDate);
                const d = new Date(dob);
                let age = ref.getFullYear() - d.getFullYear();
                const m = ref.getMonth() - d.getMonth();
                if (m < 0 || (m === 0 && ref.getDate() < d.getDate())) age--;
                return String(age);
              }

              return (
                <div key={b.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <span className="text-xs text-gray-400 mr-1">#{idx + 1}</span>
                      <span className="font-semibold text-gray-900">{b.person1Name}</span>
                      {b.isMember && (
                        <span className="ml-2 inline-flex items-center gap-0.5 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                          <span className="material-symbols-rounded" style={{ fontSize: 12 }}>verified</span>
                          Mitglied
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        {new Date(b.createdAt).toLocaleDateString("de-DE")}
                      </span>
                      <button
                        onClick={() => deleteBooking(b.id)}
                        className="text-xs text-red-500 hover:text-red-700 hover:underline"
                      >
                        {t.delete}
                      </button>
                    </div>
                  </div>

                  <table className="w-full text-sm mb-3">
                    <thead>
                      <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                        <th className="pb-1 pr-3 font-medium w-6">#</th>
                        <th className="pb-1 pr-3 font-medium">Name</th>
                        <th className="pb-1 pr-3 font-medium">Geburtsdatum</th>
                        <th className="pb-1 font-medium">Alter</th>
                      </tr>
                    </thead>
                    <tbody>
                      {persons.map((p, pi) => (
                        <tr key={pi} className="border-b border-gray-50 last:border-0">
                          <td className="py-1 pr-3 text-gray-400">{pi + 1}.</td>
                          <td className="py-1 pr-3 text-gray-800">{p.name}</td>
                          <td className="py-1 pr-3 text-gray-500">{p.dob ? new Date(p.dob).toLocaleDateString("de-DE") : "—"}</td>
                          <td className="py-1 text-gray-500">{calcAge(p.dob)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-500">
                    <span><span className="font-medium text-gray-600">E-Mail:</span> {b.email}</span>
                    <span><span className="font-medium text-gray-600">Tel:</span> {b.phone || "—"}</span>
                    <span><span className="font-medium text-gray-600">Adresse:</span> {b.street}, {b.postalCode} {b.city}</span>
                    {(b.roomsSingle > 0 || b.roomsDouble > 0) && (
                      <span>
                        <span className="font-medium text-gray-600">Zimmer:</span>{" "}
                        {[b.roomsSingle > 0 ? `EZ: ${b.roomsSingle}` : "", b.roomsDouble > 0 ? `DZ: ${b.roomsDouble}` : ""].filter(Boolean).join(" · ")}
                      </span>
                    )}
                  </div>
                  {b.remarks && (
                    <p className="mt-2 text-xs text-gray-500 italic">„{b.remarks}"</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {b.stripePaymentIntentId ? (
                      <>
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                          <span className="material-symbols-rounded" style={{ fontSize: 12 }}>check_circle</span>
                          Anzahlung: €{Number(event!.depositAmount).toFixed(2)}
                        </span>
                        {b.balanceDue !== null && Number(b.balanceDue) > 0 ? (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
                            <span className="material-symbols-rounded" style={{ fontSize: 12 }}>schedule</span>
                            Restbetrag: €{Number(b.balanceDue).toFixed(2)}
                          </span>
                        ) : b.balanceDue !== null ? (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                            <span className="material-symbols-rounded" style={{ fontSize: 12 }}>check_circle</span>
                            Vollständig bezahlt
                          </span>
                        ) : null}
                      </>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                        Kostenlos / keine Zahlung
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <EventMailSection
        eventId={id}
        eventTitleDe={event.titleDe}
        eventDescriptionDe={event.descriptionDe}
        eventLocation={event.location}
        eventStartDate={event.startDate}
        eventEndDate={event.endDate}
        organisation={event.organisation}
        organisationEmail={event.organisationEmail}
        organisationPhone={event.organisationPhone}
        bookings={event.bookings.map((b) => ({ id: b.id, person1Name: b.person1Name, email: b.email }))}
        initialMails={sentMails}
      />
    </div>
  );
}
