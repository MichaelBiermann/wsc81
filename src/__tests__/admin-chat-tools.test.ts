import { describe, it, expect, vi, beforeEach } from "vitest";
import { executeTool } from "@/lib/chat-tools";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    event: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    member: {
      findMany: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    pendingMembership: {
      findMany: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    user: {
      findMany: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    newsPost: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    page: {
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    recap: {
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    sponsor: {
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    newsletter: {
      findMany: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    clubSettings: {
      findFirst: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any;

beforeEach(() => vi.clearAllMocks());

// ─── list_events ──────────────────────────────────────────────────────────────

describe("list_events", () => {
  const rawEvent = {
    id: "evt-1", titleDe: "Ski", startDate: new Date("2027-01-10"), endDate: new Date("2027-01-15"),
    location: "Lenggries", bookable: true, _count: { bookings: 3 },
  };

  it("returns mapped events with bookingCount", async () => {
    db.event.findMany.mockResolvedValue([rawEvent]);
    const result = await executeTool("list_events", {}) as { bookingCount: number }[];
    expect(result[0].bookingCount).toBe(3);
  });

  it("passes upcoming_only filter", async () => {
    db.event.findMany.mockResolvedValue([]);
    await executeTool("list_events", { upcoming_only: true });
    expect(db.event.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ startDate: expect.anything() }) })
    );
  });

  it("passes no filter when upcoming_only is false", async () => {
    db.event.findMany.mockResolvedValue([]);
    await executeTool("list_events", { upcoming_only: false });
    expect(db.event.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} })
    );
  });

  it("maps startDate to ISO string", async () => {
    db.event.findMany.mockResolvedValue([rawEvent]);
    const result = await executeTool("list_events", {}) as { startDate: string }[];
    expect(result[0].startDate).toBe("2027-01-10T00:00:00.000Z");
  });

  it("uses default limit of 20", async () => {
    db.event.findMany.mockResolvedValue([]);
    await executeTool("list_events", {});
    expect(db.event.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 20 }));
  });
});

// ─── get_event ────────────────────────────────────────────────────────────────

describe("get_event", () => {
  it("throws when event not found", async () => {
    db.event.findUnique.mockResolvedValue(null);
    await expect(executeTool("get_event", { id: "missing" })).rejects.toThrow("Event not found: missing");
  });

  it("converts Decimal fields to Number", async () => {
    db.event.findUnique.mockResolvedValue({
      id: "evt-1", titleDe: "Ski", startDate: new Date(), endDate: new Date(),
      depositAmount: { valueOf: () => 40 }, totalAmount: { valueOf: () => 200 },
      surchargeNonMemberAdult: { valueOf: () => 20 }, surchargeNonMemberChild: { valueOf: () => 10 },
      busSurcharge: { valueOf: () => 15 }, roomSingleSurcharge: { valueOf: () => 60 },
      roomDoubleSurcharge: { valueOf: () => 50 }, bookings: [],
    });
    const result = await executeTool("get_event", { id: "evt-1" }) as Record<string, unknown>;
    expect(typeof result.depositAmount).toBe("number");
    expect(typeof result.surchargeNonMemberAdult).toBe("number");
  });
});

// ─── create_event ─────────────────────────────────────────────────────────────

describe("create_event", () => {
  it("defaults bookable to true when not provided", async () => {
    db.event.create.mockResolvedValue({ id: "new-1", titleDe: "Test", startDate: new Date("2027-03-01") });
    await executeTool("create_event", {
      titleDe: "Test", titleEn: "Test", descriptionDe: "", descriptionEn: "",
      location: "Ort", startDate: "2027-03-01", endDate: "2027-03-05",
      depositAmount: 40, totalAmount: 200,
    });
    expect(db.event.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ bookable: true }) })
    );
  });

  it("defaults surcharges to 0 when not provided", async () => {
    db.event.create.mockResolvedValue({ id: "new-1", titleDe: "Test", startDate: new Date() });
    await executeTool("create_event", {
      titleDe: "Test", titleEn: "Test", descriptionDe: "", descriptionEn: "",
      location: "Ort", startDate: "2027-03-01", endDate: "2027-03-05",
      depositAmount: 0, totalAmount: 0,
    });
    expect(db.event.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ busSurcharge: 0, roomSingleSurcharge: 0 }) })
    );
  });

  it("converts date strings to Date objects", async () => {
    db.event.create.mockResolvedValue({ id: "x", titleDe: "T", startDate: new Date() });
    await executeTool("create_event", {
      titleDe: "T", titleEn: "T", descriptionDe: "", descriptionEn: "",
      location: "L", startDate: "2027-03-01T00:00:00Z", endDate: "2027-03-05T00:00:00Z",
      depositAmount: 0, totalAmount: 0,
    });
    const call = db.event.create.mock.calls[0][0];
    expect(call.data.startDate).toBeInstanceOf(Date);
    expect(call.data.endDate).toBeInstanceOf(Date);
  });
});

// ─── update_event ─────────────────────────────────────────────────────────────

describe("update_event", () => {
  it("only sends provided fields", async () => {
    db.event.update.mockResolvedValue({ id: "evt-1", titleDe: "New Title" });
    await executeTool("update_event", { id: "evt-1", titleDe: "New Title" });
    const call = db.event.update.mock.calls[0][0];
    expect(call.data).toEqual({ titleDe: "New Title" });
  });

  it("converts startDate string to Date", async () => {
    db.event.update.mockResolvedValue({ id: "evt-1", titleDe: "T" });
    await executeTool("update_event", { id: "evt-1", startDate: "2027-06-01" });
    const call = db.event.update.mock.calls[0][0];
    expect(call.data.startDate).toBeInstanceOf(Date);
  });
});

// ─── delete_event ─────────────────────────────────────────────────────────────

describe("delete_event", () => {
  it("returns deleted: true", async () => {
    db.event.delete.mockResolvedValue({});
    const result = await executeTool("delete_event", { id: "evt-1" });
    expect(result).toEqual({ deleted: true });
  });
});

// ─── list_members ─────────────────────────────────────────────────────────────

describe("list_members", () => {
  const rawMember = { id: "m1", memberNumber: 1, person1Name: "Max", email: "max@example.com", category: "adult", feesPaid: true, activatedAt: new Date("2025-01-01") };

  it("maps activatedAt to ISO string", async () => {
    db.member.findMany.mockResolvedValue([rawMember]);
    const result = await executeTool("list_members", {}) as { activatedAt: string }[];
    expect(result[0].activatedAt).toBe("2025-01-01T00:00:00.000Z");
  });

  it("filters by feesPaid when fees_paid_only=true", async () => {
    db.member.findMany.mockResolvedValue([]);
    await executeTool("list_members", { fees_paid_only: true });
    expect(db.member.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { feesPaid: true } })
    );
  });

  it("no filter when fees_paid_only=false", async () => {
    db.member.findMany.mockResolvedValue([]);
    await executeTool("list_members", { fees_paid_only: false });
    expect(db.member.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} })
    );
  });

  it("uses default limit of 50", async () => {
    db.member.findMany.mockResolvedValue([]);
    await executeTool("list_members", {});
    expect(db.member.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 50 }));
  });
});

// ─── list_news_posts status filter ───────────────────────────────────────────

describe("list_news_posts", () => {
  it("filters by status when provided", async () => {
    db.newsPost.findMany.mockResolvedValue([]);
    await executeTool("list_news_posts", { status: "PUBLISHED" });
    expect(db.newsPost.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: "PUBLISHED" } })
    );
  });

  it("no filter when status is 'all'", async () => {
    db.newsPost.findMany.mockResolvedValue([]);
    await executeTool("list_news_posts", { status: "all" });
    expect(db.newsPost.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} })
    );
  });
});

// ─── create_news_post publishedAt ─────────────────────────────────────────────

describe("create_news_post", () => {
  it("sets publishedAt when status is PUBLISHED", async () => {
    db.newsPost.create.mockResolvedValue({ id: "n1", slug: "test", status: "PUBLISHED" });
    await executeTool("create_news_post", {
      slug: "test", titleDe: "T", titleEn: "T", bodyDe: "", bodyEn: "", status: "PUBLISHED",
    });
    const call = db.newsPost.create.mock.calls[0][0];
    expect(call.data.publishedAt).toBeInstanceOf(Date);
  });

  it("sets publishedAt to null when status is DRAFT", async () => {
    db.newsPost.create.mockResolvedValue({ id: "n1", slug: "test", status: "DRAFT" });
    await executeTool("create_news_post", {
      slug: "test", titleDe: "T", titleEn: "T", bodyDe: "", bodyEn: "", status: "DRAFT",
    });
    const call = db.newsPost.create.mock.calls[0][0];
    expect(call.data.publishedAt).toBeNull();
  });
});

// ─── update_news_post publishedAt logic ───────────────────────────────────────

describe("update_news_post", () => {
  it("sets publishedAt on first publish", async () => {
    db.newsPost.findUnique.mockResolvedValue({ id: "n1", publishedAt: null });
    db.newsPost.update.mockResolvedValue({});
    await executeTool("update_news_post", { id: "n1", status: "PUBLISHED" });
    const call = db.newsPost.update.mock.calls[0][0];
    expect(call.data.publishedAt).toBeInstanceOf(Date);
  });

  it("preserves publishedAt on republish", async () => {
    const existingDate = new Date("2025-06-01");
    db.newsPost.findUnique.mockResolvedValue({ id: "n1", publishedAt: existingDate });
    db.newsPost.update.mockResolvedValue({});
    await executeTool("update_news_post", { id: "n1", status: "PUBLISHED" });
    const call = db.newsPost.update.mock.calls[0][0];
    expect(call.data.publishedAt).toBeUndefined();
  });

  it("clears publishedAt when set back to DRAFT", async () => {
    db.newsPost.findUnique.mockResolvedValue({ id: "n1", publishedAt: new Date() });
    db.newsPost.update.mockResolvedValue({});
    await executeTool("update_news_post", { id: "n1", status: "DRAFT" });
    const call = db.newsPost.update.mock.calls[0][0];
    expect(call.data.publishedAt).toBeNull();
  });

  it("throws when news post not found", async () => {
    db.newsPost.findUnique.mockResolvedValue(null);
    await expect(executeTool("update_news_post", { id: "missing", status: "PUBLISHED" }))
      .rejects.toThrow("News post not found: missing");
  });
});

// ─── get_club_settings ────────────────────────────────────────────────────────

describe("get_club_settings", () => {
  it("returns masked IBAN with last 4 digits", async () => {
    db.clubSettings.findFirst.mockResolvedValue({
      bankName: "Sparkasse", ibanLast4: "5678", bic: "SSKMDEMMXXX",
      feeCollectionDay: 1, feeCollectionMonth: 3,
    });
    const result = await executeTool("get_club_settings", {}) as { ibanMasked: string };
    expect(result.ibanMasked).toBe("****5678");
  });

  it("returns null when no settings exist", async () => {
    db.clubSettings.findFirst.mockResolvedValue(null);
    const result = await executeTool("get_club_settings", {});
    expect(result).toBeNull();
  });
});

// ─── navigate ─────────────────────────────────────────────────────────────────

describe("navigate", () => {
  it("returns navigateTo path", async () => {
    const result = await executeTool("navigate", { path: "/admin/events/new" });
    expect(result).toEqual({ navigateTo: "/admin/events/new" });
  });
});

// ─── get_stats ────────────────────────────────────────────────────────────────

describe("get_stats", () => {
  it("returns aggregated counts", async () => {
    db.event.count.mockResolvedValue(5);
    db.member.count.mockResolvedValue(12);
    db.pendingMembership.count.mockResolvedValue(2);
    db.user.count.mockResolvedValue(30);
    db.newsletter.count.mockResolvedValue(4);
    db.recap.count.mockResolvedValue(7);
    const result = await executeTool("get_stats", {}) as Record<string, number>;
    expect(result).toEqual({ events: 5, members: 12, pendingMemberships: 2, users: 30, newsletters: 4, recaps: 7 });
  });
});

// ─── unknown tool ─────────────────────────────────────────────────────────────

describe("unknown tool", () => {
  it("throws for unknown tool name", async () => {
    await expect(executeTool("nonexistent", {})).rejects.toThrow("Unknown tool: nonexistent");
  });
});
