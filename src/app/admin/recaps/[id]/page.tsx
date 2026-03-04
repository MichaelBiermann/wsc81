import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import RecapForm from "../RecapForm";

export default async function EditRecapPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const recap = await prisma.recap.findUnique({ where: { id } });
  if (!recap) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{recap.titleDe}</h1>
      <RecapForm
        recapId={id}
        initial={{
          slug: recap.slug,
          titleDe: recap.titleDe,
          titleEn: recap.titleEn,
          bodyDe: recap.bodyDe,
          bodyEn: recap.bodyEn,
          eventDate: recap.eventDate ? recap.eventDate.toISOString().split("T")[0] : "",
          imageUrl: recap.imageUrl ?? "",
          status: recap.status,
        }}
      />
    </div>
  );
}
