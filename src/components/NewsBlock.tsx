import type { NewsPost } from "@prisma/client";
import Link from "next/link";

interface Props {
  posts: NewsPost[];
  locale: string;
}

export default function NewsBlock({ posts, locale }: Props) {
  const isDE = locale === "de";

  if (posts.length === 0) return null;

  return (
    <>
      <h2 className="text-2xl font-bold text-[#4577ac] mb-6">
        {isDE ? "Neuigkeiten" : "News"}
      </h2>
      <div className="grid gap-4 md:grid-cols-2">
        {posts.map((post) => {
          const title = isDE ? post.titleDe : post.titleEn;
          const body = isDE ? post.bodyDe : post.bodyEn;
          const dateStr = post.publishedAt?.toLocaleDateString(isDE ? "de-DE" : "en-GB") ?? "";

          return (
            <Link key={post.id} href={`/${locale}/news/${post.slug}`} className="block rounded-lg bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
              <p className="text-xs text-gray-400 mb-1">{dateStr}</p>
              <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
              <p className="text-sm text-gray-600 line-clamp-3">
                {body.replace(/<[^>]+>/g, "").slice(0, 150)}…
              </p>
            </Link>
          );
        })}
      </div>
    </>
  );
}
