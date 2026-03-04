import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isTokenExpired } from "@/lib/tokens";
import { sendMembershipWelcome } from "@/lib/mailer";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token") ?? "";

  const pending = await prisma.pendingMembership.findUnique({
    where: { activationToken: token },
  });

  if (!pending) {
    return NextResponse.redirect(
      new URL(`/de/membership/activate/${token}?status=invalid`, process.env.NEXT_PUBLIC_BASE_URL)
    );
  }

  if (isTokenExpired(pending.tokenExpiresAt)) {
    return NextResponse.redirect(
      new URL(`/${pending.locale}/membership/activate/${token}?status=expired`, process.env.NEXT_PUBLIC_BASE_URL)
    );
  }

  // Activate: create Member and delete PendingMembership in a transaction
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
    await tx.pendingMembership.delete({ where: { id: pending.id } });
    // Link to User account if one exists with the same email
    await tx.user.updateMany({
      where: { email: pending.email, memberId: null },
      data: { memberId: newMember.id },
    });
    return newMember;
  });

  await sendMembershipWelcome({
    to: member.email,
    person1Name: member.person1Name,
    memberNumber: member.memberNumber,
    locale: member.locale,
  });

  return NextResponse.redirect(
    new URL(
      `/${member.locale}/membership/activate/${token}?status=success&name=${encodeURIComponent(member.person1Name)}&memberNumber=${member.memberNumber}`,
      process.env.NEXT_PUBLIC_BASE_URL
    )
  );
}
