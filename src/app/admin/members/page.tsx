"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAdminI18n } from "@/components/admin/AdminI18nProvider";
import FeesPaidToggle from "./FeesPaidToggle";

const CATEGORY_LABELS: Record<string, Record<string, string>> = {
  de: { FAMILIE: "Familie", ERWACHSENE: "Erwachsene", JUGENDLICHE: "Jugendliche", SENIOREN: "Senioren", GDB: "GdB ab 50%" },
  en: { FAMILIE: "Family", ERWACHSENE: "Adults", JUGENDLICHE: "Youth", SENIOREN: "Seniors", GDB: "Disability ≥50%" },
};

interface Member {
  id: string;
  memberNumber: number;
  person1Name: string;
  email: string;
  category: string;
  feesPaid: boolean;
  activatedAt: string;
}

export default function AdminMembersPage() {
  const { t, locale } = useAdminI18n();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/members").then((r) => r.json()).then((data) => {
      setMembers(data);
      setLoading(false);
    });
  }, []);

  const catLabels = CATEGORY_LABELS[locale] ?? CATEGORY_LABELS.de;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t.members.title}</h1>
        <Link href="/admin/members/pending" className="text-sm text-[#4577ac] hover:underline">
          {t.members.pendingLink}
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">#</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">{t.members.colName}</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">{t.members.colEmail}</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">{t.members.colCategory}</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">{t.members.colFee}</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">{t.members.colActivated}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {!loading && members.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">—</td></tr>
            ) : members.map((m) => (
              <tr key={m.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500">{m.memberNumber}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{m.person1Name}</td>
                <td className="px-4 py-3 text-gray-600">{m.email}</td>
                <td className="px-4 py-3">{catLabels[m.category] ?? m.category}</td>
                <td className="px-4 py-3">
                  <FeesPaidToggle id={m.id} feesPaid={m.feesPaid} />
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {new Date(m.activatedAt).toLocaleDateString("de-DE")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
