import { prisma } from "./prisma";

export interface SearchResult {
  type: "event" | "news" | "recap" | "page";
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
  const bodyField2 = isDE ? "bodyDe" : "bodyEn";

  // Use raw query for full-text search across events, news, recaps and pages
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
      LEFT(regexp_replace("${bodyField2}", '<[^>]+>', '', 'g'), 200) AS excerpt,
      slug,
      ts_rank(
        to_tsvector($2, "${titleField}" || ' ' || "${bodyField2}"),
        plainto_tsquery($2, $1)
      ) AS rank
    FROM "NewsPost"
    WHERE
      status = 'PUBLISHED'
      AND to_tsvector($2, "${titleField}" || ' ' || "${bodyField2}") @@ plainto_tsquery($2, $1)

    UNION ALL

    SELECT
      'recap' AS type,
      id,
      "${titleField}" AS title,
      LEFT(regexp_replace("${bodyField2}", '<[^>]+>', '', 'g'), 200) AS excerpt,
      slug,
      ts_rank(
        to_tsvector($2, "${titleField}" || ' ' || "${bodyField2}"),
        plainto_tsquery($2, $1)
      ) AS rank
    FROM "Recap"
    WHERE
      status = 'PUBLISHED'
      AND to_tsvector($2, "${titleField}" || ' ' || "${bodyField2}") @@ plainto_tsquery($2, $1)

    UNION ALL

    SELECT
      'page' AS type,
      id,
      "${titleField}" AS title,
      LEFT(regexp_replace("${bodyField2}", '<[^>]+>', '', 'g'), 200) AS excerpt,
      slug,
      ts_rank(
        to_tsvector($2, "${titleField}" || ' ' || "${bodyField2}"),
        plainto_tsquery($2, $1)
      ) AS rank
    FROM "Page"
    WHERE
      status = 'PUBLISHED'
      AND to_tsvector($2, "${titleField}" || ' ' || "${bodyField2}") @@ plainto_tsquery($2, $1)

    ORDER BY rank DESC
    LIMIT 20
    `,
    q,
    dict
  );

  return results.map((r) => ({
    type: r.type as "event" | "news" | "recap" | "page",
    id: r.id,
    title: r.title,
    excerpt: r.excerpt,
    slug: r.slug,
    rank: Number(r.rank),
  }));
}
