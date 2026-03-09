import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { sendTicketCreatedToAdmin } from "@/lib/mailer";

const SupportTicketSchema = z.object({
  type: z.enum(["BUG", "FEATURE", "QUESTION", "OTHER"]),
  subject: z.string().min(1).max(200),
  body: z.string().min(1).max(2000),
  screenshotUrl: z.string().url().optional().or(z.literal("")).transform(v => v || undefined),
});

export async function POST(request: NextRequest) {
  const session = await auth();
  const sessionUser = session?.user as { id?: string; role?: string; name?: string } | undefined;
  if (!session || !sessionUser?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (sessionUser.role === "admin") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = SupportTicketSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { firstName: true, lastName: true, email: true, locale: true },
  });
  if (!user) return NextResponse.json({ error: "user_not_found" }, { status: 404 });

  const ticket = await prisma.supportTicket.create({
    data: {
      type: parsed.data.type,
      subject: parsed.data.subject,
      body: parsed.data.body,
      screenshotUrl: parsed.data.screenshotUrl,
      userId: sessionUser.id,
    },
  });

  try {
    await sendTicketCreatedToAdmin({
      ticketId: ticket.id,
      subject: ticket.subject,
      body: ticket.body,
      type: ticket.type,
      userName: `${user.firstName} ${user.lastName}`,
      userEmail: user.email,
      screenshotUrl: ticket.screenshotUrl ?? undefined,
    });
  } catch {
    // Non-fatal: ticket is created, email failure shouldn't block the user
  }

  return NextResponse.json({ id: ticket.id }, { status: 201 });
}
