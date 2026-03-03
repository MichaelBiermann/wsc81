"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ContentForm from "../../ContentForm";
import { useAdminI18n } from "@/components/admin/AdminI18nProvider";

interface PostData {
  id: string;
  slug: string;
  titleDe: string;
  titleEn: string;
  bodyDe: string;
  bodyEn: string;
  status: "DRAFT" | "PUBLISHED";
}

export default function EditNewsPage() {
  const { t } = useAdminI18n();
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<PostData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/content/news/${id}`).then((r) => r.json()).then((data) => {
      setPost(data);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <div className="text-gray-400">…</div>;
  if (!post) return null;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t.content.edit}: {post.titleDe}</h1>
      <ContentForm
        type="news"
        contentId={id}
        initial={{
          slug: post.slug,
          titleDe: post.titleDe,
          titleEn: post.titleEn,
          bodyDe: post.bodyDe,
          bodyEn: post.bodyEn,
          status: post.status,
        }}
      />
    </div>
  );
}
