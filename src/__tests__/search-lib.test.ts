import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $queryRawUnsafe: vi.fn(),
  },
}));

import { search } from "@/lib/search";
import { prisma } from "@/lib/prisma";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any;

beforeEach(() => vi.clearAllMocks());

const rawRow = (type: string, slug: string | null = null) => ({
  type,
  id: `${type}-1`,
  title: `${type} title`,
  excerpt: `${type} excerpt`,
  slug,
  rank: "0.75",
});

describe("search()", () => {
  it("returns mapped results with numeric rank", async () => {
    db.$queryRawUnsafe.mockResolvedValue([rawRow("event")]);
    const results = await search("ski", "de");
    expect(results).toHaveLength(1);
    expect(results[0].type).toBe("event");
    expect(typeof results[0].rank).toBe("number");
    expect(results[0].rank).toBe(0.75);
  });

  it("maps all result types correctly", async () => {
    db.$queryRawUnsafe.mockResolvedValue([
      rawRow("event"),
      rawRow("news", "news-slug"),
      rawRow("recap", "recap-slug"),
      rawRow("page", "page-slug"),
    ]);
    const results = await search("test", "de");
    expect(results.map((r) => r.type)).toEqual(["event", "news", "recap", "page"]);
  });

  it("passes query as first param to $queryRawUnsafe", async () => {
    db.$queryRawUnsafe.mockResolvedValue([]);
    await search("skiing", "de");
    const args = db.$queryRawUnsafe.mock.calls[0];
    expect(args[1]).toBe("skiing");
  });

  it("passes 'german' dict for de locale", async () => {
    db.$queryRawUnsafe.mockResolvedValue([]);
    await search("ski", "de");
    const args = db.$queryRawUnsafe.mock.calls[0];
    expect(args[2]).toBe("german");
  });

  it("passes 'english' dict for en locale", async () => {
    db.$queryRawUnsafe.mockResolvedValue([]);
    await search("ski", "en");
    const args = db.$queryRawUnsafe.mock.calls[0];
    expect(args[2]).toBe("english");
  });

  it("defaults to 'de' locale when not provided", async () => {
    db.$queryRawUnsafe.mockResolvedValue([]);
    await search("ski");
    const args = db.$queryRawUnsafe.mock.calls[0];
    expect(args[2]).toBe("german");
  });

  it("preserves slug (null for events)", async () => {
    db.$queryRawUnsafe.mockResolvedValue([rawRow("event", null)]);
    const results = await search("ski", "de");
    expect(results[0].slug).toBeNull();
  });

  it("preserves slug for news/recap/page", async () => {
    db.$queryRawUnsafe.mockResolvedValue([rawRow("news", "my-article")]);
    const results = await search("ski", "de");
    expect(results[0].slug).toBe("my-article");
  });

  it("returns empty array when no results", async () => {
    db.$queryRawUnsafe.mockResolvedValue([]);
    const results = await search("xyzzy", "de");
    expect(results).toEqual([]);
  });

  it("uses German title/body fields for de locale", async () => {
    db.$queryRawUnsafe.mockResolvedValue([]);
    await search("ski", "de");
    const sql = db.$queryRawUnsafe.mock.calls[0][0] as string;
    expect(sql).toContain("titleDe");
    expect(sql).toContain("descriptionDe");
  });

  it("uses English title/body fields for en locale", async () => {
    db.$queryRawUnsafe.mockResolvedValue([]);
    await search("ski", "en");
    const sql = db.$queryRawUnsafe.mock.calls[0][0] as string;
    expect(sql).toContain("titleEn");
    expect(sql).toContain("descriptionEn");
  });
});
