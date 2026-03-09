import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { sendTicketReplyToUser } from "@/lib/mailer";

async function requireAdmin() {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;
  if (!session || user?.role !== "admin") return false;
  return true;
}

const ReplySchema = z.object({
  body: z.string().min(1).max(5000),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = ReplySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 });

  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: { user: { select: { firstName: true, lastName: true, email: true, locale: true } } },
  });
  if (!ticket) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const message = await prisma.supportMessage.create({
    data: { ticketId: id, fromAdmin: true, body: parsed.data.body },
  });

  // Advance status from OPEN → IN_PROGRESS on first admin reply
  if (ticket.status === "OPEN") {
    await prisma.supportTicket.update({ where: { id }, data: { status: "IN_PROGRESS" } });
  }

  try {
    await sendTicketReplyToUser({
      to: ticket.user.email,
      userName: `${ticket.user.firstName} ${ticket.user.lastName}`,
      ticketSubject: ticket.subject,
      ticketId: ticket.id,
      adminReply: parsed.data.body,
      locale: ticket.user.locale,
    });
  } catch {
    // Non-fatal: reply is saved, email failure is secondary
  }

  return NextResponse.json(message, { status: 201 });
}
