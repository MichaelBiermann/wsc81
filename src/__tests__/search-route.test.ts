import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/search", () => ({
  search: vi.fn(),
}));

import { GET } from "@/app/api/search/route";
import { search } from "@/lib/search";
import type { NextRequest } from "next/server";
import type { SearchResult } from "@/lib/search";

const mockSearch = search as ReturnType<typeof vi.fn>;

beforeEach(() => vi.clearAllMocks());

function makeRequest(params: Record<string, string>): NextRequest {
  const url = new URL("http://localhost/api/search");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return new Request(url.toString()) as unknown as NextRequest;
}

const mockResult: SearchResult = {
  type: "event",
  id: "evt-1",
  title: "Skiausfahrt",
  excerpt: "Eine tolle Skiausfahrt...",
  slug: null,
  rank: 0.8,
};

describe("GET /api/search — validation", () => {
  it("returns empty results when q is missing", async () => {
    const res = await GET(makeRequest({}));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.results).toEqual([]);
    expect(mockSearch).not.toHaveBeenCalled();
  });

  it("returns empty results when q is only 1 character", async () => {
    const res = await GET(makeRequest({ q: "a" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.results).toEqual([]);
    expect(mockSearch).not.toHaveBeenCalled();
  });

  it("returns empty results when q exceeds 200 characters", async () => {
    const res = await GET(makeRequest({ q: "a".repeat(201) }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.results).toEqual([]);
    expect(mockSearch).not.toHaveBeenCalled();
  });

  it("accepts q of exactly 2 characters", async () => {
    mockSearch.mockResolvedValue([]);
    const res = await GET(makeRequest({ q: "ab" }));
    expect(res.status).toBe(200);
    expect(mockSearch).toHaveBeenCalledWith("ab", expect.any(String));
  });

  it("accepts q of exactly 200 characters", async () => {
    mockSearch.mockResolvedValue([]);
    const res = await GET(makeRequest({ q: "a".repeat(200) }));
    expect(res.status).toBe(200);
    expect(mockSearch).toHaveBeenCalled();
  });
});

describe("GET /api/search — locale", () => {
  it("defaults to 'de' locale when not provided", async () => {
    mockSearch.mockResolvedValue([]);
    await GET(makeRequest({ q: "ski" }));
    expect(mockSearch).toHaveBeenCalledWith("ski", "de");
  });

  it("passes 'en' locale when provided", async () => {
    mockSearch.mockResolvedValue([]);
    await GET(makeRequest({ q: "ski", locale: "en" }));
    expect(mockSearch).toHaveBeenCalledWith("ski", "en");
  });

  it("passes 'de' locale explicitly", async () => {
    mockSearch.mockResolvedValue([]);
    await GET(makeRequest({ q: "ski", locale: "de" }));
    expect(mockSearch).toHaveBeenCalledWith("ski", "de");
  });
});

describe("GET /api/search — results", () => {
  it("returns search results from search()", async () => {
    mockSearch.mockResolvedValue([mockResult]);
    const res = await GET(makeRequest({ q: "ski" }));
    const data = await res.json();
    expect(data.results).toHaveLength(1);
    expect(data.results[0].id).toBe("evt-1");
    expect(data.results[0].type).toBe("event");
  });

  it("returns empty results when search finds nothing", async () => {
    mockSearch.mockResolvedValue([]);
    const res = await GET(makeRequest({ q: "xyz" }));
    const data = await res.json();
    expect(data.results).toEqual([]);
  });

  it("trims whitespace from q before searching", async () => {
    mockSearch.mockResolvedValue([]);
    await GET(makeRequest({ q: "  ski  " }));
    expect(mockSearch).toHaveBeenCalledWith("ski", "de");
  });

  it("returns multiple result types", async () => {
    mockSearch.mockResolvedValue([
      { ...mockResult, type: "event" },
      { ...mockResult, type: "news", id: "n1", slug: "news-slug" },
      { ...mockResult, type: "recap", id: "r1", slug: "recap-slug" },
    ]);
    const res = await GET(makeRequest({ q: "ski" }));
    const data = await res.json();
    expect(data.results).toHaveLength(3);
    expect(data.results.map((r: SearchResult) => r.type)).toEqual(["event", "news", "recap"]);
  });
});
