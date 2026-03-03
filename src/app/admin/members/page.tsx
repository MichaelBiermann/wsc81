import { prisma } from "@/lib/prisma";
import Link from "next/link";

const CATEGORY_LABELS: Record<string, string> = {
  FAMILIE: "Familie", ERWACHSENE: "Erwachsene", JUGENDLICHE: "Jugendliche",
  SENIOREN: "Senioren", GDB: "GdB ab 50%",
};

export default async function AdminMembersPage() {
  const members = await prisma.member.findMany({
    orderBy: { activatedAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mitglieder</h1>
        <Link href="/admin/members/pending" className="text-sm text-[#4577ac] hover:underline">
          Ausstehende Anmeldungen →
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-500">#</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Name</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">E-Mail</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Kategorie</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Beitrag</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Aktiviert</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {members.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Keine Mitglieder vorhanden.</td></tr>
            ) : members.map((m) => (
              <tr key={m.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-500">{m.memberNumber}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{m.person1Name}</td>
                <td className="px-4 py-3 text-gray-600">{m.email}</td>
                <td className="px-4 py-3">{CATEGORY_LABELS[m.category] ?? m.category}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${m.feesPaid ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {m.feesPaid ? "Bezahlt" : "Ausstehend"}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {m.activatedAt.toLocaleDateString("de-DE")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
