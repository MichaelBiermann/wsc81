import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { encryptIBAN, decryptIBAN, ibanLast4 } from "@/lib/crypto";

// Valid 64-char hex key (32 bytes)
const TEST_KEY = "a".repeat(64);

beforeEach(() => {
  process.env.IBAN_ENCRYPTION_KEY = TEST_KEY;
});

afterEach(() => {
  delete process.env.IBAN_ENCRYPTION_KEY;
});

// ─── encryptIBAN / decryptIBAN ────────────────────────────────────────────────

describe("encryptIBAN / decryptIBAN", () => {
  it("round-trips a German IBAN", () => {
    const iban = "DE89370400440532013000";
    const encrypted = encryptIBAN(iban);
    expect(decryptIBAN(encrypted)).toBe(iban);
  });

  it("produces different ciphertext each call (random IV)", () => {
    const iban = "DE89370400440532013000";
    const enc1 = encryptIBAN(iban);
    const enc2 = encryptIBAN(iban);
    expect(enc1).not.toBe(enc2);
  });

  it("encrypted string is hex-only", () => {
    const encrypted = encryptIBAN("DE89370400440532013000");
    expect(encrypted).toMatch(/^[0-9a-f]+$/);
  });

  it("encrypted string has at least iv(32) + tag(32) + 1 char", () => {
    const encrypted = encryptIBAN("X");
    expect(encrypted.length).toBeGreaterThanOrEqual(65);
  });

  it("round-trips an IBAN with spaces stripped", () => {
    const plain = "GB29NWBK60161331926819";
    const encrypted = encryptIBAN(plain);
    expect(decryptIBAN(encrypted)).toBe(plain);
  });

  it("throws when IBAN_ENCRYPTION_KEY is missing", () => {
    delete process.env.IBAN_ENCRYPTION_KEY;
    expect(() => encryptIBAN("DE89370400440532013000")).toThrow("IBAN_ENCRYPTION_KEY");
  });

  it("throws when IBAN_ENCRYPTION_KEY is wrong length", () => {
    process.env.IBAN_ENCRYPTION_KEY = "abc123";
    expect(() => encryptIBAN("DE89370400440532013000")).toThrow("IBAN_ENCRYPTION_KEY");
  });
});

// ─── ibanLast4 ────────────────────────────────────────────────────────────────

describe("ibanLast4", () => {
  it("returns last 4 chars of a plain IBAN", () => {
    expect(ibanLast4("DE89370400440532013000")).toBe("3000");
  });

  it("strips spaces before extracting last 4", () => {
    expect(ibanLast4("DE89 3704 0044 0532 0130 00")).toBe("3000");
  });

  it("works for a short IBAN", () => {
    expect(ibanLast4("GB29NWBK60161331926819")).toBe("6819");
  });
});
