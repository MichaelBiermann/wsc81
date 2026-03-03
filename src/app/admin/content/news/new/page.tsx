"use client";

import ContentForm from "../../ContentForm";
import { useAdminI18n } from "@/components/admin/AdminI18nProvider";

export default function NewNewsPage() {
  const { t } = useAdminI18n();
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t.content.newNews}</h1>
      <ContentForm type="news" />
    </div>
  );
}
