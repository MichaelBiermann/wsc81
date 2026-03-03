import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import NewsletterForm from "../NewsletterForm";

export default async function EditNewsletterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const newsletter = await prisma.newsletter.findUnique({ where: { id } });
  if (!newsletter) notFound();
  if (newsletter.status === "SENT") {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Newsletter (gesendet)</h1>
        <p className="text-gray-500">Dieser Newsletter wurde bereits gesendet und kann nicht mehr bearbeitet werden.</p>
        <p className="text-sm text-gray-400 mt-2">Empfänger: {newsletter.recipientCount} · Gesendet: {newsletter.sentAt?.toLocaleDateString("de-DE")}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Newsletter bearbeiten</h1>
      <NewsletterForm
        newsletterId={id}
        initial={{
          subjectDe: newsletter.subjectDe,
          subjectEn: newsletter.subjectEn,
          bodyDe: newsletter.bodyDe,
          bodyEn: newsletter.bodyEn,
        }}
      />
    </div>
  );
}
