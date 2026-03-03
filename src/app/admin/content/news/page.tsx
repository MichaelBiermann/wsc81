"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAdminI18n } from "@/components/admin/AdminI18nProvider";

interface Post {
  id: string;
  titleDe: string;
  slug: string;
  status: "DRAFT" | "PUBLISHED";
  createdAt: string;
}

export default function AdminContentNewsPage() {
  const { t } = useAdminI18n();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    fetch("/api/admin/content/news").then((r) => r.json()).then((data) => {
      setPosts(data);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm(t.content.deleteNewsConfirm)) return;
    await fetch(`/api/admin/content/news/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t.content.title}</h1>
          <div className="flex gap-4 mt-2 text-sm">
            <span className="font-semibold text-[#4577ac] border-b-2 border-[#4577ac] pb-0.5">{t.content.tabNews}</span>
            <Link href="/admin/content/pages" className="text-gray-500 hover:text-gray-800 transition-colors pb-0.5">{t.content.tabPages}</Link>
          </div>
        </div>
        <Link href="/admin/content/news/new" className="rounded bg-[#4577ac] px-4 py-2 text-sm text-white hover:bg-[#2d5a8a] transition-colors">
          {t.content.newNews}
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">{t.content.colTitle}</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">{t.content.colSlug}</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">{t.content.colStatus}</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">{t.content.colCreated}</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">{t.content.colActions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {posts.map((post) => (
              <tr key={post.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{post.titleDe}</td>
                <td className="px-4 py-3 text-gray-500 font-mono text-xs">{post.slug}</td>
                <td className="px-4 py-3">
                  <span className={`rounded px-2 py-0.5 text-xs font-medium ${post.status === "PUBLISHED" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                    {post.status === "PUBLISHED" ? t.content.statusPublished : t.content.statusDraft}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{new Date(post.createdAt).toLocaleDateString("de-DE")}</td>
                <td className="px-4 py-3 flex gap-3">
                  <Link href={`/admin/content/news/${post.id}`} className="text-[#4577ac] hover:underline">{t.content.edit}</Link>
                  <button onClick={() => handleDelete(post.id)} className="text-red-500 hover:underline text-sm">{t.content.delete}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && posts.length === 0 && (
          <p className="text-center text-gray-400 py-8">{t.content.noNews}</p>
        )}
      </div>
    </div>
  );
}
