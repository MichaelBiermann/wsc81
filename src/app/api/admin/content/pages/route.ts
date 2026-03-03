import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ContentSchema } from "@/lib/validation";

async function requireAdmin() {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;
  if (!session || user?.role !== "admin") return false;
  return true;
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const pages = await prisma.page.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(pages);
}

export async function POST(request: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const parsed = ContentSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 });

  const d = parsed.data;
  const page = await prisma.page.create({
    data: {
      slug: d.slug,
      titleDe: d.titleDe,
      titleEn: d.titleEn,
      bodyDe: d.bodyDe,
      bodyEn: d.bodyEn,
      status: d.status,
      publishedAt: d.status === "PUBLISHED" ? new Date() : null,
    },
  });
  return NextResponse.json(page, { status: 201 });
}
