import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY ?? "");
const FROM = process.env.SENDGRID_FROM ?? "";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? FROM;

async function requireAdmin() {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;
  return !!(session && user?.role === "admin");
}

// GET — list sent mails for this event
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const mails = await prisma.eventMail.findMany({
    where: { eventId: id },
    orderBy: { sentAt: "desc" },
  });
  return NextResponse.json(mails);
}

// POST — send info mail to all bookings or a single booking
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  try {
  const body = await req.json();
  const { purpose, subject, mailBody, bookingId } = body as {
    purpose: string;
    subject: string;
    mailBody: string;
    bookingId?: string; // if provided: send only to this booking
  };

  const bodyText = mailBody?.replace(/<[^>]+>/g, "").trim();
  if (!purpose?.trim() || !subject?.trim() || !bodyText) {
    return NextResponse.json({ error: "purpose, subject and mailBody are required" }, { status: 400 });
  }

  const event = await prisma.event.findUnique({ where: { id }, include: { bookings: true } });
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  const bookings = bookingId
    ? event.bookings.filter((b) => b.id === bookingId)
    : event.bookings;

  if (bookings.length === 0) {
    return NextResponse.json({ error: "No bookings found" }, { status: 400 });
  }

  // Deduplicate by email
  const uniqueEmails = new Map<string, string>(); // email → person1Name
  for (const b of bookings) {
    if (!uniqueEmails.has(b.email)) {
      uniqueEmails.set(b.email, b.person1Name);
    }
  }

  const messages = Array.from(uniqueEmails.entries()).map(([to, name]) => ({
    from: FROM,
    replyTo: ADMIN_EMAIL,
    to,
    subject,
    html: mailBody.replace(/\{\{name\}\}/g, name),
    text: mailBody.replace(/<[^>]+>/g, "").replace(/\n\s*\n/g, "\n").replace(/\{\{name\}\}/g, name),
  }));

  // Send individually — sgMail.send() handles one message at a time reliably
  try {
    await Promise.all(messages.map((msg) => sgMail.send(msg)));
  } catch (err) {
    const sgErr = err as { response?: { body?: unknown } };
    console.error("SendGrid error:", JSON.stringify(sgErr?.response?.body ?? err));
    return NextResponse.json(
      { error: "Mail delivery failed", detail: sgErr?.response?.body ?? String(err) },
      { status: 500 }
    );
  }

  const saved = await prisma.eventMail.create({
    data: {
      eventId: id,
      purpose: purpose.trim(),
      subject: subject.trim(),
      body: mailBody,
      recipientCount: messages.length,
    },
  });

  return NextResponse.json(saved, { status: 201 });
  } catch (err) {
    console.error("Mail route unexpected error:", err);
    return NextResponse.json({ error: "Internal error", detail: String(err) }, { status: 500 });
  }
}
