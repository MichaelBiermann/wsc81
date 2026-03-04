import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { put, del } from "@vercel/blob";

const MAX_SIZE = 2 * 1024 * 1024; // 2 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(request: NextRequest) {
  const session = await auth();
  const sessionUser = session?.user as { id?: string; role?: string } | undefined;
  if (!sessionUser?.id || sessionUser.role === "admin") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("avatar") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "invalid_type" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "too_large" }, { status: 400 });
  }

  // Delete old avatar if it exists
  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { avatarUrl: true },
  });
  if (user?.avatarUrl) {
    try { await del(user.avatarUrl); } catch { /* ignore if already gone */ }
  }

  const ext = file.type.split("/")[1].replace("jpeg", "jpg");
  const blob = await put(`avatars/${sessionUser.id}.${ext}`, file, {
    access: "public",
    addRandomSuffix: false,
  });

  await prisma.user.update({
    where: { id: sessionUser.id },
    data: { avatarUrl: blob.url },
  });

  return NextResponse.json({ avatarUrl: blob.url });
}

export async function DELETE() {
  const session = await auth();
  const sessionUser = session?.user as { id?: string; role?: string } | undefined;
  if (!sessionUser?.id || sessionUser.role === "admin") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { avatarUrl: true },
  });
  if (user?.avatarUrl) {
    try { await del(user.avatarUrl); } catch { /* ignore */ }
  }

  await prisma.user.update({
    where: { id: sessionUser.id },
    data: { avatarUrl: null },
  });

  return NextResponse.json({ ok: true });
}
