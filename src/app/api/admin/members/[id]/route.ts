import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  return (session?.user as { role?: string })?.role === "admin";
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  // Allow toggling feesPaid OR editing full member fields
  const allowedFields = [
    "feesPaid", "category", "email", "phone", "street", "postalCode", "city",
    "person1Name", "person2Name", "person3Name", "person4Name", "person5Name",
    "person6Name", "person7Name", "person8Name", "person9Name", "person10Name",
  ];
  const data: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (key in body) data[key] = body[key];
  }

  const member = await prisma.member.update({ where: { id }, data });
  return NextResponse.json(member);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  // Unlink user account before deleting member
  await prisma.user.updateMany({ where: { memberId: id }, data: { memberId: null } });
  await prisma.member.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
