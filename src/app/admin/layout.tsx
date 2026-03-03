import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const user = session?.user as { role?: string; name?: string | null } | undefined;

  if (!session || user?.role !== "admin") {
    redirect("/admin/login");
  }

  return (
    <div className="flex min-h-screen">
          {/* Sidebar */}
          <aside className="w-56 bg-[#1a2a3a] text-white flex flex-col">
            <div className="px-4 py-5 border-b border-white/10">
              <p className="font-bold text-sm">WSC 81 Admin</p>
              <p className="text-xs text-gray-400 mt-0.5">{user?.name}</p>
            </div>
            <nav className="flex-1 p-4 flex flex-col gap-1 text-sm">
              <Link href="/admin" className="rounded px-3 py-2 hover:bg-white/10 transition-colors">Dashboard</Link>
              <Link href="/admin/events" className="rounded px-3 py-2 hover:bg-white/10 transition-colors">Veranstaltungen</Link>
              <Link href="/admin/members" className="rounded px-3 py-2 hover:bg-white/10 transition-colors">Mitglieder</Link>
              <Link href="/admin/sponsors" className="rounded px-3 py-2 hover:bg-white/10 transition-colors">Sponsoren</Link>
              <Link href="/admin/newsletter" className="rounded px-3 py-2 hover:bg-white/10 transition-colors">Newsletter</Link>
              <Link href="/admin/content" className="rounded px-3 py-2 hover:bg-white/10 transition-colors">Inhalte</Link>
              <Link href="/admin/settings" className="rounded px-3 py-2 hover:bg-white/10 transition-colors">Einstellungen</Link>
            </nav>
            <div className="p-4 border-t border-white/10">
              <form action="/api/auth/signout" method="POST">
                <button type="submit" className="text-xs text-gray-400 hover:text-white transition-colors">Abmelden</button>
              </form>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 bg-gray-50 p-8 overflow-auto">{children}</main>
        </div>
  );
}
