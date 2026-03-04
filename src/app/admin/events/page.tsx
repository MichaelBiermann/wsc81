"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAdminI18n } from "@/components/admin/AdminI18nProvider";

interface Event {
  id: string;
  titleDe: string;
  startDate: string;
  location: string;
  bookable: boolean;
  _count: { bookings: number };
}

export default function AdminEventsPage() {
  const { t } = useAdminI18n();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/events").then((r) => r.json()).then((data) => {
      setEvents(data);
      setLoading(false);
    });
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t.events.title}</h1>
        <Link href="/admin/events/new" className="rounded bg-[#4577ac] px-4 py-2 text-sm text-white hover:bg-[#2d5a8a] transition-colors">
          {t.events.newEvent}
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">{t.events.colTitle}</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">{t.events.colDate}</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">{t.events.colLocation}</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">{t.events.colBookable}</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">{t.events.colBookings}</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">{t.events.colActions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {events.map((event) => (
              <tr key={event.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{event.titleDe}</td>
                <td className="px-4 py-3 text-gray-600">
                  {new Date(event.startDate).toLocaleDateString("de-DE")}
                </td>
                <td className="px-4 py-3 text-gray-600">{event.location}</td>
                <td className="px-4 py-3">
                  {event.bookable ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                      <span className="material-symbols-rounded" style={{ fontSize: "12px" }}>check_circle</span>
                      {t.events.bookableYes}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                      <span className="material-symbols-rounded" style={{ fontSize: "12px" }}>info</span>
                      {t.events.bookableNo}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/events/${event.id}`} className="text-[#4577ac] hover:underline">
                    {event._count.bookings} {t.events.colBookings}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/events/${event.id}`} className="text-[#4577ac] hover:underline mr-3">{t.events.edit}</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && events.length === 0 && (
          <p className="text-center text-gray-400 py-8">{t.events.noEvents}</p>
        )}
      </div>
    </div>
  );
}
