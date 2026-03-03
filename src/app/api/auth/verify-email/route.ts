import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendUserWelcome } from "@/lib/mailer";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { verificationToken: token } });

  if (!user) {
    return NextResponse.redirect(new URL("/de/account/verified?status=invalid", request.url));
  }

  if (!user.tokenExpiresAt || user.tokenExpiresAt < new Date()) {
    return NextResponse.redirect(new URL("/de/account/verified?status=expired", request.url));
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      verificationToken: null,
      tokenExpiresAt: null,
    },
  });

  await sendUserWelcome({ to: user.email, firstName: user.firstName, locale: user.locale });

  const locale = user.locale ?? "de";
  return NextResponse.redirect(new URL(`/${locale}/account/verified?status=success`, request.url));
}
