import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { BookingSchema } from "@/lib/validation";
import { sendBookingConfirmation, sendBookingAdminNotification } from "@/lib/mailer";

const NON_MEMBER_SURCHARGE = 40;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = BookingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const event = await prisma.event.findUnique({ where: { id: data.eventId } });
    if (!event) {
      return NextResponse.json({ error: "event_not_found" }, { status: 404 });
    }

    if (event.registrationDeadline && event.registrationDeadline < new Date()) {
      return NextResponse.json({ error: "deadline_passed" }, { status: 409 });
    }

    // Count participants
    const participantCount = [
      data.person1,
      data.person2,
      data.person3,
      data.person4,
      data.person5,
    ].filter((p) => p?.name).length;

    const booking = await prisma.eventBooking.create({
      data: {
        eventId: data.eventId,
        person1Name: data.person1.name,
        person1Dob: new Date(data.person1.dob),
        person2Name: data.person2?.name ?? null,
        person2Dob: data.person2?.dob ? new Date(data.person2.dob) : null,
        person3Name: data.person3?.name ?? null,
        person3Dob: data.person3?.dob ? new Date(data.person3.dob) : null,
        person4Name: data.person4?.name ?? null,
        person4Dob: data.person4?.dob ? new Date(data.person4.dob) : null,
        person5Name: data.person5?.name ?? null,
        person5Dob: data.person5?.dob ? new Date(data.person5.dob) : null,
        street: data.street,
        postalCode: data.postalCode,
        city: data.city,
        phone: data.phone,
        email: data.email,
        isMember: data.isMember,
        remarks: data.remarks ?? null,
        locale: data.locale,
      },
    });

    const surcharge = data.isMember ? 0 : NON_MEMBER_SURCHARGE;
    const totalAmount = Number(event.totalAmount) + surcharge;

    await Promise.all([
      sendBookingConfirmation({
        to: data.email,
        person1Name: data.person1.name,
        eventTitleDe: event.titleDe,
        eventTitleEn: event.titleEn,
        startDate: event.startDate,
        locale: data.locale,
      }),
      sendBookingAdminNotification({
        eventTitleDe: event.titleDe,
        bookingId: booking.id,
        person1Name: data.person1.name,
        email: data.email,
        participantCount,
      }),
    ]);

    return NextResponse.json(
      { message: "booking_confirmed", bookingId: booking.id, totalAmount },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST /api/booking]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
