import { prisma } from "./prisma";

export interface SearchResult {
  type: "event" | "news";
  id: string;
  title: string;
  excerpt: string;
  slug: string | null;
  rank: number;
}

export async function search(q: string, locale: string = "de"): Promise<SearchResult[]> {
  const isDE = locale === "de";
  const dict = isDE ? "german" : "english";
  const titleField = isDE ? "titleDe" : "titleEn";
  const bodyField = isDE ? "descriptionDe" : "descriptionEn";
  const newsBodyField = isDE ? "bodyDe" : "bodyEn";

  // Use raw query for full-text search across events and news
  const results = await prisma.$queryRawUnsafe<
    Array<{
      type: string;
      id: string;
      title: string;
      excerpt: string;
      slug: string | null;
      rank: number;
    }>
  >(
    `
    SELECT
      'event' AS type,
      id,
      "${titleField}" AS title,
      LEFT(regexp_replace("${bodyField}", '<[^>]+>', '', 'g'), 200) AS excerpt,
      NULL::text AS slug,
      ts_rank(
        to_tsvector($2, "${titleField}" || ' ' || "${bodyField}"),
        plainto_tsquery($2, $1)
      ) AS rank
    FROM "Event"
    WHERE to_tsvector($2, "${titleField}" || ' ' || "${bodyField}") @@ plainto_tsquery($2, $1)

    UNION ALL

    SELECT
      'news' AS type,
      id,
      "${titleField}" AS title,
      LEFT(regexp_replace("${newsBodyField}", '<[^>]+>', '', 'g'), 200) AS excerpt,
      slug,
      ts_rank(
        to_tsvector($2, "${titleField}" || ' ' || "${newsBodyField}"),
        plainto_tsquery($2, $1)
      ) AS rank
    FROM "NewsPost"
    WHERE
      status = 'PUBLISHED'
      AND to_tsvector($2, "${titleField}" || ' ' || "${newsBodyField}") @@ plainto_tsquery($2, $1)

    ORDER BY rank DESC
    LIMIT 20
    `,
    q,
    dict
  );

  return results.map((r) => ({
    type: r.type as "event" | "news",
    id: r.id,
    title: r.title,
    excerpt: r.excerpt,
    slug: r.slug,
    rank: Number(r.rank),
  }));
}
