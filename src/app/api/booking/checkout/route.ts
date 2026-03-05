import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { BookingSchema } from "@/lib/validation";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
const NON_MEMBER_SURCHARGE = 40;

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
    const totalAmount = Number(event.totalAmount);
    const surcharge = data.isMember ? 0 : NON_MEMBER_SURCHARGE;
    const totalWithSurcharge = totalAmount + surcharge;
    const locale = data.locale ?? "de";
    const isDE = locale === "de";

    // For free events (depositAmount = 0), skip Stripe and create booking directly
    if (depositAmount === 0) {
      const participantCount = [
        data.person1, data.person2, data.person3, data.person4, data.person5,
        data.person6, data.person7, data.person8, data.person9, data.person10,
      ].filter((p) => p?.name).length;

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
          isMember: data.isMember, remarks: data.remarks ?? null, locale,
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
    // We store persons as JSON chunks and contacts separately
    const metadata: Record<string, string> = {
      eventId: data.eventId,
      userId: sessionUser.id,
      street: data.street,
      postalCode: data.postalCode,
      city: data.city,
      phone: data.phone,
      email: data.email,
      isMember: String(data.isMember),
      remarks: data.remarks ?? "",
      locale,
      // Persons — store as compact JSON strings
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
    const depositLabel = isDE
      ? `Anzahlung – ${eventTitle}`
      : `Deposit – ${eventTitle}`;

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      {
        price_data: {
          currency: "eur",
          product_data: {
            name: depositLabel,
            description: isDE
              ? `Anzahlung für ${eventTitle} (${event.startDate.toLocaleDateString("de-DE")}). Restbetrag: €${(totalWithSurcharge - depositAmount).toFixed(2)}`
              : `Deposit for ${eventTitle} (${event.startDate.toLocaleDateString("en-GB")}). Remaining: €${(totalWithSurcharge - depositAmount).toFixed(2)}`,
          },
          unit_amount: Math.round(depositAmount * 100), // cents
        },
        quantity: 1,
      },
    ];

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card", "sepa_debit"],
      line_items: lineItems,
      customer_email: data.email,
      metadata,
      success_url: `${BASE_URL}/${locale}/events/${event.id}/book/success?session_id={CHECKOUT_SESSION_ID}&email=${encodeURIComponent(data.email)}`,
      cancel_url: `${BASE_URL}/${locale}/events/${event.id}`,
      locale: locale === "de" ? "de" : "en",
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("[POST /api/booking/checkout]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
