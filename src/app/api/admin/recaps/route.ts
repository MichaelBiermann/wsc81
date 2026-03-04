import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { RecapSchema } from "@/lib/validation";

async function requireAdmin() {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;
  if (!session || user?.role !== "admin") return false;
  return true;
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const recaps = await prisma.recap.findMany({ orderBy: { eventDate: "desc" } });
  return NextResponse.json(recaps);
}

export async function POST(request: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const parsed = RecapSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 });

  const d = parsed.data;
  const recap = await prisma.recap.create({
    data: {
      slug: d.slug,
      titleDe: d.titleDe,
      titleEn: d.titleEn,
      bodyDe: d.bodyDe,
      bodyEn: d.bodyEn,
      eventDate: d.eventDate ? new Date(d.eventDate) : null,
      imageUrl: d.imageUrl ?? null,
      status: d.status,
      publishedAt: d.status === "PUBLISHED" ? new Date() : null,
    },
  });
  return NextResponse.json(recap, { status: 201 });
}
