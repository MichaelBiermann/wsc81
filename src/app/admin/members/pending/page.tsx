import { prisma } from "@/lib/prisma";
import Link from "next/link";
import DeleteButton from "./DeleteButton";

const CATEGORY_LABELS: Record<string, string> = {
  FAMILIE: "Familie", ERWACHSENE: "Erwachsene", JUGENDLICHE: "Jugendliche",
  SENIOREN: "Senioren", GDB: "GdB ab 50%",
};

export default async function AdminPendingMembersPage() {
  const pending = await prisma.pendingMembership.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Ausstehende Anmeldungen</h1>
        <Link href="/admin/members" className="text-sm text-[#4577ac] hover:underline">
          ← Alle Mitglieder
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Name</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">E-Mail</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Kategorie</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Eingereicht</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Link läuft ab</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {pending.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Keine ausstehenden Anmeldungen.</td></tr>
            ) : pending.map((p) => {
              const expired = p.tokenExpiresAt < new Date();
              return (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{p.person1Name}</td>
                  <td className="px-4 py-3 text-gray-600">{p.email}</td>
                  <td className="px-4 py-3">{CATEGORY_LABELS[p.category] ?? p.category}</td>
                  <td className="px-4 py-3 text-gray-500">{p.createdAt.toLocaleDateString("de-DE")}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${expired ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                      {expired ? "Abgelaufen" : p.tokenExpiresAt.toLocaleDateString("de-DE")}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <DeleteButton id={p.id} />
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
