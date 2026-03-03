import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AdminNewsletterPage() {
  const newsletters = await prisma.newsletter.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Newsletter</h1>
        <Link href="/admin/newsletter/new" className="rounded bg-[#4577ac] px-4 py-2 text-sm text-white hover:bg-[#2d5a8a] transition-colors">
          + Neuer Newsletter
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Betreff (DE)</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Gesendet</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Empfänger</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Aktionen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {newsletters.map((n) => (
              <tr key={n.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{n.subjectDe}</td>
                <td className="px-4 py-3">
                  <span className={`rounded px-2 py-0.5 text-xs font-medium ${n.status === "SENT" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                    {n.status === "SENT" ? "Gesendet" : "Entwurf"}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{n.sentAt?.toLocaleDateString("de-DE") ?? "—"}</td>
                <td className="px-4 py-3 text-gray-600">{n.recipientCount ?? "—"}</td>
                <td className="px-4 py-3">
                  {n.status === "DRAFT" && (
                    <Link href={`/admin/newsletter/${n.id}`} className="text-[#4577ac] hover:underline">Bearbeiten</Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {newsletters.length === 0 && (
          <p className="text-center text-gray-400 py-8">Noch keine Newsletter vorhanden.</p>
        )}
      </div>
    </div>
  );
}
