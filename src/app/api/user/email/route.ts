import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendEmailChangeVerification } from "@/lib/mailer";
import crypto from "crypto";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

const emailSchema = z.object({
  newEmail: z.string().email().max(254).toLowerCase().trim(),
});

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || (session.user as { role?: string }).role === "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = emailSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const { newEmail } = parsed.data;
  const userId = session.user.id;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (newEmail === user.email) {
    return NextResponse.json({ error: "Same as current email" }, { status: 400 });
  }

  // Check if email is taken by another user
  const existing = await prisma.user.findFirst({
    where: { email: newEmail, NOT: { id: userId } },
  });
  if (existing) {
    return NextResponse.json({ error: "EMAIL_TAKEN" }, { status: 409 });
  }

  const token = crypto.randomBytes(48).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const verificationUrl = `${BASE_URL}/api/user/verify-email-change?token=${token}`;

  await prisma.user.update({
    where: { id: userId },
    data: {
      pendingEmail: newEmail,
      pendingEmailToken: token,
      pendingEmailExpiresAt: expiresAt,
    },
  });

  await sendEmailChangeVerification({
    to: newEmail,
    firstName: user.firstName,
    verificationUrl,
    locale: user.locale,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || (session.user as { role?: string }).role === "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      pendingEmail: null,
      pendingEmailToken: null,
      pendingEmailExpiresAt: null,
    },
  });

  return NextResponse.json({ ok: true });
}
