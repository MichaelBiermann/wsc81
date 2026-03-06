import { describe, it, expect } from "vitest";
import {
  MembershipSchema,
  BookingSchema,
  EventSchema,
  SearchSchema,
  SponsorSchema,
  NewsletterSchema,
  ContentSchema,
  RecapSchema,
  AIRephraseSchema,
  ClubSettingsSchema,
  UserRegisterSchema,
} from "@/lib/validation";

// ─── helpers ──────────────────────────────────────────────────────────────────

function ok<T>(schema: { safeParse: (v: unknown) => { success: boolean; data?: T } }, value: unknown) {
  const r = schema.safeParse(value);
  expect(r.success).toBe(true);
  return r.data as T;
}

function fail(schema: { safeParse: (v: unknown) => { success: boolean } }, value: unknown) {
  expect(schema.safeParse(value).success).toBe(false);
}

// ─── MembershipSchema ─────────────────────────────────────────────────────────

describe("MembershipSchema", () => {
  const base = {
    category: "ERWACHSENE",
    person1: { name: "Max Muster", dob: "1985-06-15" },
    street: "Musterstraße 1",
    postalCode: "69190",
    city: "Walldorf",
    phone: "0621 123456",
    email: "max@example.com",
    bankName: "Sparkasse",
    iban: "DE89370400440532013000",
    bic: "BELADEBEXXX",
    consentData: true,
    consentCancellation: true,
    consentBylaws: true,
  };

  it("accepts a valid membership", () => ok(MembershipSchema, base));

  it("normalises IBAN to uppercase and strips spaces", () => {
    const data = ok(MembershipSchema, { ...base, iban: "de89 3704 0044 0532 0130 00" });
    expect(data.iban).toBe("DE89370400440532013000");
  });

  it("normalises email to lowercase", () => {
    const data = ok(MembershipSchema, { ...base, email: "MAX@EXAMPLE.COM" });
    expect(data.email).toBe("max@example.com");
  });

  it("rejects invalid IBAN", () => fail(MembershipSchema, { ...base, iban: "NOTANIBAN" }));
  it("rejects invalid BIC", () => fail(MembershipSchema, { ...base, bic: "bad" }));
  it("rejects invalid postal code", () => fail(MembershipSchema, { ...base, postalCode: "1234" }));
  it("rejects invalid email", () => fail(MembershipSchema, { ...base, email: "notanemail" }));
  it("rejects when consentData is false", () => fail(MembershipSchema, { ...base, consentData: false }));
  it("rejects unknown category", () => fail(MembershipSchema, { ...base, category: "UNKNOWN" }));
  it("rejects invalid dob format", () => fail(MembershipSchema, { ...base, person1: { name: "A", dob: "15.06.1985" } }));
  it("defaults locale to 'de'", () => {
    const data = ok(MembershipSchema, base);
    expect(data.locale).toBe("de");
  });
});

// ─── BookingSchema ────────────────────────────────────────────────────────────

describe("BookingSchema", () => {
  const base = {
    eventId: "clxxxxxxxxxxxxxxxxxxxxxx", // cuid-like
    person1: { name: "Anna", dob: "1990-01-01" },
    street: "Teststr. 2",
    postalCode: "12345",
    city: "Berlin",
    phone: "030 99999",
    email: "anna@example.de",
  };

  it("accepts valid booking", () => ok(BookingSchema, base));
  it("defaults roomsSingle to 0", () => {
    const data = ok(BookingSchema, base);
    expect(data.roomsSingle).toBe(0);
  });
  it("defaults roomsDouble to 0", () => {
    const data = ok(BookingSchema, base);
    expect(data.roomsDouble).toBe(0);
  });
  it("rejects invalid eventId (not cuid)", () => fail(BookingSchema, { ...base, eventId: "not-a-cuid" }));
  it("rejects invalid postal code", () => fail(BookingSchema, { ...base, postalCode: "999" }));
  it("rejects remarks over 2000 chars", () =>
    fail(BookingSchema, { ...base, remarks: "a".repeat(2001) }));
  it("accepts remarks up to 2000 chars", () =>
    ok(BookingSchema, { ...base, remarks: "a".repeat(2000) }));
});

// ─── SearchSchema ─────────────────────────────────────────────────────────────

describe("SearchSchema", () => {
  it("accepts query of 2+ chars", () => ok(SearchSchema, { q: "sk" }));
  it("rejects query of 1 char", () => fail(SearchSchema, { q: "a" }));
  it("rejects query over 200 chars", () => fail(SearchSchema, { q: "a".repeat(201) }));
  it("trims whitespace", () => {
    const data = ok(SearchSchema, { q: "  ski  " });
    expect(data.q).toBe("ski");
  });
});

// ─── EventSchema ──────────────────────────────────────────────────────────────

describe("EventSchema", () => {
  const base = {
    titleDe: "Skiausfahrt",
    titleEn: "Ski Trip",
    descriptionDe: "Beschreibung",
    descriptionEn: "Description",
    location: "Lenggries",
    startDate: "2027-01-10T08:00:00Z",
    endDate: "2027-01-15T18:00:00Z",
    depositAmount: 40,
  };

  it("accepts valid event", () => ok(EventSchema, base));
  it("defaults bookable to true", () => {
    const data = ok(EventSchema, base);
    expect(data.bookable).toBe(true);
  });
  it("defaults surcharges to 0", () => {
    const data = ok(EventSchema, base);
    expect(data.surchargeNonMemberAdult).toBe(0);
    expect(data.busSurcharge).toBe(0);
  });
  it("transforms empty imageUrl to null", () => {
    const data = ok(EventSchema, { ...base, imageUrl: "" });
    expect(data.imageUrl).toBeNull();
  });
  it("accepts valid imageUrl", () => {
    const data = ok(EventSchema, { ...base, imageUrl: "https://example.com/img.png" });
    expect(data.imageUrl).toBe("https://example.com/img.png");
  });
  it("rejects invalid datetime for startDate", () =>
    fail(EventSchema, { ...base, startDate: "2027-01-10" }));
  it("rejects negative depositAmount", () =>
    fail(EventSchema, { ...base, depositAmount: -1 }));
  it("defaults agePrices to empty array", () => {
    const data = ok(EventSchema, base);
    expect(data.agePrices).toEqual([]);
  });
  it("rejects agePrices with more than 10 entries", () =>
    fail(EventSchema, {
      ...base,
      agePrices: Array.from({ length: 11 }, (_, i) => ({ label: `Cat ${i}`, price: 10 })),
    }));
});

// ─── SponsorSchema ────────────────────────────────────────────────────────────

describe("SponsorSchema", () => {
  const base = {
    name: "Firma GmbH",
    websiteUrl: "https://firma.de",
    imageUrl: "https://firma.de/logo.png",
  };

  it("accepts valid sponsor", () => ok(SponsorSchema, base));
  it("defaults displayOrder to 0", () => {
    const data = ok(SponsorSchema, base);
    expect(data.displayOrder).toBe(0);
  });
  it("rejects invalid websiteUrl", () => fail(SponsorSchema, { ...base, websiteUrl: "not-a-url" }));
  it("rejects missing name", () => fail(SponsorSchema, { ...base, name: "" }));
});

// ─── NewsletterSchema ─────────────────────────────────────────────────────────

describe("NewsletterSchema", () => {
  const base = {
    subjectDe: "Rundbrief",
    subjectEn: "Newsletter",
    bodyDe: "<p>Inhalt</p>",
    bodyEn: "<p>Content</p>",
  };

  it("accepts valid newsletter", () => ok(NewsletterSchema, base));
  it("rejects empty subjectDe", () => fail(NewsletterSchema, { ...base, subjectDe: "" }));
  it("rejects empty bodyEn", () => fail(NewsletterSchema, { ...base, bodyEn: "" }));
});

// ─── ContentSchema ────────────────────────────────────────────────────────────

describe("ContentSchema", () => {
  const base = {
    slug: "mein-artikel",
    titleDe: "Mein Artikel",
    titleEn: "My Article",
    bodyDe: "Inhalt",
    bodyEn: "Content",
  };

  it("accepts valid content", () => ok(ContentSchema, base));
  it("defaults status to DRAFT", () => {
    const data = ok(ContentSchema, base);
    expect(data.status).toBe("DRAFT");
  });
  it("rejects slug with uppercase letters", () => fail(ContentSchema, { ...base, slug: "Mein-Artikel" }));
  it("rejects slug with umlauts", () => fail(ContentSchema, { ...base, slug: "mein-artikel-für-dich" }));
  it("accepts slug with digits", () => ok(ContentSchema, { ...base, slug: "artikel-2026" }));
  it("rejects empty slug", () => fail(ContentSchema, { ...base, slug: "" }));
});

// ─── RecapSchema ──────────────────────────────────────────────────────────────

describe("RecapSchema", () => {
  const base = {
    slug: "auf-nach-lenggries",
    titleDe: "Auf nach Lenggries",
    titleEn: "Off to Lenggries",
    bodyDe: "Inhalt",
    bodyEn: "Content",
  };

  it("accepts valid recap", () => ok(RecapSchema, base));
  it("transforms empty imageUrl to null", () => {
    const data = ok(RecapSchema, { ...base, imageUrl: "" });
    expect(data.imageUrl).toBeNull();
  });
  it("accepts valid eventDate", () => ok(RecapSchema, { ...base, eventDate: "2024-02-10" }));
  it("rejects invalid eventDate format", () => fail(RecapSchema, { ...base, eventDate: "10.02.2024" }));
  it("rejects slug with spaces", () => fail(RecapSchema, { ...base, slug: "auf nach lenggries" }));
});

// ─── AIRephraseSchema ─────────────────────────────────────────────────────────

describe("AIRephraseSchema", () => {
  it("accepts valid rephrase action", () =>
    ok(AIRephraseSchema, { text: "Hello", action: "rephrase" }));
  it("accepts all valid actions", () => {
    const actions = ["rephrase", "shorten", "expand", "fix_grammar", "translate_to_de", "translate_to_en", "optimize_event", "extract_surcharges"];
    for (const action of actions) {
      ok(AIRephraseSchema, { text: "test", action });
    }
  });
  it("rejects unknown action", () => fail(AIRephraseSchema, { text: "test", action: "delete_everything" }));
  it("rejects empty text", () => fail(AIRephraseSchema, { text: "", action: "rephrase" }));
  it("rejects text over 5000 chars", () => fail(AIRephraseSchema, { text: "a".repeat(5001), action: "rephrase" }));
  it("defaults locale to 'de'", () => {
    const data = ok(AIRephraseSchema, { text: "test", action: "rephrase" });
    expect(data.locale).toBe("de");
  });
});

// ─── ClubSettingsSchema ───────────────────────────────────────────────────────

describe("ClubSettingsSchema", () => {
  const base = {
    bankName: "Sparkasse Heidelberg",
    iban: "DE89370400440532013000",
    bic: "BELADEBEXXX",
    feeCollectionDay: 1,
    feeCollectionMonth: 3,
    paymentReminderWeeks: 4,
  };

  it("accepts valid settings", () => ok(ClubSettingsSchema, base));
  it("rejects feeCollectionDay < 1", () => fail(ClubSettingsSchema, { ...base, feeCollectionDay: 0 }));
  it("rejects feeCollectionDay > 28", () => fail(ClubSettingsSchema, { ...base, feeCollectionDay: 29 }));
  it("rejects feeCollectionMonth < 1", () => fail(ClubSettingsSchema, { ...base, feeCollectionMonth: 0 }));
  it("rejects feeCollectionMonth > 12", () => fail(ClubSettingsSchema, { ...base, feeCollectionMonth: 13 }));
  it("rejects paymentReminderWeeks > 52", () => fail(ClubSettingsSchema, { ...base, paymentReminderWeeks: 53 }));
  it("normalises IBAN: strips spaces and uppercases", () => {
    const data = ok(ClubSettingsSchema, { ...base, iban: "de89 3704 0044 0532 0130 00" });
    expect(data.iban).toBe("DE89370400440532013000");
  });
});

// ─── UserRegisterSchema ───────────────────────────────────────────────────────

describe("UserRegisterSchema", () => {
  const base = {
    firstName: "Max",
    lastName: "Muster",
    dob: "1985-06-15",
    street: "Musterstr. 1",
    postalCode: "69190",
    city: "Walldorf",
    phone: "0621 99999",
    email: "max@example.com",
    password: "securepass123",
  };

  it("accepts valid registration", () => ok(UserRegisterSchema, base));
  it("normalises email to lowercase", () => {
    const data = ok(UserRegisterSchema, { ...base, email: "MAX@EXAMPLE.COM" });
    expect(data.email).toBe("max@example.com");
  });
  it("rejects password shorter than 8 chars", () => fail(UserRegisterSchema, { ...base, password: "short" }));
  it("rejects password longer than 128 chars", () => fail(UserRegisterSchema, { ...base, password: "a".repeat(129) }));
  it("rejects invalid dob", () => fail(UserRegisterSchema, { ...base, dob: "not-a-date" }));
  it("rejects invalid postal code", () => fail(UserRegisterSchema, { ...base, postalCode: "1234" }));
  it("rejects invalid email", () => fail(UserRegisterSchema, { ...base, email: "not-an-email" }));
  it("defaults locale to 'de'", () => {
    const data = ok(UserRegisterSchema, base);
    expect(data.locale).toBe("de");
  });
});
