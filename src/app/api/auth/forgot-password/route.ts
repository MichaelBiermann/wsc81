import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPasswordReset } from "@/lib/mailer";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  const { email, locale } = await request.json();
  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

  // Always return 200 to prevent email enumeration
  if (user && user.emailVerified) {
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordResetToken: token, passwordResetExpiresAt: expiresAt },
    });
    const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    const resetUrl = `${BASE_URL}/${locale ?? "de"}/reset-password?token=${token}`;
    await sendPasswordReset({ to: user.email, firstName: user.firstName, resetUrl, locale: user.locale });
  }

  return NextResponse.json({ ok: true });
}
