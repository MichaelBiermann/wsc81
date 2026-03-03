"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ContentForm from "../../ContentForm";
import { useAdminI18n } from "@/components/admin/AdminI18nProvider";

interface PageData {
  id: string;
  slug: string;
  titleDe: string;
  titleEn: string;
  bodyDe: string;
  bodyEn: string;
  status: "DRAFT" | "PUBLISHED";
}

export default function EditPagePage() {
  const { t } = useAdminI18n();
  const { id } = useParams<{ id: string }>();
  const [page, setPage] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/content/pages/${id}`).then((r) => r.json()).then((data) => {
      setPage(data);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <div className="text-gray-400">…</div>;
  if (!page) return null;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t.content.edit}: {page.titleDe}</h1>
      <ContentForm
        type="pages"
        contentId={id}
        initial={{
          slug: page.slug,
          titleDe: page.titleDe,
          titleEn: page.titleEn,
          bodyDe: page.bodyDe,
          bodyEn: page.bodyEn,
          status: page.status,
        }}
      />
    </div>
  );
}
