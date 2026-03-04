import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function PagePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const isDE = locale === "de";

  const page = await prisma.page.findUnique({ where: { slug } });
  if (!page || page.status !== "PUBLISHED") notFound();

  const title = isDE ? page.titleDe : page.titleEn;
  const body = isDE ? page.bodyDe : page.bodyEn;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 pt-20">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{title}</h1>
      <div
        className="prose prose-sm max-w-none text-gray-700"
        dangerouslySetInnerHTML={{ __html: body }}
      />
    </div>
  );
}
