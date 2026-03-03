import { prisma } from "@/lib/prisma";

export default async function AdminDashboard() {
  const [eventsCount, membersCount, pendingCount, newslettersCount] = await Promise.all([
    prisma.event.count(),
    prisma.member.count(),
    prisma.pendingMembership.count(),
    prisma.newsletter.count({ where: { status: "DRAFT" } }),
  ]);

  const cards = [
    { label: "Veranstaltungen", value: eventsCount, href: "/admin/events", color: "bg-blue-500" },
    { label: "Mitglieder", value: membersCount, href: "/admin/members", color: "bg-green-500" },
    { label: "Ausstehende Anmeldungen", value: pendingCount, href: "/admin/members/pending", color: "bg-yellow-500" },
    { label: "Newsletter Entwürfe", value: newslettersCount, href: "/admin/newsletter", color: "bg-purple-500" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <a key={card.label} href={card.href} className="rounded-lg bg-white border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 ${card.color} rounded-lg mb-3`} />
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="text-sm text-gray-500 mt-1">{card.label}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
