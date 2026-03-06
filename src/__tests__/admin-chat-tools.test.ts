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

// ─── update_member_fees ───────────────────────────────────────────────────────

describe("update_member_fees", () => {
  it("updates feesPaid to true", async () => {
    db.member.update.mockResolvedValue({ id: "m1", feesPaid: true });
    const result = await executeTool("update_member_fees", { id: "m1", feesPaid: true }) as { feesPaid: boolean };
    expect(result.feesPaid).toBe(true);
    expect(db.member.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "m1" }, data: { feesPaid: true } })
    );
  });

  it("updates feesPaid to false", async () => {
    db.member.update.mockResolvedValue({ id: "m1", feesPaid: false });
    const result = await executeTool("update_member_fees", { id: "m1", feesPaid: false }) as { feesPaid: boolean };
    expect(result.feesPaid).toBe(false);
  });
});

// ─── list_pending_memberships ─────────────────────────────────────────────────

describe("list_pending_memberships", () => {
  it("returns mapped pending memberships", async () => {
    const raw = [{
      id: "pm1", person1Name: "Anna", email: "anna@example.com", category: "adult",
      createdAt: new Date("2026-01-01"), tokenExpiresAt: new Date("2026-01-08"),
    }];
    db.pendingMembership.findMany.mockResolvedValue(raw);
    const result = await executeTool("list_pending_memberships", {}) as { createdAt: string; tokenExpiresAt: string }[];
    expect(result[0].createdAt).toBe("2026-01-01T00:00:00.000Z");
    expect(result[0].tokenExpiresAt).toBe("2026-01-08T00:00:00.000Z");
  });

  it("returns empty array when none pending", async () => {
    db.pendingMembership.findMany.mockResolvedValue([]);
    const result = await executeTool("list_pending_memberships", {});
    expect(result).toEqual([]);
  });
});

// ─── delete_pending_membership ────────────────────────────────────────────────

describe("delete_pending_membership", () => {
  it("returns deleted: true", async () => {
    db.pendingMembership.delete.mockResolvedValue({});
    const result = await executeTool("delete_pending_membership", { id: "pm1" });
    expect(result).toEqual({ deleted: true });
    expect(db.pendingMembership.delete).toHaveBeenCalledWith({ where: { id: "pm1" } });
  });
});

// ─── list_users ───────────────────────────────────────────────────────────────

describe("list_users", () => {
  const rawUser = {
    id: "u1", firstName: "Max", lastName: "Muster", email: "max@example.com",
    emailVerified: new Date("2025-05-01"), memberId: null,
    createdAt: new Date("2025-04-01"), _count: { bookings: 2 },
  };

  it("maps createdAt to ISO string", async () => {
    db.user.findMany.mockResolvedValue([rawUser]);
    const result = await executeTool("list_users", {}) as { createdAt: string }[];
    expect(result[0].createdAt).toBe("2025-04-01T00:00:00.000Z");
  });

  it("uses default limit of 50", async () => {
    db.user.findMany.mockResolvedValue([]);
    await executeTool("list_users", {});
    expect(db.user.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 50 }));
  });

  it("respects custom limit", async () => {
    db.user.findMany.mockResolvedValue([]);
    await executeTool("list_users", { limit: 5 });
    expect(db.user.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 5 }));
  });
});

// ─── delete_user ──────────────────────────────────────────────────────────────

describe("delete_user", () => {
  it("returns deleted: true", async () => {
    db.user.delete.mockResolvedValue({});
    const result = await executeTool("delete_user", { id: "u1" });
    expect(result).toEqual({ deleted: true });
    expect(db.user.delete).toHaveBeenCalledWith({ where: { id: "u1" } });
  });
});

// ─── list_pages ───────────────────────────────────────────────────────────────

describe("list_pages", () => {
  const rawPage = { id: "p1", slug: "satzung", titleDe: "Satzung", status: "PUBLISHED" };

  it("returns pages list", async () => {
    db.page.findMany.mockResolvedValue([rawPage]);
    const result = await executeTool("list_pages", {}) as typeof rawPage[];
    expect(result[0].slug).toBe("satzung");
  });

  it("filters by status when provided", async () => {
    db.page.findMany.mockResolvedValue([]);
    await executeTool("list_pages", { status: "DRAFT" });
    expect(db.page.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: "DRAFT" } })
    );
  });

  it("no filter when status is 'all'", async () => {
    db.page.findMany.mockResolvedValue([]);
    await executeTool("list_pages", { status: "all" });
    expect(db.page.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} })
    );
  });

  it("no filter when status is absent", async () => {
    db.page.findMany.mockResolvedValue([]);
    await executeTool("list_pages", {});
    expect(db.page.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} })
    );
  });
});

// ─── create_page ──────────────────────────────────────────────────────────────

describe("create_page", () => {
  it("returns id and slug", async () => {
    db.page.create.mockResolvedValue({ id: "p1", slug: "neues-test" });
    const result = await executeTool("create_page", {
      slug: "neues-test", titleDe: "Test", titleEn: "Test",
      bodyDe: "", bodyEn: "",
    }) as { id: string; slug: string };
    expect(result.slug).toBe("neues-test");
  });

  it("sets publishedAt when status is PUBLISHED", async () => {
    db.page.create.mockResolvedValue({ id: "p1", slug: "test" });
    await executeTool("create_page", {
      slug: "test", titleDe: "T", titleEn: "T", bodyDe: "", bodyEn: "", status: "PUBLISHED",
    });
    const call = db.page.create.mock.calls[0][0];
    expect(call.data.publishedAt).toBeInstanceOf(Date);
  });

  it("sets publishedAt to null when status is DRAFT", async () => {
    db.page.create.mockResolvedValue({ id: "p1", slug: "test" });
    await executeTool("create_page", {
      slug: "test", titleDe: "T", titleEn: "T", bodyDe: "", bodyEn: "", status: "DRAFT",
    });
    const call = db.page.create.mock.calls[0][0];
    expect(call.data.publishedAt).toBeNull();
  });

  it("defaults to DRAFT when no status provided", async () => {
    db.page.create.mockResolvedValue({ id: "p1", slug: "test" });
    await executeTool("create_page", {
      slug: "test", titleDe: "T", titleEn: "T", bodyDe: "", bodyEn: "",
    });
    const call = db.page.create.mock.calls[0][0];
    expect(call.data.status).toBe("DRAFT");
  });
});

// ─── delete_page ──────────────────────────────────────────────────────────────

describe("delete_page", () => {
  it("returns deleted: true", async () => {
    db.page.delete.mockResolvedValue({});
    const result = await executeTool("delete_page", { id: "p1" });
    expect(result).toEqual({ deleted: true });
    expect(db.page.delete).toHaveBeenCalledWith({ where: { id: "p1" } });
  });
});

// ─── list_recaps ──────────────────────────────────────────────────────────────

describe("list_recaps", () => {
  const rawRecap = {
    id: "r1", slug: "auf-nach-lenggries", titleDe: "Auf nach Lenggries",
    eventDate: new Date("2024-02-10"), status: "PUBLISHED",
  };

  it("maps eventDate to ISO string", async () => {
    db.recap.findMany.mockResolvedValue([rawRecap]);
    const result = await executeTool("list_recaps", {}) as { eventDate: string }[];
    expect(result[0].eventDate).toBe("2024-02-10T00:00:00.000Z");
  });

  it("returns null eventDate when not set", async () => {
    db.recap.findMany.mockResolvedValue([{ ...rawRecap, eventDate: null }]);
    const result = await executeTool("list_recaps", {}) as { eventDate: string | null }[];
    expect(result[0].eventDate).toBeNull();
  });

  it("filters by status PUBLISHED", async () => {
    db.recap.findMany.mockResolvedValue([]);
    await executeTool("list_recaps", { status: "PUBLISHED" });
    expect(db.recap.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: "PUBLISHED" } })
    );
  });

  it("no filter when status is 'all'", async () => {
    db.recap.findMany.mockResolvedValue([]);
    await executeTool("list_recaps", { status: "all" });
    expect(db.recap.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} })
    );
  });
});

// ─── create_recap ─────────────────────────────────────────────────────────────

describe("create_recap", () => {
  it("returns id and slug", async () => {
    db.recap.create.mockResolvedValue({ id: "r1", slug: "neue-tour" });
    const result = await executeTool("create_recap", {
      slug: "neue-tour", titleDe: "Neue Tour", titleEn: "New Tour",
      bodyDe: "", bodyEn: "",
    }) as { id: string; slug: string };
    expect(result.slug).toBe("neue-tour");
  });

  it("converts eventDate string to Date when provided", async () => {
    db.recap.create.mockResolvedValue({ id: "r1", slug: "test" });
    await executeTool("create_recap", {
      slug: "test", titleDe: "T", titleEn: "T", bodyDe: "", bodyEn: "",
      eventDate: "2024-03-15",
    });
    const call = db.recap.create.mock.calls[0][0];
    expect(call.data.eventDate).toBeInstanceOf(Date);
  });

  it("sets eventDate to null when not provided", async () => {
    db.recap.create.mockResolvedValue({ id: "r1", slug: "test" });
    await executeTool("create_recap", {
      slug: "test", titleDe: "T", titleEn: "T", bodyDe: "", bodyEn: "",
    });
    const call = db.recap.create.mock.calls[0][0];
    expect(call.data.eventDate).toBeNull();
  });

  it("sets publishedAt when status is PUBLISHED", async () => {
    db.recap.create.mockResolvedValue({ id: "r1", slug: "test" });
    await executeTool("create_recap", {
      slug: "test", titleDe: "T", titleEn: "T", bodyDe: "", bodyEn: "", status: "PUBLISHED",
    });
    const call = db.recap.create.mock.calls[0][0];
    expect(call.data.publishedAt).toBeInstanceOf(Date);
  });
});

// ─── delete_recap ─────────────────────────────────────────────────────────────

describe("delete_recap", () => {
  it("returns deleted: true", async () => {
    db.recap.delete.mockResolvedValue({});
    const result = await executeTool("delete_recap", { id: "r1" });
    expect(result).toEqual({ deleted: true });
  });
});

// ─── list_sponsors ────────────────────────────────────────────────────────────

describe("list_sponsors", () => {
  it("returns sponsors", async () => {
    const sponsors = [{ id: "s1", name: "Sponsor A", websiteUrl: "https://a.de", imageUrl: "/img.png", displayOrder: 0 }];
    db.sponsor.findMany.mockResolvedValue(sponsors);
    const result = await executeTool("list_sponsors", {});
    expect(result).toEqual(sponsors);
    expect(db.sponsor.findMany).toHaveBeenCalledWith({ orderBy: { displayOrder: "asc" } });
  });
});

// ─── create_sponsor ───────────────────────────────────────────────────────────

describe("create_sponsor", () => {
  it("creates sponsor with all fields", async () => {
    const created = { id: "s1", name: "Firma GmbH", websiteUrl: "https://firma.de", imageUrl: "/img.png", displayOrder: 3 };
    db.sponsor.create.mockResolvedValue(created);
    const result = await executeTool("create_sponsor", {
      name: "Firma GmbH", websiteUrl: "https://firma.de", imageUrl: "/img.png", displayOrder: 3,
    });
    expect(result).toEqual(created);
  });

  it("defaults displayOrder to 0 when not provided", async () => {
    db.sponsor.create.mockResolvedValue({ id: "s1", name: "X", websiteUrl: "", imageUrl: "", displayOrder: 0 });
    await executeTool("create_sponsor", { name: "X", websiteUrl: "", imageUrl: "" });
    const call = db.sponsor.create.mock.calls[0][0];
    expect(call.data.displayOrder).toBe(0);
  });
});

// ─── delete_sponsor ───────────────────────────────────────────────────────────

describe("delete_sponsor", () => {
  it("returns deleted: true", async () => {
    db.sponsor.delete.mockResolvedValue({});
    const result = await executeTool("delete_sponsor", { id: "s1" });
    expect(result).toEqual({ deleted: true });
    expect(db.sponsor.delete).toHaveBeenCalledWith({ where: { id: "s1" } });
  });
});

// ─── list_newsletters ─────────────────────────────────────────────────────────

describe("list_newsletters", () => {
  it("maps dates to ISO strings", async () => {
    const raw = [{
      id: "nl1", subjectDe: "Rundbrief", status: "SENT",
      sentAt: new Date("2026-01-15"), recipientCount: 42,
      createdAt: new Date("2026-01-10"),
    }];
    db.newsletter.findMany.mockResolvedValue(raw);
    const result = await executeTool("list_newsletters", {}) as { createdAt: string; sentAt: string | null }[];
    expect(result[0].createdAt).toBe("2026-01-10T00:00:00.000Z");
    expect(result[0].sentAt).toBe("2026-01-15T00:00:00.000Z");
  });

  it("returns null sentAt for unsent newsletters", async () => {
    const raw = [{
      id: "nl1", subjectDe: "Draft", status: "DRAFT",
      sentAt: null, recipientCount: 0,
      createdAt: new Date("2026-01-10"),
    }];
    db.newsletter.findMany.mockResolvedValue(raw);
    const result = await executeTool("list_newsletters", {}) as { sentAt: string | null }[];
    expect(result[0].sentAt).toBeNull();
  });
});

// ─── delete_newsletter ────────────────────────────────────────────────────────

describe("delete_newsletter", () => {
  it("returns deleted: true", async () => {
    db.newsletter.delete.mockResolvedValue({});
    const result = await executeTool("delete_newsletter", { id: "nl1" });
    expect(result).toEqual({ deleted: true });
    expect(db.newsletter.delete).toHaveBeenCalledWith({ where: { id: "nl1" } });
  });
});

// ─── delete_news_post ─────────────────────────────────────────────────────────

describe("delete_news_post", () => {
  it("returns deleted: true", async () => {
    db.newsPost.delete.mockResolvedValue({});
    const result = await executeTool("delete_news_post", { id: "n1" });
    expect(result).toEqual({ deleted: true });
    expect(db.newsPost.delete).toHaveBeenCalledWith({ where: { id: "n1" } });
  });
});

// ─── unknown tool ─────────────────────────────────────────────────────────────

describe("unknown tool", () => {
  it("throws for unknown tool name", async () => {
    await expect(executeTool("nonexistent", {})).rejects.toThrow("Unknown tool: nonexistent");
  });
});
