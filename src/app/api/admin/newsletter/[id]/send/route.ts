import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendNewsletterToMember } from "@/lib/mailer";

async function requireAdmin() {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;
  return !!(session && user?.role === "admin");
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const newsletter = await prisma.newsletter.findUnique({ where: { id } });
  if (!newsletter) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (newsletter.status === "SENT") {
    return NextResponse.json({ error: "Already sent" }, { status: 409 });
  }

  const members = await prisma.member.findMany({
    where: { feesPaid: true },
    select: { email: true, locale: true },
  });

  // Send to all members (fire and forget individual sends)
  await Promise.allSettled(
    members.map((m) =>
      sendNewsletterToMember({
        to: m.email,
        subjectDe: newsletter.subjectDe,
        subjectEn: newsletter.subjectEn,
        bodyDe: newsletter.bodyDe,
        bodyEn: newsletter.bodyEn,
        locale: m.locale,
      })
    )
  );

  const updated = await prisma.newsletter.update({
    where: { id },
    data: { status: "SENT", sentAt: new Date(), recipientCount: members.length },
  });

  return NextResponse.json({ success: true, recipientCount: members.length, newsletter: updated });
}
