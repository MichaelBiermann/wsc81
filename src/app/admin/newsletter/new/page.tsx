"use client";

import NewsletterForm from "../NewsletterForm";
import { useAdminI18n } from "@/components/admin/AdminI18nProvider";

export default function NewNewsletterPage() {
  const { t } = useAdminI18n();
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t.newsletter.newTitle}</h1>
      <NewsletterForm />
    </div>
  );
}
