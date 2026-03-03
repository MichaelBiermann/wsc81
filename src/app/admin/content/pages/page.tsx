import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AdminContentPagesPage() {
  const pages = await prisma.page.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inhalte</h1>
          <div className="flex gap-4 mt-2 text-sm">
            <Link href="/admin/content/news" className="text-gray-500 hover:text-gray-800 transition-colors pb-0.5">Neuigkeiten</Link>
            <span className="font-semibold text-[#4577ac] border-b-2 border-[#4577ac] pb-0.5">Seiten</span>
          </div>
        </div>
        <Link
          href="/admin/content/pages/new"
          className="rounded bg-[#4577ac] px-4 py-2 text-sm text-white hover:bg-[#2d5a8a] transition-colors"
        >
          + Neue Seite
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Titel (DE)</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Slug</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Erstellt</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Aktionen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {pages.map((page) => (
              <tr key={page.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{page.titleDe}</td>
                <td className="px-4 py-3 text-gray-500 font-mono text-xs">{page.slug}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-medium ${
                      page.status === "PUBLISHED"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {page.status === "PUBLISHED" ? "Veröffentlicht" : "Entwurf"}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {page.createdAt.toLocaleDateString("de-DE")}
                </td>
                <td className="px-4 py-3 flex gap-3">
                  <Link href={`/admin/content/pages/${page.id}`} className="text-[#4577ac] hover:underline">
                    Bearbeiten
                  </Link>
                  <DeleteButton id={page.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {pages.length === 0 && (
          <p className="text-center text-gray-400 py-8">Noch keine Seiten vorhanden.</p>
        )}
      </div>
    </div>
  );
}

function DeleteButton({ id }: { id: string }) {
  return (
    <form
      action={async () => {
        "use server";
        const { prisma: db } = await import("@/lib/prisma");
        const { revalidatePath } = await import("next/cache");
        await db.page.delete({ where: { id } });
        revalidatePath("/admin/content/pages");
      }}
    >
      <button
        type="submit"
        className="text-red-500 hover:underline text-sm"
        onClick={(e) => {
          if (!confirm("Seite wirklich löschen?")) e.preventDefault();
        }}
      >
        Löschen
      </button>
    </form>
  );
}
