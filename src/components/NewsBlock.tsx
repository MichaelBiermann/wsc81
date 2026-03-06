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
      <h2 className="text-xl font-bold text-[#4577ac] mb-3">
        {isDE ? "Neuigkeiten" : "News"}
      </h2>
      <div className="grid gap-3 md:grid-cols-2">
        {posts.map((post, idx) => {
          const title = isDE ? post.titleDe : post.titleEn;
          const body = isDE ? post.bodyDe : post.bodyEn;
          const dateStr = post.publishedAt?.toLocaleDateString(isDE ? "de-DE" : "en-GB") ?? "";

          return (
            <Link key={post.id} href={`/${locale}/news/${post.slug}`} className={`block rounded-lg bg-white p-4 shadow-sm hover:shadow-md transition-shadow${idx >= 2 ? " hidden md:block" : ""}`}>
              <p className="text-xs text-gray-400 mb-1">{dateStr}</p>
              <h3 className="font-semibold text-gray-900 mb-1 text-sm">{title}</h3>
              <p className="text-sm text-gray-600 line-clamp-2">
                {body.replace(/<[^>]+>/g, "").slice(0, 150)}…
              </p>
            </Link>
          );
        })}
      </div>
    </>
  );
}
