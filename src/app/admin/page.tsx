"use client";

import { useAdminI18n } from "@/components/admin/AdminI18nProvider";
import { useEffect, useState } from "react";
import Link from "next/link";

interface DashboardData {
  eventsCount: number;
  membersCount: number;
  pendingCount: number;
  newslettersCount: number;
}

export default function AdminDashboard() {
  const { t } = useAdminI18n();
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch("/api/admin/dashboard").then((r) => r.json()).then(setData);
  }, []);

  const cards = data
    ? [
        { label: t.dashboard.events, value: data.eventsCount, href: "/admin/events", color: "bg-blue-500" },
        { label: t.dashboard.members, value: data.membersCount, href: "/admin/members", color: "bg-green-500" },
        { label: t.dashboard.pendingApplications, value: data.pendingCount, href: "/admin/members/pending", color: "bg-yellow-500" },
        { label: t.dashboard.newsletterDrafts, value: data.newslettersCount, href: "/admin/newsletter", color: "bg-purple-500" },
      ]
    : [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">{t.dashboard.title}</h1>
      {data ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((card) => (
            <Link key={card.label} href={card.href} className="rounded-lg bg-white border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className={`w-10 h-10 ${card.color} rounded-lg mb-3`} />
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              <p className="text-sm text-gray-500 mt-1">{card.label}</p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-lg bg-white border border-gray-200 p-5 shadow-sm animate-pulse">
              <div className="w-10 h-10 bg-gray-200 rounded-lg mb-3" />
              <div className="h-8 bg-gray-200 rounded w-12 mb-2" />
              <div className="h-4 bg-gray-100 rounded w-24" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
