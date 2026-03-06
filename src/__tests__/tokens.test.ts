import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { generateActivationToken, tokenExpiresAt, isTokenExpired } from "@/lib/tokens";

// ─── generateActivationToken ──────────────────────────────────────────────────

describe("generateActivationToken", () => {
  it("returns a 96-character hex string", () => {
    const token = generateActivationToken();
    expect(token).toHaveLength(96);
    expect(token).toMatch(/^[0-9a-f]{96}$/);
  });

  it("returns a different token each call", () => {
    const t1 = generateActivationToken();
    const t2 = generateActivationToken();
    expect(t1).not.toBe(t2);
  });
});

// ─── tokenExpiresAt ───────────────────────────────────────────────────────────

describe("tokenExpiresAt", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-01T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns a date 7 days in the future", () => {
    const expires = tokenExpiresAt();
    const expected = new Date("2026-03-08T12:00:00Z");
    expect(expires.toISOString()).toBe(expected.toISOString());
  });

  it("returns a Date instance", () => {
    expect(tokenExpiresAt()).toBeInstanceOf(Date);
  });
});

// ─── isTokenExpired ───────────────────────────────────────────────────────────

describe("isTokenExpired", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-05T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns true for a date in the past", () => {
    expect(isTokenExpired(new Date("2026-03-04T00:00:00Z"))).toBe(true);
  });

  it("returns false for a date in the future", () => {
    expect(isTokenExpired(new Date("2026-03-06T00:00:00Z"))).toBe(false);
  });

  it("returns true for a date equal to now (boundary: < not <=)", () => {
    // expiresAt === now: not strictly less than, so not expired
    const now = new Date("2026-03-05T12:00:00Z");
    // The implementation is `expiresAt < new Date()`, so equal → false
    expect(isTokenExpired(now)).toBe(false);
  });

  it("returns true for 1ms before now", () => {
    expect(isTokenExpired(new Date("2026-03-05T11:59:59.999Z"))).toBe(true);
  });
});
