"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { notFound } from "next/navigation";
import EventForm from "../EventForm";
import { useAdminI18n } from "@/components/admin/AdminI18nProvider";

interface Booking {
  id: string;
  person1Name: string;
  email: string;
  isMember: boolean;
  createdAt: string;
  roomsSingle: number;
  roomsDouble: number;
}

interface EventDetail {
  id: string;
  titleDe: string;
  titleEn: string;
  descriptionDe: string;
  descriptionEn: string;
  location: string;
  startDate: string;
  endDate: string;
  depositAmount: string;
  totalAmount: string;
  maxParticipants: number | null;
  registrationDeadline: string | null;
  imageUrl: string | null;
  bookable: boolean;
  surchargeNonMemberAdult: string;
  surchargeNonMemberChild: string;
  busSurcharge: string;
  roomSingleSurcharge: string;
  roomDoubleSurcharge: string;
  agePrices: Array<{ label: string; price: number }>;
  bookings: Booking[];
}

const toDatetimeLocal = (d: string) => new Date(d).toISOString().slice(0, 16);

export default function EditEventPage() {
  const { t } = useAdminI18n();
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/events/${id}`)
      .then((r) => {
        if (!r.ok) { notFound(); return null; }
        return r.json();
      })
      .then((data) => { if (data) { setEvent(data); } setLoading(false); });
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
          startDate: toDatetimeLocal(event.startDate),
          endDate: toDatetimeLocal(event.endDate),
          depositAmount: String(event.depositAmount),
          maxParticipants: event.maxParticipants ? String(event.maxParticipants) : "",
          registrationDeadline: event.registrationDeadline ? toDatetimeLocal(event.registrationDeadline) : "",
          imageUrl: event.imageUrl ?? "",
          bookable: event.bookable,
          surchargeNonMemberAdult: String(event.surchargeNonMemberAdult),
          surchargeNonMemberChild: String(event.surchargeNonMemberChild),
          busSurcharge: String(event.busSurcharge),
          roomSingleSurcharge: String(event.roomSingleSurcharge),
          roomDoubleSurcharge: String(event.roomDoubleSurcharge),
          agePrices: (Array.isArray(event.agePrices) ? event.agePrices : []).map((ap: { label: string; price: number }) => ({
            label: ap.label,
            price: String(ap.price),
          })),
        }}
      />

      {event.bookings.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
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
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">{t.events.colName}</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">{t.events.colEmail}</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">{t.events.colMember}</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Zimmer</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">{t.events.colDate2}</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {event.bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{b.person1Name}</td>
                    <td className="px-4 py-3 text-gray-600">{b.email}</td>
                    <td className="px-4 py-3">{b.isMember ? "✅" : "—"}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {b.roomsSingle > 0 && <span>EZ: {b.roomsSingle}</span>}
                      {b.roomsSingle > 0 && b.roomsDouble > 0 && <span className="mx-1">·</span>}
                      {b.roomsDouble > 0 && <span>DZ: {b.roomsDouble}</span>}
                      {b.roomsSingle === 0 && b.roomsDouble === 0 && <span>—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{new Date(b.createdAt).toLocaleDateString("de-DE")}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => deleteBooking(b.id)}
                        className="text-xs text-red-500 hover:text-red-700 hover:underline"
                      >
                        {t.delete}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
