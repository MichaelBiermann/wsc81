import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import {
  sendBookingConfirmation,
  sendBookingAdminNotification,
} from "@/lib/mailer";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  maxNetworkRetries: 0,
  httpClient: Stripe.createFetchHttpClient(),
});

function calcAge(dob: string): number {
  if (!dob) return 99;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

async function ensureBookingCreated(sessionId: string) {
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.payment_status !== "paid") return;

  const paymentIntentId = session.payment_intent as string;
  if (!paymentIntentId) return;

  // Idempotency: skip if already created (webhook may have beaten us)
  const existing = await prisma.eventBooking.findFirst({
    where: { stripePaymentIntentId: paymentIntentId },
  });
  if (existing) return;

  const meta = session.metadata ?? {};

  function parsePerson(raw: string | undefined): { name: string; dob: string; isMember?: boolean } | undefined {
    if (!raw) return undefined;
    try { return JSON.parse(raw); } catch { return undefined; }
  }

  const p1 = parsePerson(meta.p1);
  if (!p1) return;

  const dbEvent = await prisma.event.findUnique({ where: { id: meta.eventId } });
  if (!dbEvent) return;

  const isMember = meta.isMember === "true";
  const locale = meta.locale ?? "de";
  const roomsSingle = Number(meta.roomsSingle ?? 0);
  const roomsDouble = Number(meta.roomsDouble ?? 0);

  const participantList = [
    parsePerson(meta.p1), parsePerson(meta.p2), parsePerson(meta.p3),
    parsePerson(meta.p4), parsePerson(meta.p5), parsePerson(meta.p6),
    parsePerson(meta.p7), parsePerson(meta.p8), parsePerson(meta.p9),
    parsePerson(meta.p10),
  ];
  const participantCount = participantList.filter(Boolean).length;
  const allPersons = participantList.filter(Boolean) as { name: string; dob: string; isMember?: boolean }[];

  const surchargeNonMemberAdult = Number(dbEvent.surchargeNonMemberAdult);
  const surchargeNonMemberChild = Number(dbEvent.surchargeNonMemberChild);
  const busSurcharge = Number(dbEvent.busSurcharge);
  const roomSingleSurcharge = Number(dbEvent.roomSingleSurcharge);
  const roomDoubleSurcharge = Number(dbEvent.roomDoubleSurcharge);
  const baseAmount = Number(dbEvent.totalAmount);
  const depositAmount = Number(dbEvent.depositAmount);

  let totalWithSurcharge = 0;
  for (const p of allPersons) {
    let personTotal = baseAmount;
    if (!(p.isMember ?? false)) {
      const age = calcAge(p.dob ?? "");
      personTotal += age < 18 ? surchargeNonMemberChild : surchargeNonMemberAdult;
    }
    personTotal += busSurcharge;
    totalWithSurcharge += personTotal;
  }
  totalWithSurcharge += roomsSingle * roomSingleSurcharge;
  totalWithSurcharge += roomsDouble * 2 * roomDoubleSurcharge;

  const booking = await prisma.eventBooking.create({
    data: {
      eventId: meta.eventId,
      userId: meta.userId || null,
      stripePaymentIntentId: paymentIntentId,
      person1Name: p1.name, person1Dob: new Date(p1.dob),
      person2Name: parsePerson(meta.p2)?.name ?? null, person2Dob: parsePerson(meta.p2)?.dob ? new Date(parsePerson(meta.p2)!.dob) : null,
      person3Name: parsePerson(meta.p3)?.name ?? null, person3Dob: parsePerson(meta.p3)?.dob ? new Date(parsePerson(meta.p3)!.dob) : null,
      person4Name: parsePerson(meta.p4)?.name ?? null, person4Dob: parsePerson(meta.p4)?.dob ? new Date(parsePerson(meta.p4)!.dob) : null,
      person5Name: parsePerson(meta.p5)?.name ?? null, person5Dob: parsePerson(meta.p5)?.dob ? new Date(parsePerson(meta.p5)!.dob) : null,
      person6Name: parsePerson(meta.p6)?.name ?? null, person6Dob: parsePerson(meta.p6)?.dob ? new Date(parsePerson(meta.p6)!.dob) : null,
      person7Name: parsePerson(meta.p7)?.name ?? null, person7Dob: parsePerson(meta.p7)?.dob ? new Date(parsePerson(meta.p7)!.dob) : null,
      person8Name: parsePerson(meta.p8)?.name ?? null, person8Dob: parsePerson(meta.p8)?.dob ? new Date(parsePerson(meta.p8)!.dob) : null,
      person9Name: parsePerson(meta.p9)?.name ?? null, person9Dob: parsePerson(meta.p9)?.dob ? new Date(parsePerson(meta.p9)!.dob) : null,
      person10Name: parsePerson(meta.p10)?.name ?? null, person10Dob: parsePerson(meta.p10)?.dob ? new Date(parsePerson(meta.p10)!.dob) : null,
      street: meta.street, postalCode: meta.postalCode, city: meta.city,
      phone: meta.phone, email: meta.email,
      isMember, remarks: meta.remarks || null, locale,
      roomsSingle, roomsDouble,
      balanceDue: Math.max(0, totalWithSurcharge - depositAmount) || null,
    },
  });

  await Promise.allSettled([
    sendBookingConfirmation({
      to: meta.email,
      person1Name: p1.name,
      eventTitleDe: dbEvent.titleDe,
      eventTitleEn: dbEvent.titleEn,
      startDate: dbEvent.startDate,
      locale,
      depositAmount,
      totalAmount: totalWithSurcharge,
    }),
    sendBookingAdminNotification({
      eventTitleDe: dbEvent.titleDe,
      bookingId: booking.id,
      person1Name: p1.name,
      email: meta.email,
      participantCount,
    }),
  ]);
}

export default async function BookingSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ session_id?: string; email?: string }>;
}) {
  const { locale } = await params;
  const { session_id, email } = await searchParams;
  const isDE = locale === "de";

  if (session_id) {
    try {
      await ensureBookingCreated(session_id);
    } catch (err) {
      console.error("[BookingSuccessPage] ensureBookingCreated failed:", err);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <span className="material-symbols-rounded text-green-600 mb-4 block" style={{ fontSize: 56 }}>check_circle</span>
      <h1 className="text-2xl font-bold text-green-700 mb-3">
        {isDE ? "Anmeldung eingegangen!" : "Booking received!"}
      </h1>
      <p className="text-gray-600 mb-6">
        {isDE
          ? `Wir haben eine Bestätigungs-E-Mail an ${email} gesendet.`
          : `A confirmation has been sent to ${email}.`}
      </p>
      <a href={`/${locale}`} className="text-[#4577ac] hover:underline">
        {isDE ? "Zurück zur Startseite" : "Back to homepage"}
      </a>
    </div>
  );
}
