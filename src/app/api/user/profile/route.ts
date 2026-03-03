import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const Schema = z.object({
  street:     z.string().min(1).max(200).trim(),
  postalCode: z.string().regex(/^\d{5}$/, "5-stellige PLZ erforderlich"),
  city:       z.string().min(1).max(100).trim(),
  phone:      z.string().min(1).max(50).trim(),
});

export async function PATCH(req: NextRequest) {
  const session = await auth();
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const user = await prisma.user.update({
    where: { id: userId },
    data: parsed.data,
  });

  return NextResponse.json({ ok: true, user: { street: user.street, postalCode: user.postalCode, city: user.city, phone: user.phone } });
}
