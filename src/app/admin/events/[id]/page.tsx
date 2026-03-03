import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import EventForm from "../EventForm";

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await prisma.event.findUnique({
    where: { id },
    include: { bookings: { orderBy: { createdAt: "desc" } } },
  });
  if (!event) notFound();

  const toDatetimeLocal = (d: Date) => d.toISOString().slice(0, 16);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Veranstaltung bearbeiten</h1>
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
          totalAmount: String(event.totalAmount),
          maxParticipants: event.maxParticipants ? String(event.maxParticipants) : "",
          registrationDeadline: event.registrationDeadline ? toDatetimeLocal(event.registrationDeadline) : "",
        }}
      />

      {/* Bookings list */}
      {event.bookings.length > 0 && (
        <div className="mt-10">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Buchungen ({event.bookings.length})</h2>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">E-Mail</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Mitglied</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Datum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {event.bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{b.person1Name}</td>
                    <td className="px-4 py-3 text-gray-600">{b.email}</td>
                    <td className="px-4 py-3">{b.isMember ? "✅" : "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{b.createdAt.toLocaleDateString("de-DE")}</td>
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
