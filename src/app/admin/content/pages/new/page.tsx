"use client";

import ContentForm from "../../ContentForm";
import { useAdminI18n } from "@/components/admin/AdminI18nProvider";

export default function NewPagePage() {
  const { t } = useAdminI18n();
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t.content.newPage}</h1>
      <ContentForm type="pages" />
    </div>
  );
}
