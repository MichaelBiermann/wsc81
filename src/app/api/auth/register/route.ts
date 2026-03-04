import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { UserRegisterSchema } from "@/lib/validation";
import { sendUserVerification } from "@/lib/mailer";
import crypto from "crypto";

function generateVerificationToken() {
  return crypto.randomBytes(48).toString("hex");
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = UserRegisterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation error", details: parsed.error.flatten() }, { status: 422 });
  }

  const data = parsed.data;

  // Check for existing user — always return 201 to prevent email enumeration
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    return NextResponse.json({ message: "verification_sent" }, { status: 201 });
  }

  const passwordHash = await bcrypt.hash(data.password, 12);
  const verificationToken = generateVerificationToken();
  const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      dob: new Date(data.dob),
      street: data.street,
      postalCode: data.postalCode,
      city: data.city,
      phone: data.phone,
      emailVerified: false,
      verificationToken,
      tokenExpiresAt,
      locale: data.locale,
    },
  });

  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const verificationUrl = `${BASE_URL}/api/auth/verify-email?token=${verificationToken}`;

  try {
    await sendUserVerification({
      to: data.email,
      firstName: data.firstName,
      verificationUrl,
      locale: data.locale,
    });
  } catch (mailError) {
    console.error("[POST /api/auth/register] Email send failed:", mailError);
  }

  return NextResponse.json({ message: "verification_sent" }, { status: 201 });
}
