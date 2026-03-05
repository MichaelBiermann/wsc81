import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { BookingSchema } from "@/lib/validation";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  maxNetworkRetries: 0,
  httpClient: Stripe.createFetchHttpClient(),
});

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

function calcAge(dob: string): number {
  if (!dob) return 99;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function calcTotalWithSurcharge(
  persons: Array<{ name?: string; dob?: string; isMember?: boolean } | undefined>,
  event: { surchargeNonMemberAdult: number; surchargeNonMemberChild: number; busSurcharge: number; roomSingleSurcharge: number; roomDoubleSurcharge: number },
  roomsSingle: number,
  roomsDouble: number
): number {
  let total = 0;
  for (const p of persons) {
    if (!p?.name) continue;
    if (!p.isMember) {
      const age = calcAge(p.dob ?? "");
      total += age < 18 ? event.surchargeNonMemberChild : event.surchargeNonMemberAdult;
    }
    total += event.busSurcharge;
  }
  total += roomsSingle * event.roomSingleSurcharge;
  total += roomsDouble * event.roomDoubleSurcharge;
  return total;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const sessionUser = session?.user as { id?: string; role?: string } | undefined;
    if (!session || !sessionUser?.id) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (sessionUser.role === "admin") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = BookingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const data = parsed.data;

    const event = await prisma.event.findUnique({ where: { id: data.eventId } });
    if (!event) {
      return NextResponse.json({ error: "event_not_found" }, { status: 404 });
    }
    if (event.registrationDeadline && event.registrationDeadline < new Date()) {
      return NextResponse.json({ error: "deadline_passed" }, { status: 409 });
    }

    const depositAmount = Number(event.depositAmount);
    const eventPricing = {
      surchargeNonMemberAdult: Number(event.surchargeNonMemberAdult),
      surchargeNonMemberChild: Number(event.surchargeNonMemberChild),
      busSurcharge: Number(event.busSurcharge),
      roomSingleSurcharge: Number(event.roomSingleSurcharge),
      roomDoubleSurcharge: Number(event.roomDoubleSurcharge),
    };

    const persons = [
      data.person1, data.person2, data.person3, data.person4, data.person5,
      data.person6, data.person7, data.person8, data.person9, data.person10,
    ];
    const roomsSingle = data.roomsSingle ?? 0;
    const roomsDouble = data.roomsDouble ?? 0;
    const totalWithSurcharge = calcTotalWithSurcharge(persons, eventPricing, roomsSingle, roomsDouble);
    const isMember = data.person1.isMember ?? false;
    const locale = data.locale ?? "de";
    const isDE = locale === "de";

    // For free events (depositAmount = 0), skip Stripe and create booking directly
    if (depositAmount === 0) {
      const participantCount = persons.filter((p) => p?.name).length;

      const booking = await prisma.eventBooking.create({
        data: {
          eventId: data.eventId,
          userId: sessionUser.id,
          person1Name: data.person1.name, person1Dob: new Date(data.person1.dob),
          person2Name: data.person2?.name ?? null, person2Dob: data.person2?.dob ? new Date(data.person2.dob) : null,
          person3Name: data.person3?.name ?? null, person3Dob: data.person3?.dob ? new Date(data.person3.dob) : null,
          person4Name: data.person4?.name ?? null, person4Dob: data.person4?.dob ? new Date(data.person4.dob) : null,
          person5Name: data.person5?.name ?? null, person5Dob: data.person5?.dob ? new Date(data.person5.dob) : null,
          person6Name: data.person6?.name ?? null, person6Dob: data.person6?.dob ? new Date(data.person6.dob) : null,
          person7Name: data.person7?.name ?? null, person7Dob: data.person7?.dob ? new Date(data.person7.dob) : null,
          person8Name: data.person8?.name ?? null, person8Dob: data.person8?.dob ? new Date(data.person8.dob) : null,
          person9Name: data.person9?.name ?? null, person9Dob: data.person9?.dob ? new Date(data.person9.dob) : null,
          person10Name: data.person10?.name ?? null, person10Dob: data.person10?.dob ? new Date(data.person10.dob) : null,
          street: data.street, postalCode: data.postalCode, city: data.city,
          phone: data.phone, email: data.email,
          isMember, remarks: data.remarks ?? null, locale,
          roomsSingle,
          roomsDouble,
        },
      });

      const { sendBookingConfirmation, sendBookingAdminNotification } = await import("@/lib/mailer");
      await Promise.allSettled([
        sendBookingConfirmation({ to: data.email, person1Name: data.person1.name, eventTitleDe: event.titleDe, eventTitleEn: event.titleEn, startDate: event.startDate, locale }),
        sendBookingAdminNotification({ eventTitleDe: event.titleDe, bookingId: booking.id, person1Name: data.person1.name, email: data.email, participantCount }),
      ]);

      return NextResponse.json({
        free: true,
        redirectUrl: `/${locale}/events/${event.id}/book/success?email=${encodeURIComponent(data.email)}`,
      });
    }

    // Serialize booking data into Stripe metadata (max 500 chars per value, 50 keys)
    const metadata: Record<string, string> = {
      eventId: data.eventId,
      userId: sessionUser.id,
      street: data.street,
      postalCode: data.postalCode,
      city: data.city,
      phone: data.phone,
      email: data.email,
      isMember: String(isMember),
      remarks: data.remarks ?? "",
      locale,
      roomsSingle: String(roomsSingle),
      roomsDouble: String(roomsDouble),
      p1: JSON.stringify(data.person1),
      p2: data.person2?.name ? JSON.stringify(data.person2) : "",
      p3: data.person3?.name ? JSON.stringify(data.person3) : "",
      p4: data.person4?.name ? JSON.stringify(data.person4) : "",
      p5: data.person5?.name ? JSON.stringify(data.person5) : "",
      p6: data.person6?.name ? JSON.stringify(data.person6) : "",
      p7: data.person7?.name ? JSON.stringify(data.person7) : "",
      p8: data.person8?.name ? JSON.stringify(data.person8) : "",
      p9: data.person9?.name ? JSON.stringify(data.person9) : "",
      p10: data.person10?.name ? JSON.stringify(data.person10) : "",
    };

    const eventTitle = isDE ? event.titleDe : event.titleEn;
    const depositLabel = isDE ? `Anzahlung – ${eventTitle}` : `Deposit – ${eventTitle}`;
    const productDescription = isDE
      ? `Anzahlung für ${eventTitle} (${event.startDate.toLocaleDateString("de-DE")}). Restbetrag: €${Math.max(0, totalWithSurcharge - depositAmount).toFixed(2)}`
      : `Deposit for ${eventTitle} (${event.startDate.toLocaleDateString("en-GB")}). Remaining: €${Math.max(0, totalWithSurcharge - depositAmount).toFixed(2)}`;

    const successUrl = `${BASE_URL}/${locale}/events/${event.id}/book/success?session_id={CHECKOUT_SESSION_ID}&email=${encodeURIComponent(data.email)}`;
    const cancelUrl = `${BASE_URL}/${locale}/events/${event.id}`;

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "eur",
          product_data: { name: depositLabel, description: productDescription },
          unit_amount: Math.round(depositAmount * 100),
        },
        quantity: 1,
      }],
      customer_email: data.email,
      metadata,
      success_url: successUrl,
      cancel_url: cancelUrl,
      locale: locale === "de" ? "de" : "en",
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[POST /api/booking/checkout]", msg);
    return NextResponse.json({ error: "Internal server error", detail: msg }, { status: 500 });
  }
}
