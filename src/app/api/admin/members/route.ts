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
  const members = await prisma.member.findMany({ orderBy: { activatedAt: "desc" } });
  return NextResponse.json(members);
}
