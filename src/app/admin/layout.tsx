import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { AdminI18nProvider } from "@/components/admin/AdminI18nProvider";
import AdminSidebar from "@/components/admin/AdminSidebar";
import type { AdminLocale } from "@/lib/admin-i18n";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const user = session?.user as { role?: string; name?: string | null } | undefined;

  if (!session || user?.role !== "admin") {
    redirect("/admin/login");
  }

  const cookieStore = await cookies();
  const rawLocale = cookieStore.get("admin_locale")?.value;
  const initialLocale: AdminLocale = rawLocale === "en" ? "en" : "de";

  return (
    <AdminI18nProvider initialLocale={initialLocale}>
      <div className="flex min-h-screen">
        <AdminSidebar userName={user?.name} />
        <main className="flex-1 bg-gray-50 p-8 overflow-auto">{children}</main>
      </div>
    </AdminI18nProvider>
  );
}
