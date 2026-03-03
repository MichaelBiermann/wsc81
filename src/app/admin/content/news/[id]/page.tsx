import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ContentForm from "../../ContentForm";

export default async function EditNewsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await prisma.newsPost.findUnique({ where: { id } });
  if (!post) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Neuigkeit bearbeiten</h1>
      <ContentForm
        type="news"
        contentId={id}
        initial={{
          slug: post.slug,
          titleDe: post.titleDe,
          titleEn: post.titleEn,
          bodyDe: post.bodyDe,
          bodyEn: post.bodyEn,
          status: post.status,
        }}
      />
    </div>
  );
}
