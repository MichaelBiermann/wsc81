import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { encryptIBAN, ibanLast4 } from "@/lib/crypto";
import { generateActivationToken, tokenExpiresAt } from "@/lib/tokens";
import { sendMembershipConfirmation, sendMembershipAccountCreated } from "@/lib/mailer";
import { MembershipSchema } from "@/lib/validation";
import bcrypt from "bcryptjs";
import crypto from "crypto";

function generateOTP(): string {
  // 10-char alphanumeric OTP
  return crypto.randomBytes(8).toString("base64url").slice(0, 10);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = MembershipSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Check for existing member or pending (prevent enumeration: always return 201)
    const [existingMember, existingPending] = await Promise.all([
      prisma.member.findUnique({ where: { email: data.email } }),
      prisma.pendingMembership.findUnique({ where: { email: data.email } }),
    ]);

    if (!existingMember && !existingPending) {
      const encIban = encryptIBAN(data.iban);
      const last4 = ibanLast4(data.iban);
      const token = generateActivationToken();
      const expiresAt = tokenExpiresAt();

      await prisma.pendingMembership.create({
        data: {
          category: data.category,
          person1Name: data.person1.name,
          person1Dob: new Date(data.person1.dob),
          person2Name: data.person2?.name ?? null,
          person2Dob: data.person2?.dob ? new Date(data.person2.dob) : null,
          person3Name: data.person3?.name ?? null,
          person3Dob: data.person3?.dob ? new Date(data.person3.dob) : null,
          person4Name: data.person4?.name ?? null,
          person4Dob: data.person4?.dob ? new Date(data.person4.dob) : null,
          person5Name: data.person5?.name ?? null,
          person5Dob: data.person5?.dob ? new Date(data.person5.dob) : null,
          person6Name: data.person6?.name ?? null,
          person6Dob: data.person6?.dob ? new Date(data.person6.dob) : null,
          person7Name: data.person7?.name ?? null,
          person7Dob: data.person7?.dob ? new Date(data.person7.dob) : null,
          person8Name: data.person8?.name ?? null,
          person8Dob: data.person8?.dob ? new Date(data.person8.dob) : null,
          person9Name: data.person9?.name ?? null,
          person9Dob: data.person9?.dob ? new Date(data.person9.dob) : null,
          person10Name: data.person10?.name ?? null,
          person10Dob: data.person10?.dob ? new Date(data.person10.dob) : null,
          street: data.street,
          postalCode: data.postalCode,
          city: data.city,
          phone: data.phone,
          email: data.email,
          bankName: data.bankName,
          ibanEncrypted: encIban,
          ibanLast4: last4,
          bic: data.bic,
          consentData: data.consentData === true,
          consentCancellation: data.consentCancellation === true,
          consentBylaws: data.consentBylaws === true,
          activationToken: token,
          tokenExpiresAt: expiresAt,
          locale: data.locale,
        },
      });

      // Auto-create user account if none exists for this email
      const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
      let accountCreated = false;
      let otp = "";

      if (!existingUser) {
        otp = generateOTP();
        const passwordHash = await bcrypt.hash(otp, 12);
        // Parse name: use person1Name, split on first space
        const nameParts = data.person1.name.trim().split(/\s+/);
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(" ") || "-";
        const dobDate = new Date(data.person1.dob);

        await prisma.user.create({
          data: {
            email: data.email,
            passwordHash,
            firstName,
            lastName,
            dob: dobDate,
            street: data.street,
            postalCode: data.postalCode,
            city: data.city,
            phone: data.phone,
            locale: data.locale,
            emailVerified: false,
            verificationToken: token, // same token as membership activation
            tokenExpiresAt: expiresAt,
            mustChangePassword: true,
          },
        });
        accountCreated = true;
      }

      try {
        if (accountCreated) {
          await sendMembershipAccountCreated({
            to: data.email,
            person1Name: data.person1.name,
            activationToken: token,
            otp,
            locale: data.locale,
          });
        } else {
          await sendMembershipConfirmation({
            to: data.email,
            person1Name: data.person1.name,
            activationToken: token,
            locale: data.locale,
          });
        }
      } catch (mailError) {
        console.error("[POST /api/membership] Email send failed:", mailError);
      }
    }

    return NextResponse.json({ message: "confirmation_sent" }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/membership]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
