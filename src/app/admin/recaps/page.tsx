"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAdminI18n } from "@/components/admin/AdminI18nProvider";

interface Recap {
  id: string;
  titleDe: string;
  slug: string;
  eventDate: string | null;
  status: "DRAFT" | "PUBLISHED";
  createdAt: string;
}

export default function AdminRecapsPage() {
  const { t } = useAdminI18n();
  const [recaps, setRecaps] = useState<Recap[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    fetch("/api/admin/recaps").then((r) => r.json()).then((data) => {
      setRecaps(data);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm(t.recaps.deleteConfirm)) return;
    await fetch(`/api/admin/recaps/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t.recaps.title}</h1>
        <Link href="/admin/recaps/new" className="rounded bg-[#4577ac] px-4 py-2 text-sm text-white hover:bg-[#2d5a8a] transition-colors">
          {t.recaps.newRecap}
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">{t.recaps.colTitle}</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">{t.recaps.colDate}</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">{t.recaps.colStatus}</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">{t.recaps.colActions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {recaps.map((recap) => (
              <tr key={recap.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{recap.titleDe}</td>
                <td className="px-4 py-3 text-gray-500">
                  {recap.eventDate ? new Date(recap.eventDate).toLocaleDateString("de-DE") : "—"}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded px-2 py-0.5 text-xs font-medium ${recap.status === "PUBLISHED" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                    {recap.status === "PUBLISHED" ? t.recaps.statusPublished : t.recaps.statusDraft}
                  </span>
                </td>
                <td className="px-4 py-3 flex gap-3">
                  <Link href={`/admin/recaps/${recap.id}`} className="text-[#4577ac] hover:underline">{t.recaps.edit}</Link>
                  <button onClick={() => handleDelete(recap.id)} className="text-red-500 hover:underline text-sm">{t.recaps.delete}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && recaps.length === 0 && (
          <p className="text-center text-gray-400 py-8">{t.recaps.noRecaps}</p>
        )}
      </div>
    </div>
  );
}
