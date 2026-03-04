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
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const newsletter = await prisma.newsletter.findUnique({ where: { id } });
  if (!newsletter) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (newsletter.status === "SENT") {
    return NextResponse.json({ error: "Already sent" }, { status: 409 });
  }

  const body = await req.json().catch(() => ({}));
  const audience: "members" | "all" = body.audience === "all" ? "all" : "members";

  // Build recipient list: { email, locale }[]
  // Members (feesPaid) are always included
  const members = await prisma.member.findMany({
    where: { feesPaid: true },
    select: { email: true, locale: true },
  });

  let recipients: { email: string; locale: string }[] = [...members];

  if (audience === "all") {
    // Add verified users whose email is not already covered by a member
    const memberEmails = new Set(members.map((m) => m.email));
    const users = await prisma.user.findMany({
      where: { emailVerified: true },
      select: { email: true, locale: true },
    });
    for (const u of users) {
      if (!memberEmails.has(u.email)) {
        recipients.push({ email: u.email, locale: u.locale });
      }
    }
  }

  await Promise.allSettled(
    recipients.map((r) =>
      sendNewsletterToMember({
        to: r.email,
        subjectDe: newsletter.subjectDe,
        subjectEn: newsletter.subjectEn,
        bodyDe: newsletter.bodyDe,
        bodyEn: newsletter.bodyEn,
        locale: r.locale,
      })
    )
  );

  const updated = await prisma.newsletter.update({
    where: { id },
    data: { status: "SENT", sentAt: new Date(), recipientCount: recipients.length },
  });

  return NextResponse.json({ success: true, recipientCount: recipients.length, newsletter: updated });
}
