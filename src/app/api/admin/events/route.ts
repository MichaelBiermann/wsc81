import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { EventSchema } from "@/lib/validation";

async function requireAdmin() {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;
  if (!session || user?.role !== "admin") return false;
  return true;
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const events = await prisma.event.findMany({
    orderBy: { startDate: "desc" },
    include: { _count: { select: { bookings: true } } },
  });
  return NextResponse.json(events);
}

export async function POST(request: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const parsed = EventSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 });

  const d = parsed.data;
  const event = await prisma.event.create({
    data: {
      titleDe: d.titleDe,
      titleEn: d.titleEn,
      descriptionDe: d.descriptionDe,
      descriptionEn: d.descriptionEn,
      location: d.location,
      startDate: new Date(d.startDate),
      endDate: new Date(d.endDate),
      depositAmount: d.depositAmount,
      maxParticipants: d.maxParticipants ?? null,
      registrationDeadline: d.registrationDeadline ? new Date(d.registrationDeadline) : null,
      imageUrl: d.imageUrl ?? null,
      bookable: d.bookable,
      soldOut: d.soldOut,
      surchargeNonMemberAdult: d.surchargeNonMemberAdult,
      surchargeNonMemberChild: d.surchargeNonMemberChild,
      busSurcharge: d.busSurcharge,
      roomSingleSurcharge: d.roomSingleSurcharge,
      roomDoubleSurcharge: d.roomDoubleSurcharge,
      agePrices: d.agePrices,
    },
  });
  return NextResponse.json(event, { status: 201 });
}
