import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import BookingForm from "@/components/BookingForm";
import { getTranslations } from "next-intl/server";
import { auth } from "@/auth";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const isDE = locale === "de";
  const t = await getTranslations("Booking");
  const session = await auth();

  const isAdmin = (session?.user as { role?: string } | undefined)?.role === "admin";

  const event = await prisma.event.findUnique({
    where: { id },
    include: isAdmin ? { bookings: { orderBy: { createdAt: "asc" } } } : undefined,
  });
  if (!event) notFound();

  const bookings = isAdmin ? (event as typeof event & { bookings: import("@prisma/client").EventBooking[] }).bookings : null;

  const title = isDE ? event.titleDe : event.titleEn;
  const description = isDE ? event.descriptionDe : event.descriptionEn;

  const fmt = (d: Date) =>
    d.toLocaleDateString(isDE ? "de-DE" : "en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

  // Pre-fill booking form if user is logged in
  let prefill: {
    person1Name?: string;
    person1Dob?: string;
    street?: string;
    postalCode?: string;
    city?: string;
    phone?: string;
    email?: string;
    isMember?: boolean;
  } | undefined;

  const sessionUser = session?.user as { id?: string; role?: string } | undefined;

  // Age calculation helper (as of event start date)
  function calcAge(dob: Date | null | undefined): string {
    if (!dob) return "—";
    const ref = event!.startDate;
    let age = ref.getFullYear() - dob.getFullYear();
    const m = ref.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && ref.getDate() < dob.getDate())) age--;
    return String(age);
  }

  if (sessionUser?.id && sessionUser.role !== "admin") {
    const user = await prisma.user.findUnique({ where: { id: sessionUser.id } });
    if (user) {
      prefill = {
        person1Name: `${user.firstName} ${user.lastName}`,
        person1Dob: user.dob.toISOString().split("T")[0],
        street: user.street,
        postalCode: user.postalCode,
        city: user.city,
        phone: user.phone,
        email: user.email,
        isMember: sessionUser.role === "member",
      };
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 pt-20">
      <Link
        href={`/${locale}/#events`}
        className="text-sm text-[#4577ac] hover:underline mb-6 inline-block"
      >
        ← {isDE ? "Zurück zu Veranstaltungen" : "Back to events"}
      </Link>

      <div className={event.bookable ? "flex flex-col lg:flex-row gap-8 items-start" : ""}>
        {/* Left: event details */}
        <div className={event.bookable ? "lg:w-2/5 lg:sticky lg:top-6" : "max-w-3xl"}>
          {event.imageUrl && (
            <div className="relative h-56 w-full rounded-t-lg overflow-hidden">
              <Image src={event.imageUrl} alt={title} fill className="object-cover" unoptimized />
            </div>
          )}
          <div className={`bg-[#4577ac] text-white px-6 py-4 ${event.imageUrl ? "" : "rounded-t-lg"}`}>
            <p className="text-sm opacity-80 flex items-center gap-1">
              <span className="material-symbols-rounded" style={{ fontSize: "16px" }}>calendar_month</span>
              {fmt(event.startDate)}
              {event.endDate && event.endDate.getTime() !== event.startDate.getTime()
                ? ` – ${fmt(event.endDate)}`
                : ""}
            </p>
            <h1 className="text-xl font-bold mt-1">{title}</h1>
            <p className="text-sm opacity-80 mt-1 flex items-center gap-1">
              <span className="material-symbols-rounded" style={{ fontSize: "16px" }}>location_on</span> {event.location}
            </p>
          </div>

          <div className="bg-white border border-gray-200 border-t-0 rounded-b-lg p-5 mb-4">
            <div
              className="prose prose-sm max-w-none text-gray-700"
              dangerouslySetInnerHTML={{ __html: description }}
            />
          </div>

          {event.bookable && (
          <div className="bg-[#eef3f9] rounded-lg p-4 text-sm space-y-2">
            {Number(event.depositAmount) > 0 && (
              <div className="flex justify-between">
                <span className="font-medium text-gray-700">{isDE ? "Anzahlung" : "Deposit"}</span>
                <span className="font-semibold">€{Number(event.depositAmount).toFixed(2)}</span>
              </div>
            )}
            {Number(event.surchargeNonMemberAdult) > 0 && (
              <div className="flex justify-between text-gray-500">
                <span>{isDE ? "Aufschlag Nichtmitglied (18+)" : "Non-member surcharge (18+)"}</span>
                <span>€{Number(event.surchargeNonMemberAdult).toFixed(2)}</span>
              </div>
            )}
            {Number(event.surchargeNonMemberChild) > 0 && (
              <div className="flex justify-between text-gray-500">
                <span>{isDE ? "Aufschlag Nichtmitglied (unter 18)" : "Non-member surcharge (under 18)"}</span>
                <span>€{Number(event.surchargeNonMemberChild).toFixed(2)}</span>
              </div>
            )}
            {Number(event.busSurcharge) > 0 && (
              <div className="flex justify-between text-gray-500">
                <span>{isDE ? "Buszuschlag" : "Bus surcharge"}</span>
                <span>€{Number(event.busSurcharge).toFixed(2)}</span>
              </div>
            )}
            {Number(event.roomSingleSurcharge) > 0 && (
              <div className="flex justify-between text-gray-500">
                <span>{isDE ? "Einzelzimmer (pro Person)" : "Single room (per person)"}</span>
                <span>€{Number(event.roomSingleSurcharge).toFixed(2)}</span>
              </div>
            )}
            {Number(event.roomDoubleSurcharge) > 0 && (
              <div className="flex justify-between text-gray-500">
                <span>{isDE ? "Doppelzimmer (pro Person)" : "Double room (per person)"}</span>
                <span>€{Number(event.roomDoubleSurcharge).toFixed(2)}</span>
              </div>
            )}
            {Array.isArray(event.agePrices) && (event.agePrices as { label: string; price: number }[]).map((ap, i) => (
              <div key={i} className="flex justify-between text-gray-500">
                <span>{ap.label}</span>
                <span>€{Number(ap.price).toFixed(2)}</span>
              </div>
            ))}
            {event.registrationDeadline && (
              <div className="flex justify-between text-gray-500">
                <span>{isDE ? "Anmeldeschluss" : "Registration deadline"}</span>
                <span>{fmt(event.registrationDeadline)}</span>
              </div>
            )}
            {event.maxParticipants && (
              <div className="flex justify-between text-gray-500">
                <span>{isDE ? "Max. Teilnehmer" : "Max. participants"}</span>
                <span>{event.maxParticipants}</span>
              </div>
            )}
          </div>
          )}
        </div>

        {/* Right: booking form */}
        <div className="lg:w-3/5">
          {event.bookable ? (
            <>
              <h2 className="text-xl font-bold text-[#4577ac] mb-2">{t("pageTitle")}</h2>
              <p className="text-gray-500 text-sm mb-6">{t("subtitle", { eventTitle: title })}</p>
              {sessionUser?.id ? (
                <BookingForm
                  event={{
                    id: event.id,
                    titleDe: event.titleDe,
                    titleEn: event.titleEn,
                    depositAmount: Number(event.depositAmount),
                    registrationDeadline: event.registrationDeadline?.toISOString() ?? null,
                    surchargeNonMemberAdult: Number(event.surchargeNonMemberAdult),
                    surchargeNonMemberChild: Number(event.surchargeNonMemberChild),
                    busSurcharge: Number(event.busSurcharge),
                    roomSingleSurcharge: Number(event.roomSingleSurcharge),
                    roomDoubleSurcharge: Number(event.roomDoubleSurcharge),
                  }}
                  locale={locale}
                  prefill={prefill}
                />
              ) : (
                <div className="rounded-lg border border-[#4577ac]/30 bg-[#eef3f9] p-6 text-center">
                  <p className="text-gray-700 mb-4">{isDE ? "Bitte melden Sie sich an, um diese Veranstaltung zu buchen." : "Please sign in to book this event."}</p>
                  <div className="flex justify-center gap-3">
                    <Link
                      href={`/${locale}/login?callbackUrl=/${locale}/events/${event.id}`}
                      className="rounded bg-[#4577ac] px-5 py-2 text-sm font-semibold text-white hover:bg-[#2d5a8a] transition-colors"
                    >
                      {isDE ? "Anmelden" : "Sign in"}
                    </Link>
                    <Link
                      href={`/${locale}/register`}
                      className="rounded border border-[#4577ac] px-5 py-2 text-sm font-semibold text-[#4577ac] hover:bg-[#4577ac]/10 transition-colors"
                    >
                      {isDE ? "Registrieren" : "Register"}
                    </Link>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>

      {/* Admin: bookings list */}
      {isAdmin && bookings && (
        <div className="mt-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">
              {isDE ? "Anmeldungen" : "Bookings"}
              <span className="ml-2 text-base font-normal text-gray-500">({bookings.length})</span>
            </h2>
            <a
              href={`/api/admin/events/${id}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded bg-[#4577ac] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#3a6699] transition-colors"
            >
              <span className="material-symbols-rounded" style={{ fontSize: 18 }}>picture_as_pdf</span>
              {isDE ? "PDF herunterladen" : "Download PDF"}
            </a>
          </div>

          {bookings.length === 0 ? (
            <p className="text-gray-400 text-sm italic">{isDE ? "Noch keine Anmeldungen." : "No bookings yet."}</p>
          ) : (
            <div className="flex flex-col gap-4">
              {bookings.map((b, idx) => {
                const persons: { name: string; dob: Date | null }[] = [
                  { name: b.person1Name, dob: b.person1Dob },
                  { name: b.person2Name ?? "", dob: b.person2Dob ?? null },
                  { name: b.person3Name ?? "", dob: b.person3Dob ?? null },
                  { name: b.person4Name ?? "", dob: b.person4Dob ?? null },
                  { name: b.person5Name ?? "", dob: b.person5Dob ?? null },
                  { name: b.person6Name ?? "", dob: b.person6Dob ?? null },
                  { name: b.person7Name ?? "", dob: b.person7Dob ?? null },
                  { name: b.person8Name ?? "", dob: b.person8Dob ?? null },
                  { name: b.person9Name ?? "", dob: b.person9Dob ?? null },
                  { name: b.person10Name ?? "", dob: b.person10Dob ?? null },
                ].filter((p) => p.name);

                return (
                  <div key={b.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <span className="text-xs text-gray-400 mr-1">#{idx + 1}</span>
                        <span className="font-semibold text-gray-900">{b.person1Name}</span>
                        {b.isMember && (
                          <span className="ml-2 inline-flex items-center gap-0.5 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                            <span className="material-symbols-rounded" style={{ fontSize: 12 }}>verified</span>
                            {isDE ? "Mitglied" : "Member"}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        {new Date(b.createdAt).toLocaleDateString("de-DE")}
                      </span>
                    </div>

                    {/* Persons table */}
                    <table className="w-full text-sm mb-3">
                      <thead>
                        <tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                          <th className="pb-1 pr-3 font-medium w-6">#</th>
                          <th className="pb-1 pr-3 font-medium">{isDE ? "Name" : "Name"}</th>
                          <th className="pb-1 pr-3 font-medium">{isDE ? "Geburtsdatum" : "Date of birth"}</th>
                          <th className="pb-1 font-medium">{isDE ? "Alter" : "Age"}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {persons.map((p, pi) => (
                          <tr key={pi} className="border-b border-gray-50 last:border-0">
                            <td className="py-1 pr-3 text-gray-400">{pi + 1}.</td>
                            <td className="py-1 pr-3 text-gray-800">{p.name}</td>
                            <td className="py-1 pr-3 text-gray-500">{p.dob ? p.dob.toLocaleDateString("de-DE") : "—"}</td>
                            <td className="py-1 text-gray-500">{calcAge(p.dob)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Contact + room info */}
                    <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-500">
                      <span><span className="font-medium text-gray-600">{isDE ? "E-Mail:" : "Email:"}</span> {b.email}</span>
                      <span><span className="font-medium text-gray-600">{isDE ? "Tel:" : "Phone:"}</span> {b.phone || "—"}</span>
                      <span><span className="font-medium text-gray-600">{isDE ? "Adresse:" : "Address:"}</span> {b.street}, {b.postalCode} {b.city}</span>
                      {(b.roomsSingle > 0 || b.roomsDouble > 0) && (
                        <span>
                          <span className="font-medium text-gray-600">{isDE ? "Zimmer:" : "Rooms:"}</span>{" "}
                          {[b.roomsSingle > 0 ? `EZ: ${b.roomsSingle}` : "", b.roomsDouble > 0 ? `DZ: ${b.roomsDouble}` : ""].filter(Boolean).join(" · ")}
                        </span>
                      )}
                    </div>
                    {b.remarks && (
                      <p className="mt-2 text-xs text-gray-500 italic">„{b.remarks}"</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
