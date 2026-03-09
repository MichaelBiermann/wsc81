import type { Event } from "@prisma/client";
import Link from "next/link";
import Image from "next/image";

interface Props {
  events: Event[];
  locale: string;
  isLoggedIn?: boolean;
}

export default function EventCalendar({ events, locale, isLoggedIn = false }: Props) {
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
        const eventUrl = `/${locale}/events/${event.id}`;
        const bookUrl = isLoggedIn
          ? eventUrl
          : `/${locale}/login?callbackUrl=${encodeURIComponent(eventUrl)}`;

        return (
          <div key={event.id} className="rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden">
            {event.imageUrl && (
              <div className="relative h-40 w-full">
                <Image src={event.imageUrl} alt={title} fill className="object-cover" unoptimized />
              </div>
            )}
            <div className="bg-[#4577ac] px-4 py-2 text-white text-sm font-medium flex items-center gap-1">
              <span className="material-symbols-rounded" style={{ fontSize: "16px" }}>calendar_month</span> {dateStr}
            </div>
            <div className="p-4">
              <Link href={eventUrl} className="hover:underline">
                <h3 className="font-bold text-gray-900 mb-1">{title}</h3>
              </Link>
              <p className="text-sm text-gray-500 mb-1 flex items-center gap-1">
                <span className="material-symbols-rounded" style={{ fontSize: "14px" }}>location_on</span> {event.location}
              </p>
              <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                {description.replace(/<[^>]+>/g, "").slice(0, 120)}…
              </p>
              <div className="flex items-center justify-between flex-wrap gap-2">
                {Number(event.totalAmount) > 0 ? (
                  <span className="text-sm font-semibold text-[#4577ac]">
                    {isDE ? "Ab" : "From"} €{Number(event.totalAmount).toFixed(2)}
                  </span>
                ) : (
                  <span className="text-sm font-semibold text-green-600">{isDE ? "Kostenlos" : "Free"}</span>
                )}
                {event.bookable ? (
                  <div className="flex flex-col items-end gap-1">
                    {event.soldOut ? (
                      <span className="inline-flex items-center gap-1 rounded bg-red-100 px-3 py-1.5 text-sm font-medium text-red-700">
                        <span className="material-symbols-rounded" style={{ fontSize: "14px" }}>block</span>
                        {isDE ? "Ausgebucht" : "Sold out"}
                      </span>
                    ) : (
                      <Link
                        href={bookUrl}
                        className="rounded bg-[#4577ac] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#2d5a8a] transition-colors"
                      >
                        {isDE ? "Jetzt buchen" : "Book now"}
                      </Link>
                    )}
                    {!isLoggedIn && !event.soldOut && (
                      <span className="text-xs text-gray-400">
                        {isDE ? "Anmeldung erforderlich" : "Sign-in required"}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-gray-400 italic">
                    {isDE ? "Anmeldung: siehe Beschreibung" : "Registration: see description"}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
