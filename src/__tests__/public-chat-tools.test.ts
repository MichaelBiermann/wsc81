import { describe, it, expect, vi, beforeEach } from "vitest";
import { executePublicTool } from "@/lib/public-chat-tools";

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    event: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    newsPost: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    recap: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    page: {
      findFirst: vi.fn(),
    },
    sponsor: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";

const mockPrisma = prisma as {
  event: { findMany: ReturnType<typeof vi.fn>; findUnique: ReturnType<typeof vi.fn> };
  newsPost: { findMany: ReturnType<typeof vi.fn>; findFirst: ReturnType<typeof vi.fn> };
  recap: { findMany: ReturnType<typeof vi.fn>; findFirst: ReturnType<typeof vi.fn> };
  page: { findFirst: ReturnType<typeof vi.fn> };
  sponsor: { findMany: ReturnType<typeof vi.fn> };
};

beforeEach(() => vi.clearAllMocks());

// ─── list_upcoming_events ────────────────────────────────────────────────────

describe("list_upcoming_events", () => {
  const rawEvent = {
    id: "evt-1",
    titleDe: "Skiausfahrt",
    titleEn: "Ski Trip",
    startDate: new Date("2027-01-15T08:00:00Z"),
    endDate: new Date("2027-01-20T18:00:00Z"),
    location: "Lenggries",
    bookable: true,
    depositAmount: { toFixed: () => "40.00", valueOf: () => 40, toString: () => "40" } as unknown as number,
    maxParticipants: 30,
    registrationDeadline: new Date("2026-12-31T00:00:00Z"),
  };

  it("returns events in German by default", async () => {
    mockPrisma.event.findMany.mockResolvedValue([rawEvent]);
    const result = await executePublicTool("list_upcoming_events", {}, "de") as { title: string }[];
    expect(result[0].title).toBe("Skiausfahrt");
  });

  it("returns events in English when locale is en", async () => {
    mockPrisma.event.findMany.mockResolvedValue([rawEvent]);
    const result = await executePublicTool("list_upcoming_events", {}, "en") as { title: string }[];
    expect(result[0].title).toBe("Ski Trip");
  });

  it("maps dates to ISO strings", async () => {
    mockPrisma.event.findMany.mockResolvedValue([rawEvent]);
    const result = await executePublicTool("list_upcoming_events", {}, "de") as { startDate: string; endDate: string }[];
    expect(result[0].startDate).toBe("2027-01-15T08:00:00.000Z");
    expect(result[0].endDate).toBe("2027-01-20T18:00:00.000Z");
  });

  it("passes limit to prisma", async () => {
    mockPrisma.event.findMany.mockResolvedValue([]);
    await executePublicTool("list_upcoming_events", { limit: 3 }, "de");
    expect(mockPrisma.event.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 3 })
    );
  });

  it("returns empty array when no events", async () => {
    mockPrisma.event.findMany.mockResolvedValue([]);
    const result = await executePublicTool("list_upcoming_events", {}, "de");
    expect(result).toEqual([]);
  });
});

// ─── get_event ───────────────────────────────────────────────────────────────

describe("get_event", () => {
  const rawEvent = {
    id: "evt-1",
    titleDe: "Skiausfahrt",
    titleEn: "Ski Trip",
    descriptionDe: "<p>Beschreibung</p>",
    descriptionEn: "<p>Description</p>",
    location: "Lenggries",
    startDate: new Date("2027-01-15T08:00:00Z"),
    endDate: new Date("2027-01-20T18:00:00Z"),
    depositAmount: 40,
    maxParticipants: 30,
    registrationDeadline: null,
    bookable: true,
    surchargeNonMemberAdult: 20,
    busSurcharge: 15,
    roomSingleSurcharge: 60,
    roomDoubleSurcharge: 50,
  };

  it("returns event details in German", async () => {
    mockPrisma.event.findUnique.mockResolvedValue(rawEvent);
    const result = await executePublicTool("get_event", { id: "evt-1" }, "de") as Record<string, unknown>;
    expect(result.title).toBe("Skiausfahrt");
    expect(result.description).toBe("<p>Beschreibung</p>");
  });

  it("returns event details in English", async () => {
    mockPrisma.event.findUnique.mockResolvedValue(rawEvent);
    const result = await executePublicTool("get_event", { id: "evt-1" }, "en") as Record<string, unknown>;
    expect(result.title).toBe("Ski Trip");
    expect(result.description).toBe("<p>Description</p>");
  });

  it("throws when event not found", async () => {
    mockPrisma.event.findUnique.mockResolvedValue(null);
    await expect(executePublicTool("get_event", { id: "missing" }, "de")).rejects.toThrow("Event not found: missing");
  });

  it("returns null registrationDeadline when not set", async () => {
    mockPrisma.event.findUnique.mockResolvedValue(rawEvent);
    const result = await executePublicTool("get_event", { id: "evt-1" }, "de") as Record<string, unknown>;
    expect(result.registrationDeadline).toBeNull();
  });
});

// ─── list_news ───────────────────────────────────────────────────────────────

describe("list_news", () => {
  const rawPost = {
    id: "news-1",
    slug: "willkommen",
    titleDe: "Willkommen",
    titleEn: "Welcome",
    publishedAt: new Date("2026-01-01T10:00:00Z"),
  };

  it("returns news titles in German", async () => {
    mockPrisma.newsPost.findMany.mockResolvedValue([rawPost]);
    const result = await executePublicTool("list_news", {}, "de") as { title: string }[];
    expect(result[0].title).toBe("Willkommen");
  });

  it("returns news titles in English", async () => {
    mockPrisma.newsPost.findMany.mockResolvedValue([rawPost]);
    const result = await executePublicTool("list_news", {}, "en") as { title: string }[];
    expect(result[0].title).toBe("Welcome");
  });

  it("filters by PUBLISHED status", async () => {
    mockPrisma.newsPost.findMany.mockResolvedValue([]);
    await executePublicTool("list_news", {}, "de");
    expect(mockPrisma.newsPost.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: "PUBLISHED" } })
    );
  });
});

// ─── get_news ────────────────────────────────────────────────────────────────

describe("get_news", () => {
  const rawPost = {
    id: "news-1",
    slug: "willkommen",
    titleDe: "Willkommen",
    titleEn: "Welcome",
    bodyDe: "<p>Hallo</p>",
    bodyEn: "<p>Hello</p>",
    publishedAt: new Date("2026-01-01T10:00:00Z"),
  };

  it("fetches by slug and returns German content", async () => {
    mockPrisma.newsPost.findFirst.mockResolvedValue(rawPost);
    const result = await executePublicTool("get_news", { slug: "willkommen" }, "de") as Record<string, unknown>;
    expect(result.body).toBe("<p>Hallo</p>");
    expect(mockPrisma.newsPost.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ slug: "willkommen" }) })
    );
  });

  it("fetches by id when no slug given", async () => {
    mockPrisma.newsPost.findFirst.mockResolvedValue(rawPost);
    await executePublicTool("get_news", { id: "news-1" }, "de");
    expect(mockPrisma.newsPost.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ id: "news-1" }) })
    );
  });

  it("returns English body when locale is en", async () => {
    mockPrisma.newsPost.findFirst.mockResolvedValue(rawPost);
    const result = await executePublicTool("get_news", { slug: "willkommen" }, "en") as Record<string, unknown>;
    expect(result.body).toBe("<p>Hello</p>");
  });

  it("throws when not found", async () => {
    mockPrisma.newsPost.findFirst.mockResolvedValue(null);
    await expect(executePublicTool("get_news", { slug: "missing" }, "de")).rejects.toThrow("News article not found");
  });
});

// ─── list_recaps ─────────────────────────────────────────────────────────────

describe("list_recaps", () => {
  const rawRecap = {
    id: "recap-1",
    slug: "auf-nach-lenggries",
    titleDe: "Auf nach Lenggries",
    titleEn: "Off to Lenggries",
    eventDate: new Date("2024-02-10T00:00:00Z"),
  };

  it("returns recap titles in German", async () => {
    mockPrisma.recap.findMany.mockResolvedValue([rawRecap]);
    const result = await executePublicTool("list_recaps", {}, "de") as { title: string }[];
    expect(result[0].title).toBe("Auf nach Lenggries");
  });

  it("returns recap titles in English", async () => {
    mockPrisma.recap.findMany.mockResolvedValue([rawRecap]);
    const result = await executePublicTool("list_recaps", {}, "en") as { title: string }[];
    expect(result[0].title).toBe("Off to Lenggries");
  });

  it("maps eventDate to ISO string", async () => {
    mockPrisma.recap.findMany.mockResolvedValue([rawRecap]);
    const result = await executePublicTool("list_recaps", {}, "de") as { eventDate: string }[];
    expect(result[0].eventDate).toBe("2024-02-10T00:00:00.000Z");
  });

  it("returns null for missing eventDate", async () => {
    mockPrisma.recap.findMany.mockResolvedValue([{ ...rawRecap, eventDate: null }]);
    const result = await executePublicTool("list_recaps", {}, "de") as { eventDate: string | null }[];
    expect(result[0].eventDate).toBeNull();
  });
});

// ─── get_recap ───────────────────────────────────────────────────────────────

describe("get_recap", () => {
  const rawRecap = {
    id: "recap-1",
    slug: "auf-nach-lenggries",
    titleDe: "Auf nach Lenggries",
    titleEn: "Off to Lenggries",
    bodyDe: "<p>Schöne Tour</p>",
    bodyEn: "<p>Great tour</p>",
    eventDate: new Date("2024-02-10T00:00:00Z"),
    imageUrl: null,
  };

  it("fetches by slug", async () => {
    mockPrisma.recap.findFirst.mockResolvedValue(rawRecap);
    const result = await executePublicTool("get_recap", { slug: "auf-nach-lenggries" }, "de") as Record<string, unknown>;
    expect(result.body).toBe("<p>Schöne Tour</p>");
  });

  it("fetches by id when no slug given", async () => {
    mockPrisma.recap.findFirst.mockResolvedValue(rawRecap);
    await executePublicTool("get_recap", { id: "recap-1" }, "de");
    expect(mockPrisma.recap.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ id: "recap-1" }) })
    );
  });

  it("throws when not found", async () => {
    mockPrisma.recap.findFirst.mockResolvedValue(null);
    await expect(executePublicTool("get_recap", { slug: "missing" }, "de")).rejects.toThrow("Recap not found");
  });
});

// ─── get_page ────────────────────────────────────────────────────────────────

describe("get_page", () => {
  const rawPage = {
    id: "page-1",
    slug: "satzung",
    titleDe: "Satzung",
    titleEn: "Statutes",
    bodyDe: "<p>Inhalt</p>",
    bodyEn: "<p>Content</p>",
  };

  it("returns page in German", async () => {
    mockPrisma.page.findFirst.mockResolvedValue(rawPage);
    const result = await executePublicTool("get_page", { slug: "satzung" }, "de") as Record<string, unknown>;
    expect(result.title).toBe("Satzung");
    expect(result.body).toBe("<p>Inhalt</p>");
  });

  it("returns page in English", async () => {
    mockPrisma.page.findFirst.mockResolvedValue(rawPage);
    const result = await executePublicTool("get_page", { slug: "satzung" }, "en") as Record<string, unknown>;
    expect(result.title).toBe("Statutes");
    expect(result.body).toBe("<p>Content</p>");
  });

  it("throws when page not found", async () => {
    mockPrisma.page.findFirst.mockResolvedValue(null);
    await expect(executePublicTool("get_page", { slug: "missing" }, "de")).rejects.toThrow("Page not found: missing");
  });

  it("filters by PUBLISHED status", async () => {
    mockPrisma.page.findFirst.mockResolvedValue(rawPage);
    await executePublicTool("get_page", { slug: "satzung" }, "de");
    expect(mockPrisma.page.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ status: "PUBLISHED" }) })
    );
  });
});

// ─── list_sponsors ────────────────────────────────────────────────────────────

describe("list_sponsors", () => {
  it("returns sponsors ordered by displayOrder", async () => {
    const sponsors = [{ id: "s1", name: "Sponsor A", websiteUrl: "https://a.de" }];
    mockPrisma.sponsor.findMany.mockResolvedValue(sponsors);
    const result = await executePublicTool("list_sponsors", {}, "de");
    expect(result).toEqual(sponsors);
    expect(mockPrisma.sponsor.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { displayOrder: "asc" } })
    );
  });
});

// ─── navigate ────────────────────────────────────────────────────────────────

describe("navigate", () => {
  it("returns navigateTo and label", async () => {
    const result = await executePublicTool("navigate", { path: "/de/membership", label: "Mitglied werden" }, "de");
    expect(result).toEqual({ navigateTo: "/de/membership", label: "Mitglied werden" });
  });
});

// ─── unknown tool ─────────────────────────────────────────────────────────────

describe("unknown tool", () => {
  it("throws for unknown tool name", async () => {
    await expect(executePublicTool("nonexistent", {}, "de")).rejects.toThrow("Unknown tool: nonexistent");
  });
});
