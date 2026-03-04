import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendMembershipWelcome } from "@/lib/mailer";

async function requireAdmin() {
  const session = await auth();
  return (session?.user as { role?: string })?.role === "admin";
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.pendingMembership.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const pending = await prisma.pendingMembership.findUnique({ where: { id } });
  if (!pending) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const member = await prisma.$transaction(async (tx) => {
    const newMember = await tx.member.create({
      data: {
        category: pending.category,
        person1Name: pending.person1Name,
        person1Dob: pending.person1Dob,
        person2Name: pending.person2Name,
        person2Dob: pending.person2Dob,
        person3Name: pending.person3Name,
        person3Dob: pending.person3Dob,
        person4Name: pending.person4Name,
        person4Dob: pending.person4Dob,
        person5Name: pending.person5Name,
        person5Dob: pending.person5Dob,
        street: pending.street,
        postalCode: pending.postalCode,
        city: pending.city,
        phone: pending.phone,
        email: pending.email,
        bankName: pending.bankName,
        ibanEncrypted: pending.ibanEncrypted,
        ibanLast4: pending.ibanLast4,
        bic: pending.bic,
        locale: pending.locale,
      },
    });
    await tx.pendingMembership.delete({ where: { id } });
    return newMember;
  });

  sendMembershipWelcome({
    to: member.email,
    person1Name: member.person1Name,
    memberNumber: member.memberNumber,
    locale: member.locale,
  }).catch((e) => console.error("[POST /api/admin/members/pending] Welcome email failed:", e));

  return NextResponse.json({ ok: true, memberNumber: member.memberNumber });
}
