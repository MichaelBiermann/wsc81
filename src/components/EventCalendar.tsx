import type { Event } from "@prisma/client";
import Link from "next/link";

interface Props {
  events: Event[];
  locale: string;
}

export default function EventCalendar({ events, locale }: Props) {
  const isDE = locale === "de";

  if (events.length === 0) {
    return (
      <p className="text-gray-500">
        {isDE ? "Aktuell keine Veranstaltungen geplant." : "No events currently planned."}
      </p>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => {
        const title = isDE ? event.titleDe : event.titleEn;
        const description = isDE ? event.descriptionDe : event.descriptionEn;
        const dateStr = event.startDate.toLocaleDateString(isDE ? "de-DE" : "en-GB", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        });

        return (
          <div key={event.id} className="rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden">
            <div className="bg-[#4577ac] px-4 py-2 text-white text-sm font-medium">
              📅 {dateStr}
            </div>
            <div className="p-4">
              <Link href={`/${locale}/events/${event.id}`} className="hover:underline">
                <h3 className="font-bold text-gray-900 mb-1">{title}</h3>
              </Link>
              <p className="text-sm text-gray-500 mb-1">📍 {event.location}</p>
              <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                {description.replace(/<[^>]+>/g, "").slice(0, 120)}…
              </p>
              <div className="flex items-center justify-between">
                {Number(event.totalAmount) > 0 ? (
                  <span className="text-sm font-semibold text-[#4577ac]">
                    {isDE ? "Ab" : "From"} €{Number(event.totalAmount).toFixed(2)}
                  </span>
                ) : (
                  <span className="text-sm font-semibold text-green-600">{isDE ? "Kostenlos" : "Free"}</span>
                )}
                <Link
                  href={`/${locale}/events/${event.id}`}
                  className="rounded bg-[#4577ac] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#2d5a8a] transition-colors"
                >
                  {isDE ? "Jetzt buchen" : "Book now"}
                </Link>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
