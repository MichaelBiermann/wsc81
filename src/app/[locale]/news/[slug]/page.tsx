import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function NewsPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const isDE = locale === "de";

  const post = await prisma.newsPost.findUnique({ where: { slug } });
  if (!post || post.status !== "PUBLISHED") notFound();

  const title = isDE ? post.titleDe : post.titleEn;
  const body = isDE ? post.bodyDe : post.bodyEn;

  const fmt = (d: Date) =>
    d.toLocaleDateString(isDE ? "de-DE" : "en-GB", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 pt-20">
      {post.publishedAt && (
        <p className="text-sm text-[#4577ac] font-medium mb-2 flex items-center gap-1">
          <span className="material-symbols-rounded" style={{ fontSize: "16px" }}>calendar_month</span>
          {fmt(post.publishedAt)}
        </p>
      )}
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{title}</h1>
      <div
        className="prose prose-sm max-w-none text-gray-700"
        dangerouslySetInnerHTML={{ __html: body }}
      />
    </div>
  );
}
