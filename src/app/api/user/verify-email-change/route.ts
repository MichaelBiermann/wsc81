import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(new URL("/de/account?emailChange=invalid", request.url));
  }

  const user = await prisma.user.findUnique({ where: { pendingEmailToken: token } });

  if (!user) {
    return NextResponse.redirect(new URL("/de/account?emailChange=invalid", request.url));
  }

  const locale = user.locale ?? "de";

  if (!user.pendingEmailExpiresAt || user.pendingEmailExpiresAt < new Date()) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        pendingEmail: null,
        pendingEmailToken: null,
        pendingEmailExpiresAt: null,
      },
    });
    return NextResponse.redirect(
      new URL(`/${locale}/account?emailChange=expired`, request.url)
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      email: user.pendingEmail!,
      pendingEmail: null,
      pendingEmailToken: null,
      pendingEmailExpiresAt: null,
    },
  });

  return NextResponse.redirect(
    new URL(`/${locale}/account?emailChange=success`, request.url)
  );
}
