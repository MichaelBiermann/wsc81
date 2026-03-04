import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendBookingCancellation } from "@/lib/mailer";

async function requireAdmin() {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;
  return !!(session && user?.role === "admin");
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const booking = await prisma.eventBooking.findUnique({
    where: { id },
    include: { event: true },
  });
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.eventBooking.delete({ where: { id } });

  sendBookingCancellation({
    to: booking.email,
    person1Name: booking.person1Name,
    eventTitleDe: booking.event.titleDe,
    eventTitleEn: booking.event.titleEn,
    startDate: booking.event.startDate,
    locale: booking.locale,
  }).catch((e) => console.error("[DELETE /api/admin/bookings] Cancellation email failed:", e));

  return NextResponse.json({ success: true });
}
