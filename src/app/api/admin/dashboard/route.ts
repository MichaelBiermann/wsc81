import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;
  if (!session || user?.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [eventsCount, membersCount, pendingCount, newslettersCount, recapsCount] = await Promise.all([
    prisma.event.count(),
    prisma.member.count(),
    prisma.pendingMembership.count(),
    prisma.newsletter.count({ where: { status: "DRAFT" } }),
    prisma.recap.count(),
  ]);

  return NextResponse.json({ eventsCount, membersCount, pendingCount, newslettersCount, recapsCount });
}
