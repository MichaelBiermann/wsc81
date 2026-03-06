import { describe, it, expect, vi } from "vitest";
import { stripHtml, calcAge } from "@/lib/pdf-utils";

// ─── stripHtml ────────────────────────────────────────────────────────────────

describe("stripHtml", () => {
  it("removes plain tags", () => {
    expect(stripHtml("<p>Hello</p>")).toBe("Hello");
  });

  it("converts </p> to newline", () => {
    expect(stripHtml("<p>Line 1</p><p>Line 2</p>")).toBe("Line 1\nLine 2");
  });

  it("converts <br> to newline", () => {
    expect(stripHtml("Line 1<br>Line 2")).toBe("Line 1\nLine 2");
    expect(stripHtml("Line 1<br />Line 2")).toBe("Line 1\nLine 2");
  });

  it("converts block-level closing tags to newlines", () => {
    expect(stripHtml("<li>Item</li>")).toContain("Item");
    expect(stripHtml("<div>Block</div>")).toContain("Block");
    expect(stripHtml("<h1>Title</h1>")).toContain("Title");
  });

  it("strips span content entirely", () => {
    expect(stripHtml('<span class="icon">search</span>Text')).toBe("Text");
    expect(stripHtml("<span>icon</span>after")).toBe("after");
  });

  it("strips multiline span content", () => {
    expect(stripHtml("<span\nclass=\"x\">content</span>text")).toBe("text");
  });

  it("decodes HTML entities", () => {
    expect(stripHtml("a &amp; b")).toBe("a & b");
    expect(stripHtml("&lt;tag&gt;")).toBe("<tag>");
    expect(stripHtml("&quot;quoted&quot;")).toBe('"quoted"');
    expect(stripHtml("it&#39;s")).toBe("it's");
    expect(stripHtml("a&nbsp;b")).toBe("a b");
  });

  it("strips emoji and non-WinAnsi characters", () => {
    expect(stripHtml("Email: 📧 test@example.com")).toBe("Email:  test@example.com");
    expect(stripHtml("Phone: 📞 123")).toBe("Phone:  123");
    expect(stripHtml("Star: ✦ text")).toBe("Star:  text");
  });

  it("collapses 3+ consecutive newlines to 2", () => {
    expect(stripHtml("<p>A</p><p></p><p></p><p>B</p>")).toBe("A\n\nB");
  });

  it("trims leading and trailing whitespace", () => {
    expect(stripHtml("  <p>text</p>  ")).toBe("text");
  });

  it("handles empty string", () => {
    expect(stripHtml("")).toBe("");
  });

  it("handles string with only HTML", () => {
    expect(stripHtml("<p><br/></p>")).toBe("");
  });

  it("preserves Latin-1 characters (within WinAnsi range)", () => {
    expect(stripHtml("Straße, Müller, café")).toBe("Straße, Müller, café");
  });
});

// ─── calcAge ──────────────────────────────────────────────────────────────────

describe("calcAge", () => {
  it("returns dash for null dob", () => {
    expect(calcAge(null)).toBe("-");
  });

  it("calculates age for someone born exactly 30 years ago today", () => {
    const today = new Date();
    const dob = new Date(today.getFullYear() - 30, today.getMonth(), today.getDate());
    expect(calcAge(dob)).toBe("30");
  });

  it("is not yet birthday this year — age is one less", () => {
    const today = new Date();
    // Birthday is tomorrow
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const dob = new Date(today.getFullYear() - 25, tomorrow.getMonth(), tomorrow.getDate());
    expect(calcAge(dob)).toBe("24");
  });

  it("birthday already passed this year — full age applies", () => {
    const today = new Date();
    // Birthday was yesterday
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const dob = new Date(today.getFullYear() - 25, yesterday.getMonth(), yesterday.getDate());
    expect(calcAge(dob)).toBe("25");
  });

  it("handles birthday in a different month (already passed)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15"));
    const dob = new Date("1990-03-01");
    expect(calcAge(dob)).toBe("36");
    vi.useRealTimers();
  });

  it("handles birthday in a different month (not yet reached)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-01"));
    const dob = new Date("1990-06-15");
    expect(calcAge(dob)).toBe("35");
    vi.useRealTimers();
  });

  it("returns string type", () => {
    const dob = new Date("2000-01-01");
    expect(typeof calcAge(dob)).toBe("string");
  });
});
