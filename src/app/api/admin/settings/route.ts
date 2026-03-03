import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { encryptIBAN, ibanLast4 } from "@/lib/crypto";
import { ClubSettingsSchema } from "@/lib/validation";

async function requireAdmin() {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;
  return !!(session && user?.role === "admin");
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const settings = await prisma.clubSettings.findFirst();
  if (!settings) return NextResponse.json(null);
  // Return masked IBAN
  return NextResponse.json({
    ...settings,
    ibanEncrypted: undefined,
    ibanMasked: `****${settings.ibanLast4}`,
  });
}

export async function PUT(request: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const parsed = ClubSettingsSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 });

  const { iban, bankName, bic, feeCollectionDay, feeCollectionMonth } = parsed.data;
  const encIban = encryptIBAN(iban);
  const last4 = ibanLast4(iban);

  const existing = await prisma.clubSettings.findFirst();
  const settings = existing
    ? await prisma.clubSettings.update({
        where: { id: existing.id },
        data: { bankName, ibanEncrypted: encIban, ibanLast4: last4, bic, feeCollectionDay, feeCollectionMonth },
      })
    : await prisma.clubSettings.create({
        data: { bankName, ibanEncrypted: encIban, ibanLast4: last4, bic, feeCollectionDay, feeCollectionMonth },
      });

  return NextResponse.json({ ...settings, ibanEncrypted: undefined, ibanMasked: `****${last4}` });
}
