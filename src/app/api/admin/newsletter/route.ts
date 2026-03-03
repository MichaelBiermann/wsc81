import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NewsletterSchema } from "@/lib/validation";

async function requireAdmin() {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;
  return !!(session && user?.role === "admin");
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const newsletters = await prisma.newsletter.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(newsletters);
}

export async function POST(request: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const parsed = NewsletterSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 });
  const newsletter = await prisma.newsletter.create({ data: { ...parsed.data, status: "DRAFT" } });
  return NextResponse.json(newsletter, { status: 201 });
}
