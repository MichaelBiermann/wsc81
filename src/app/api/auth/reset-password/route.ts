import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  const { token, password } = await request.json();
  if (!token || !password || password.length < 8) {
    return NextResponse.json({ error: "Invalid" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { passwordResetToken: token } });
  if (!user || !user.passwordResetExpiresAt) {
    return NextResponse.json({ error: "invalid_token" }, { status: 400 });
  }
  if (user.passwordResetExpiresAt < new Date()) {
    return NextResponse.json({ error: "expired_token" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, passwordResetToken: null, passwordResetExpiresAt: null },
  });

  return NextResponse.json({ ok: true });
}
