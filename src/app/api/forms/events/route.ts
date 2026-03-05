import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const events = await prisma.event.findMany({
    where: { bookable: true, startDate: { gte: new Date() } },
    orderBy: { startDate: "asc" },
    select: { id: true, titleDe: true, titleEn: true, startDate: true, location: true },
  });
  return NextResponse.json(events);
}
