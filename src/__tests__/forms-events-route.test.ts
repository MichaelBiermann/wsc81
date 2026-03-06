import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    event: { findMany: vi.fn() },
  },
}));

import { GET } from "@/app/api/forms/events/route";
import { prisma } from "@/lib/prisma";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any;

beforeEach(() => vi.clearAllMocks());

const rawEvent = (id: string, titleDe: string, startDate: Date) => ({
  id,
  titleDe,
  titleEn: titleDe + " EN",
  startDate,
  location: "Lenggries",
});

describe("GET /api/forms/events", () => {
  it("returns 200 with list of bookable upcoming events", async () => {
    const events = [rawEvent("evt-1", "Skiausfahrt", new Date("2027-02-01"))];
    db.event.findMany.mockResolvedValue(events);
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveLength(1);
    expect(data[0].id).toBe("evt-1");
  });

  it("queries only bookable events with future startDate", async () => {
    db.event.findMany.mockResolvedValue([]);
    await GET();
    expect(db.event.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          bookable: true,
          startDate: expect.objectContaining({ gte: expect.any(Date) }),
        }),
      })
    );
  });

  it("returns events ordered by startDate ascending", async () => {
    db.event.findMany.mockResolvedValue([]);
    await GET();
    expect(db.event.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { startDate: "asc" } })
    );
  });

  it("selects only id, titleDe, titleEn, startDate, location", async () => {
    db.event.findMany.mockResolvedValue([]);
    await GET();
    expect(db.event.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: { id: true, titleDe: true, titleEn: true, startDate: true, location: true },
      })
    );
  });

  it("returns empty array when no upcoming bookable events exist", async () => {
    db.event.findMany.mockResolvedValue([]);
    const res = await GET();
    const data = await res.json();
    expect(data).toEqual([]);
  });

  it("returns multiple events", async () => {
    db.event.findMany.mockResolvedValue([
      rawEvent("evt-1", "Skiausfahrt", new Date("2027-01-15")),
      rawEvent("evt-2", "Wandertag", new Date("2027-03-10")),
    ]);
    const res = await GET();
    const data = await res.json();
    expect(data).toHaveLength(2);
  });
});
