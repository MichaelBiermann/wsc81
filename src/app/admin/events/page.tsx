import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AdminEventsPage() {
  const events = await prisma.event.findMany({
    orderBy: { startDate: "desc" },
    include: { _count: { select: { bookings: true } } },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Veranstaltungen</h1>
        <Link href="/admin/events/new" className="rounded bg-[#4577ac] px-4 py-2 text-sm text-white hover:bg-[#2d5a8a] transition-colors">
          + Neue Veranstaltung
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Titel</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Datum</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Ort</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Buchungen</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Aktionen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {events.map((event) => (
              <tr key={event.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{event.titleDe}</td>
                <td className="px-4 py-3 text-gray-600">
                  {event.startDate.toLocaleDateString("de-DE")}
                </td>
                <td className="px-4 py-3 text-gray-600">{event.location}</td>
                <td className="px-4 py-3">
                  <Link href={`/admin/events/${event.id}`} className="text-[#4577ac] hover:underline">
                    {event._count.bookings} Buchungen
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/admin/events/${event.id}`} className="text-[#4577ac] hover:underline mr-3">Bearbeiten</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {events.length === 0 && (
          <p className="text-center text-gray-400 py-8">Keine Veranstaltungen vorhanden.</p>
        )}
      </div>
    </div>
  );
}
