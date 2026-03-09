"use client";

import Link from "next/link";
import { useAdminI18n } from "@/components/admin/AdminI18nProvider";

export default function AdminSidebar({ userName }: { userName?: string | null }) {
  const { t, locale, setLocale } = useAdminI18n();

  return (
    <aside className="w-56 bg-[#1a2a3a] text-white flex flex-col">
      <div className="px-4 py-5 border-b border-white/10">
        <p className="font-bold text-sm">{t.sidebarTitle}</p>
        <p className="text-xs text-gray-400 mt-0.5">{userName}</p>
      </div>
      <nav className="flex-1 p-4 flex flex-col gap-1 text-sm">
        <Link href="/admin" className="rounded px-3 py-2 hover:bg-white/10 transition-colors">{t.nav.dashboard}</Link>
        <Link href="/admin/events" className="rounded px-3 py-2 hover:bg-white/10 transition-colors">{t.nav.events}</Link>
        <Link href="/admin/members" className="rounded px-3 py-2 hover:bg-white/10 transition-colors">{t.nav.members}</Link>
        <Link href="/admin/users" className="rounded px-3 py-2 hover:bg-white/10 transition-colors">{t.nav.userAccounts}</Link>
        <Link href="/admin/sponsors" className="rounded px-3 py-2 hover:bg-white/10 transition-colors">{t.nav.sponsors}</Link>
        <Link href="/admin/newsletter" className="rounded px-3 py-2 hover:bg-white/10 transition-colors">{t.nav.newsletter}</Link>
        <Link href="/admin/content" className="rounded px-3 py-2 hover:bg-white/10 transition-colors">{t.nav.content}</Link>
        <Link href="/admin/recaps" className="rounded px-3 py-2 hover:bg-white/10 transition-colors">{t.nav.recaps}</Link>
        <Link href="/admin/settings" className="rounded px-3 py-2 hover:bg-white/10 transition-colors">{t.nav.settings}</Link>
        <div className="border-t border-white/10 my-1" />
        <Link href="/admin/developer" className="rounded px-3 py-2 hover:bg-white/10 transition-colors flex items-center gap-1.5">
          <span className="material-symbols-rounded" style={{ fontSize: 16 }} aria-hidden="true">code</span>
          {t.nav.developer}
        </Link>
        <Link href="/admin/audit" className="rounded px-3 py-2 hover:bg-white/10 transition-colors flex items-center gap-1.5">
          <span className="material-symbols-rounded" style={{ fontSize: 16 }} aria-hidden="true">verified_user</span>
          {t.nav.audit}
        </Link>
        <Link href="/admin/support" className="rounded px-3 py-2 hover:bg-white/10 transition-colors flex items-center gap-1.5">
          <span className="material-symbols-rounded" style={{ fontSize: 16 }} aria-hidden="true">support_agent</span>
          {t.nav.support}
        </Link>
      </nav>
      <div className="p-4 border-t border-white/10 flex flex-col gap-2">
        {/* Language toggle */}
        <div className="flex gap-1">
          <button
            onClick={() => setLocale("de")}
            className={`flex-1 rounded py-1 text-xs transition-colors ${locale === "de" ? "bg-white/20 text-white font-semibold" : "text-gray-400 hover:text-white"}`}
          >
            DE
          </button>
          <button
            onClick={() => setLocale("en")}
            className={`flex-1 rounded py-1 text-xs transition-colors ${locale === "en" ? "bg-white/20 text-white font-semibold" : "text-gray-400 hover:text-white"}`}
          >
            EN
          </button>
        </div>
        <form action="/api/auth/signout" method="POST">
          <button type="submit" className="text-xs text-gray-400 hover:text-white transition-colors">{t.signOut}</button>
        </form>
      </div>
    </aside>
  );
}
