import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { put } from "@vercel/blob";

const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(request: NextRequest) {
  const session = await auth();
  const sessionUser = session?.user as { role?: string } | undefined;
  if (sessionUser?.role !== "admin") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode") ?? "file";

  if (mode === "url") {
    const { url } = await request.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "No URL provided" }, { status: 400 });
    }
    let fetchRes: Response;
    try {
      fetchRes = await fetch(url);
    } catch {
      return NextResponse.json({ error: "fetch_failed" }, { status: 400 });
    }
    if (!fetchRes.ok) {
      return NextResponse.json({ error: "fetch_failed" }, { status: 400 });
    }
    const contentType = fetchRes.headers.get("content-type") ?? "image/jpeg";
    const mimeType = contentType.split(";")[0].trim();
    if (!ALLOWED_TYPES.includes(mimeType)) {
      return NextResponse.json({ error: "invalid_type" }, { status: 400 });
    }
    const buffer = await fetchRes.arrayBuffer();
    if (buffer.byteLength > MAX_SIZE) {
      return NextResponse.json({ error: "too_large" }, { status: 400 });
    }
    const ext = mimeType.split("/")[1].replace("jpeg", "jpg");
    const filename = `admin-images/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const blob = await put(filename, buffer, { access: "public", contentType: mimeType });
    return NextResponse.json({ url: blob.url });
  }

  // mode === "file"
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "invalid_type" }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "too_large" }, { status: 400 });
  }
  const ext = file.type.split("/")[1].replace("jpeg", "jpg");
  const filename = `admin-images/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const blob = await put(filename, file, { access: "public" });
  return NextResponse.json({ url: blob.url });
}
