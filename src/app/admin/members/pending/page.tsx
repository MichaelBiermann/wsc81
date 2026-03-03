"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAdminI18n } from "@/components/admin/AdminI18nProvider";
import DeleteButton from "./DeleteButton";

const CATEGORY_LABELS: Record<string, Record<string, string>> = {
  de: { FAMILIE: "Familie", ERWACHSENE: "Erwachsene", JUGENDLICHE: "Jugendliche", SENIOREN: "Senioren", GDB: "GdB ab 50%" },
  en: { FAMILIE: "Family", ERWACHSENE: "Adults", JUGENDLICHE: "Youth", SENIOREN: "Seniors", GDB: "Disability ≥50%" },
};

interface PendingMember {
  id: string;
  person1Name: string;
  email: string;
  category: string;
  createdAt: string;
  tokenExpiresAt: string;
}

export default function AdminPendingMembersPage() {
  const { t, locale } = useAdminI18n();
  const [pending, setPending] = useState<PendingMember[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    fetch("/api/admin/members/pending").then((r) => r.json()).then((data) => {
      setPending(data);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const catLabels = CATEGORY_LABELS[locale] ?? CATEGORY_LABELS.de;
  const now = new Date();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t.pendingMembers.title}</h1>
        <Link href="/admin/members" className="text-sm text-[#4577ac] hover:underline">
          {t.pendingMembers.backLink}
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">{t.members.colName}</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">{t.members.colEmail}</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">{t.members.colCategory}</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">{t.pendingMembers.colSubmitted}</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">{t.pendingMembers.colExpires}</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {!loading && pending.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">—</td></tr>
            ) : pending.map((p) => {
              const expired = new Date(p.tokenExpiresAt) < now;
              return (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{p.person1Name}</td>
                  <td className="px-4 py-3 text-gray-600">{p.email}</td>
                  <td className="px-4 py-3">{catLabels[p.category] ?? p.category}</td>
                  <td className="px-4 py-3 text-gray-500">{new Date(p.createdAt).toLocaleDateString("de-DE")}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${expired ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                      {expired ? t.pendingMembers.colExpired : new Date(p.tokenExpiresAt).toLocaleDateString("de-DE")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <DeleteButton id={p.id} onDeleted={load} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
