import { NextRequest, NextResponse } from "next/server";
import { search } from "@/lib/search";
import { SearchSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const parsed = SearchSchema.safeParse({ q: searchParams.get("q") ?? "" });
  if (!parsed.success) {
    return NextResponse.json({ results: [] });
  }
  const locale = searchParams.get("locale") ?? "de";
  const results = await search(parsed.data.q, locale);
  return NextResponse.json({ results });
}
