"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAdminI18n } from "@/components/admin/AdminI18nProvider";

interface Newsletter {
  id: string;
  subjectDe: string;
  subjectEn: string;
  bodyDe: string;
  bodyEn: string;
  status: "DRAFT" | "SENT";
  sentAt: string | null;
  recipientCount: number | null;
}

export default function AdminNewsletterPage() {
  const { t } = useAdminI18n();
  const router = useRouter();
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/newsletter").then((r) => r.json()).then((data) => {
      setNewsletters(data);
      setLoading(false);
    });
  }, []);

  async function deleteNewsletter(id: string) {
    if (!confirm(t.newsletter.deleteConfirm)) return;
    await fetch(`/api/admin/newsletter/${id}`, { method: "DELETE" });
    setNewsletters((prev) => prev.filter((n) => n.id !== id));
  }

  async function useAsTemplate(n: Newsletter) {
    const res = await fetch("/api/admin/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subjectDe: n.subjectDe,
        subjectEn: n.subjectEn,
        bodyDe: n.bodyDe,
        bodyEn: n.bodyEn,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      router.push(`/admin/newsletter/${data.id}`);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t.newsletter.title}</h1>
        <Link href="/admin/newsletter/new" className="rounded bg-[#4577ac] px-4 py-2 text-sm text-white hover:bg-[#2d5a8a] transition-colors">
          {t.newsletter.newNewsletter}
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">{t.newsletter.colSubject}</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">{t.newsletter.colStatus}</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">{t.newsletter.colSent}</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">{t.newsletter.colRecipients}</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">{t.newsletter.colActions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {newsletters.map((n) => (
              <tr key={n.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{n.subjectDe}</td>
                <td className="px-4 py-3">
                  <span className={`rounded px-2 py-0.5 text-xs font-medium ${n.status === "SENT" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                    {n.status === "SENT" ? t.newsletter.statusSent : t.newsletter.statusDraft}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{n.sentAt ? new Date(n.sentAt).toLocaleDateString("de-DE") : "—"}</td>
                <td className="px-4 py-3 text-gray-600">{n.recipientCount ?? "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {n.status === "DRAFT" && (
                      <Link href={`/admin/newsletter/${n.id}`} className="text-[#4577ac] hover:underline">
                        {t.newsletter.edit}
                      </Link>
                    )}
                    <button
                      onClick={() => useAsTemplate(n)}
                      className="text-gray-500 hover:text-[#4577ac] hover:underline"
                    >
                      {t.newsletter.useAsTemplate}
                    </button>
                    <button
                      onClick={() => deleteNewsletter(n.id)}
                      className="text-red-500 hover:text-red-700 hover:underline"
                    >
                      {t.newsletter.delete}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && newsletters.length === 0 && (
          <p className="text-center text-gray-400 py-8">{t.newsletter.noNewsletters}</p>
        )}
      </div>
    </div>
  );
}

