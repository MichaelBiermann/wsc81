import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { sendUserVerification } from "@/lib/mailer";
import crypto from "crypto";
import { put } from "@vercel/blob";

function generateVerificationToken() {
  return crypto.randomBytes(48).toString("hex");
}

const postalCodeDE = /^\d{5}$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const UserRegisterSchema = z.object({
  firstName:  z.string().min(1).max(100).trim(),
  lastName:   z.string().min(1).max(100).trim(),
  dob:        z.string().regex(dateRegex),
  street:     z.string().min(1).max(200).trim(),
  postalCode: z.string().regex(postalCodeDE),
  city:       z.string().min(1).max(100).trim(),
  phone:      z.string().min(1).max(50).trim(),
  email:      z.string().email().max(254).toLowerCase(),
  password:   z.string().min(8).max(128),
  locale:     z.enum(["de", "en"]).default("de"),
});

const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_AVATAR_SIZE = 2 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    let fields: Record<string, string> = {};
    let avatarFile: File | null = null;

    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      for (const [key, value] of formData.entries()) {
        if (key === "avatar" && value instanceof File && value.size > 0) {
          avatarFile = value;
        } else if (typeof value === "string") {
          fields[key] = value;
        }
      }
    } else {
      try {
        fields = await request.json();
      } catch {
        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
      }
    }

    const parsed = UserRegisterSchema.safeParse(fields);
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

    // Upload avatar if provided — non-fatal if it fails
    let avatarUrl: string | null = null;
    if (avatarFile && ALLOWED_AVATAR_TYPES.includes(avatarFile.type) && avatarFile.size <= MAX_AVATAR_SIZE) {
      try {
        const ext = avatarFile.type.split("/")[1].replace("jpeg", "jpg");
        const emailHash = crypto.createHash("md5").update(data.email).digest("hex").slice(0, 16);
        const blob = await put(`avatars/${emailHash}.${ext}`, avatarFile, {
          access: "public",
          addRandomSuffix: false,
        });
        avatarUrl = blob.url;
      } catch (e) {
        console.error("[POST /api/auth/register] Avatar upload failed:", e);
      }
    }

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
        avatarUrl,
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
  } catch (error) {
    console.error("[POST /api/auth/register]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
