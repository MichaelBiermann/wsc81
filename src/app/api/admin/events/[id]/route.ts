import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { EventSchema } from "@/lib/validation";

async function requireAdmin() {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;
  return !!(session && user?.role === "admin");
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const event = await prisma.event.findUnique({
    where: { id },
    include: { bookings: { orderBy: { createdAt: "desc" } } },
  });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(event);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await request.json();
  const parsed = EventSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 });

  const d = parsed.data;
  const event = await prisma.event.update({
    where: { id },
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
      surchargeNonMemberAdult: d.surchargeNonMemberAdult,
      surchargeNonMemberChild: d.surchargeNonMemberChild,
      busSurcharge: d.busSurcharge,
      roomSingleSurcharge: d.roomSingleSurcharge,
      roomDoubleSurcharge: d.roomDoubleSurcharge,
      agePrices: d.agePrices,
    },
  });
  return NextResponse.json(event);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await prisma.event.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
