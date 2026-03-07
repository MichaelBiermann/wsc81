"use client";

import { useAdminI18n } from "@/components/admin/AdminI18nProvider";
import { useEffect, useState } from "react";
import Link from "next/link";

interface DashboardData {
  eventsCount: number;
  membersCount: number;
  pendingCount: number;
  newslettersCount: number;
  recapsCount: number;
  usersCount: number;
}

export default function AdminDashboard() {
  const { t } = useAdminI18n();
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch("/api/admin/dashboard").then((r) => r.json()).then(setData);
  }, []);

  const cards = data
    ? [
        { label: t.dashboard.events, value: data.eventsCount, href: "/admin/events", icon: "event", color: "text-[#4577ac]" },
        { label: t.dashboard.members, value: data.membersCount, href: "/admin/members", icon: "group", color: "text-[#4577ac]" },
        { label: t.dashboard.pendingApplications, value: data.pendingCount, href: "/admin/members/pending", icon: "pending_actions", color: "text-[#4577ac]" },
        { label: t.dashboard.newsletterDrafts, value: data.newslettersCount, href: "/admin/newsletter", icon: "mail", color: "text-[#4577ac]" },
        { label: t.dashboard.recaps, value: data.recapsCount, href: "/admin/recaps", icon: "photo_album", color: "text-[#4577ac]" },
        { label: t.dashboard.users, value: data.usersCount, href: "/admin/users", icon: "manage_accounts", color: "text-[#4577ac]" },
      ]
    : [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">{t.dashboard.title}</h1>
      {data ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card) => (
            <Link key={card.label} href={card.href} className="rounded-xl bg-white border border-gray-200 p-8 shadow-sm hover:shadow-md transition-shadow">
              <span className={`material-symbols-rounded ${card.color} mb-4 block`} style={{ fontSize: 56 }}>{card.icon}</span>
              <p className="text-4xl font-bold text-gray-900">{card.value}</p>
              <p className="text-base text-gray-500 mt-2">{card.label}</p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-xl bg-white border border-gray-200 p-8 shadow-sm animate-pulse">
              <div className="w-14 h-14 bg-gray-200 rounded mb-4" />
              <div className="h-10 bg-gray-200 rounded w-16 mb-3" />
              <div className="h-5 bg-gray-100 rounded w-28" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
