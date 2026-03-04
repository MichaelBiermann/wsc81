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

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const recap = await prisma.recap.findUnique({ where: { id } });
  if (!recap) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(recap);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await request.json();
  const parsed = RecapSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 });

  const d = parsed.data;
  const existing = await prisma.recap.findUnique({ where: { id } });
  const recap = await prisma.recap.update({
    where: { id },
    data: {
      slug: d.slug,
      titleDe: d.titleDe,
      titleEn: d.titleEn,
      bodyDe: d.bodyDe,
      bodyEn: d.bodyEn,
      eventDate: d.eventDate ? new Date(d.eventDate) : null,
      imageUrl: d.imageUrl ?? null,
      status: d.status,
      publishedAt: d.status === "PUBLISHED" && !existing?.publishedAt ? new Date() : existing?.publishedAt,
    },
  });
  return NextResponse.json(recap);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await prisma.recap.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
