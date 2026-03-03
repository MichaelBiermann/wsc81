import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ContentForm from "../../ContentForm";

export default async function EditPagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const page = await prisma.page.findUnique({ where: { id } });
  if (!page) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Seite bearbeiten</h1>
      <ContentForm
        type="pages"
        contentId={id}
        initial={{
          slug: page.slug,
          titleDe: page.titleDe,
          titleEn: page.titleEn,
          bodyDe: page.bodyDe,
          bodyEn: page.bodyEn,
          status: page.status,
        }}
      />
    </div>
  );
}
