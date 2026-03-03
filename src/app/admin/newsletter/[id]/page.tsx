"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import NewsletterForm from "../NewsletterForm";
import { useAdminI18n } from "@/components/admin/AdminI18nProvider";

interface NewsletterData {
  id: string;
  subjectDe: string;
  subjectEn: string;
  bodyDe: string;
  bodyEn: string;
  status: "DRAFT" | "SENT";
  sentAt: string | null;
  recipientCount: number | null;
}

export default function EditNewsletterPage() {
  const { t } = useAdminI18n();
  const { id } = useParams<{ id: string }>();
  const [newsletter, setNewsletter] = useState<NewsletterData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/newsletter/${id}`).then((r) => r.json()).then((data) => {
      setNewsletter(data);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <div className="text-gray-400">…</div>;
  if (!newsletter) return null;

  if (newsletter.status === "SENT") {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">{t.newsletter.title} ({t.newsletter.statusSent})</h1>
        <p className="text-gray-500">{t.newsletter.alreadySent} {newsletter.recipientCount} {t.newsletter.recipients}.</p>
        <p className="text-sm text-gray-400 mt-2">{newsletter.sentAt ? new Date(newsletter.sentAt).toLocaleDateString("de-DE") : ""}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t.newsletter.editTitle}</h1>
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
