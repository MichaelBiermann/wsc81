import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import {
  sendBookingConfirmation,
  sendBookingAdminNotification,
  sendRemainingBalanceReminder,
} from "@/lib/mailer";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  timeout: 10000,
  maxNetworkRetries: 0,
});
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: "Missing signature or webhook secret" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error("[webhook/stripe] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const meta = session.metadata ?? {};

    // Idempotency: skip if booking already created for this session
    const existing = await prisma.eventBooking.findFirst({
      where: { stripePaymentIntentId: session.payment_intent as string },
    });
    if (existing) {
      return NextResponse.json({ received: true });
    }

    // Parse persons from metadata
    function parsePerson(raw: string | undefined): { name: string; dob: string } | undefined {
      if (!raw) return undefined;
      try { return JSON.parse(raw); } catch { return undefined; }
    }

    const p1 = parsePerson(meta.p1);
    if (!p1) {
      console.error("[webhook/stripe] Missing person1 in metadata");
      return NextResponse.json({ error: "Invalid metadata" }, { status: 400 });
    }

    const dbEvent = await prisma.event.findUnique({ where: { id: meta.eventId } });
    if (!dbEvent) {
      console.error("[webhook/stripe] Event not found:", meta.eventId);
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const isMember = meta.isMember === "true";
    const locale = meta.locale ?? "de";

    const participantList = [
      parsePerson(meta.p1), parsePerson(meta.p2), parsePerson(meta.p3),
      parsePerson(meta.p4), parsePerson(meta.p5), parsePerson(meta.p6),
      parsePerson(meta.p7), parsePerson(meta.p8), parsePerson(meta.p9),
      parsePerson(meta.p10),
    ];
    const participantCount = participantList.filter(Boolean).length;

    function calcAge(dob: string): number {
      if (!dob) return 99;
      const birth = new Date(dob);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
      return age;
    }

    const allPersons = participantList.filter(Boolean) as { name: string; dob: string; isMember?: boolean }[];
    const roomsSingle = Number(meta.roomsSingle ?? 0);
    const roomsDouble = Number(meta.roomsDouble ?? 0);
    const surchargeNonMemberAdult = Number(dbEvent.surchargeNonMemberAdult);
    const surchargeNonMemberChild = Number(dbEvent.surchargeNonMemberChild);
    const busSurcharge = Number(dbEvent.busSurcharge);
    const roomSingleSurcharge = Number(dbEvent.roomSingleSurcharge);
    const roomDoubleSurcharge = Number(dbEvent.roomDoubleSurcharge);
    const baseAmount = Number(dbEvent.totalAmount);

    let totalWithSurcharge = 0;
    for (const p of allPersons) {
      let personTotal = baseAmount;
      const personIsMember = p.isMember ?? false;
      if (!personIsMember) {
        const age = calcAge(p.dob ?? "");
        personTotal += age < 18 ? surchargeNonMemberChild : surchargeNonMemberAdult;
      }
      personTotal += busSurcharge;
      totalWithSurcharge += personTotal;
    }
    totalWithSurcharge += roomsSingle * roomSingleSurcharge;
    totalWithSurcharge += roomsDouble * roomDoubleSurcharge;

    const depositAmount = Number(dbEvent.depositAmount);
    const remainingAmount = totalWithSurcharge - depositAmount;

    const booking = await prisma.eventBooking.create({
      data: {
        eventId: meta.eventId,
        userId: meta.userId || null,
        stripePaymentIntentId: session.payment_intent as string,
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
        roomsSingle: Number(meta.roomsSingle ?? 0),
        roomsDouble: Number(meta.roomsDouble ?? 0),
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
      // Send remaining balance reminder only if there's an outstanding balance
      remainingAmount > 0
        ? sendRemainingBalanceReminder({
            to: meta.email,
            person1Name: p1.name,
            eventTitleDe: dbEvent.titleDe,
            eventTitleEn: dbEvent.titleEn,
            startDate: dbEvent.startDate,
            depositAmount,
            remainingAmount,
            totalAmount: totalWithSurcharge,
            locale,
          })
        : Promise.resolve(),
    ]);
  }

  return NextResponse.json({ received: true });
}
