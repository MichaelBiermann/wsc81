import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [memberships, users, pendingEmails] = await Promise.all([
    prisma.pendingMembership.deleteMany({
      where: { tokenExpiresAt: { lt: new Date() } },
    }),
    prisma.user.deleteMany({
      where: { emailVerified: false, tokenExpiresAt: { lt: new Date() } },
    }),
    prisma.user.updateMany({
      where: { pendingEmailExpiresAt: { lt: new Date() }, pendingEmail: { not: null } },
      data: { pendingEmail: null, pendingEmailToken: null, pendingEmailExpiresAt: null },
    }),
  ]);

  console.log(`[Cleanup] Deleted ${memberships.count} expired pending memberships, ${users.count} unverified users, cleared ${pendingEmails.count} expired email changes`);
  return NextResponse.json({ deletedMemberships: memberships.count, deletedUsers: users.count, clearedPendingEmails: pendingEmails.count });
}
