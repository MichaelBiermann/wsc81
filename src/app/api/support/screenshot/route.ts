import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { put } from "@vercel/blob";

export async function POST(request: NextRequest) {
  const session = await auth();
  const sessionUser = session?.user as { id?: string; role?: string } | undefined;
  if (!session || !sessionUser?.id || sessionUser.role === "admin") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "no_file" }, { status: 400 });

  // Max 5 MB
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "too_large" }, { status: 400 });
  }

  const filename = `support-screenshots/${sessionUser.id}-${Date.now()}.png`;
  const blob = await put(filename, file, { access: "public", contentType: "image/png" });

  return NextResponse.json({ url: blob.url });
}
