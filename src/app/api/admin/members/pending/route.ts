import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;
  return !!(session && user?.role === "admin");
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const pending = await prisma.pendingMembership.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(pending);
}
