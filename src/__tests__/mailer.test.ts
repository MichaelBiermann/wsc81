import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSend = vi.hoisted(() => vi.fn());

vi.mock("@sendgrid/mail", () => ({
  default: {
    setApiKey: vi.fn(),
    send: mockSend,
  },
}));

import {
  sendMembershipConfirmation,
  sendMembershipAccountCreated,
  sendMembershipWelcome,
  sendBookingConfirmation,
  sendBookingAdminNotification,
  sendBookingCancellation,
  sendNewsletterToMember,
  sendUserVerification,
  sendEmailChangeVerification,
  sendPasswordReset,
  sendUserWelcome,
  sendRemainingBalanceReminder,
} from "@/lib/mailer";

beforeEach(() => vi.clearAllMocks());

// ─── helpers ──────────────────────────────────────────────────────────────────

function sentMail() {
  expect(mockSend).toHaveBeenCalledTimes(1);
  return mockSend.mock.calls[0][0] as { to: string; subject: string; html: string; text: string };
}

// ─── sendMembershipAccountCreated ────────────────────────────────────────────

describe("sendMembershipAccountCreated", () => {
  const base = {
    to: "user@example.com",
    person1Name: "Max",
    activationToken: "tok123",
    otp: "TempPass1!",
    locale: "de",
  };

  it("sends German subject", async () => {
    mockSend.mockResolvedValue([]);
    await sendMembershipAccountCreated(base);
    expect(sentMail().subject).toContain("Willkommen");
  });

  it("sends English subject for en locale", async () => {
    mockSend.mockResolvedValue([]);
    await sendMembershipAccountCreated({ ...base, locale: "en" });
    expect(sentMail().subject).toContain("Welcome");
  });

  it("includes activation token in html", async () => {
    mockSend.mockResolvedValue([]);
    await sendMembershipAccountCreated(base);
    expect(sentMail().html).toContain("tok123");
  });

  it("includes OTP in html", async () => {
    mockSend.mockResolvedValue([]);
    await sendMembershipAccountCreated(base);
    expect(sentMail().html).toContain("TempPass1!");
  });

  it("includes person name in html", async () => {
    mockSend.mockResolvedValue([]);
    await sendMembershipAccountCreated(base);
    expect(sentMail().html).toContain("Max");
  });
});

// ─── sendMembershipConfirmation ───────────────────────────────────────────────

describe("sendMembershipConfirmation", () => {
  const base = { to: "user@example.com", person1Name: "Max", activationToken: "abc123", locale: "de" };

  it("sends to correct recipient", async () => {
    mockSend.mockResolvedValue([]);
    await sendMembershipConfirmation(base);
    expect(sentMail().to).toBe("user@example.com");
  });

  it("sends German subject for de locale", async () => {
    mockSend.mockResolvedValue([]);
    await sendMembershipConfirmation(base);
    expect(sentMail().subject).toContain("Ski-Club Walldorf");
    expect(sentMail().subject).toMatch(/bestätigen/i);
  });

  it("sends English subject for en locale", async () => {
    mockSend.mockResolvedValue([]);
    await sendMembershipConfirmation({ ...base, locale: "en" });
    expect(sentMail().subject).toContain("confirm");
  });

  it("includes activation token in html", async () => {
    mockSend.mockResolvedValue([]);
    await sendMembershipConfirmation(base);
    expect(sentMail().html).toContain("abc123");
  });

  it("includes person name in html", async () => {
    mockSend.mockResolvedValue([]);
    await sendMembershipConfirmation(base);
    expect(sentMail().html).toContain("Max");
  });

  it("includes plain text version (strips HTML tags)", async () => {
    mockSend.mockResolvedValue([]);
    await sendMembershipConfirmation(base);
    expect(sentMail().text).not.toContain("<p>");
  });
});

// ─── sendMembershipWelcome ────────────────────────────────────────────────────

describe("sendMembershipWelcome", () => {
  const base = { to: "user@example.com", person1Name: "Anna", memberNumber: 42, locale: "de" };

  it("sends German welcome subject", async () => {
    mockSend.mockResolvedValue([]);
    await sendMembershipWelcome(base);
    expect(sentMail().subject).toContain("Willkommen");
  });

  it("sends English welcome subject", async () => {
    mockSend.mockResolvedValue([]);
    await sendMembershipWelcome({ ...base, locale: "en" });
    expect(sentMail().subject).toContain("Welcome");
  });

  it("includes member number in html", async () => {
    mockSend.mockResolvedValue([]);
    await sendMembershipWelcome(base);
    expect(sentMail().html).toContain("42");
  });
});

// ─── sendBookingConfirmation ──────────────────────────────────────────────────

describe("sendBookingConfirmation", () => {
  const base = {
    to: "user@example.com",
    person1Name: "Klaus",
    eventTitleDe: "Skiausfahrt",
    eventTitleEn: "Ski Trip",
    startDate: new Date("2027-01-15T08:00:00Z"),
    locale: "de",
  };

  it("uses German event title for de locale", async () => {
    mockSend.mockResolvedValue([]);
    await sendBookingConfirmation(base);
    expect(sentMail().subject).toContain("Skiausfahrt");
  });

  it("uses English event title for en locale", async () => {
    mockSend.mockResolvedValue([]);
    await sendBookingConfirmation({ ...base, locale: "en" });
    expect(sentMail().subject).toContain("Ski Trip");
  });

  it("includes payment info when depositAmount and totalAmount provided", async () => {
    mockSend.mockResolvedValue([]);
    await sendBookingConfirmation({ ...base, depositAmount: 40, totalAmount: 200 });
    expect(sentMail().html).toContain("40.00");
    expect(sentMail().html).toContain("200.00");
  });

  it("omits payment info when no amounts provided", async () => {
    mockSend.mockResolvedValue([]);
    await sendBookingConfirmation(base);
    expect(sentMail().html).not.toContain("Anzahlung");
  });
});

// ─── sendBookingAdminNotification ─────────────────────────────────────────────

describe("sendBookingAdminNotification", () => {
  it("includes event title and booking ID in html", async () => {
    mockSend.mockResolvedValue([]);
    await sendBookingAdminNotification({
      eventTitleDe: "Skiausfahrt",
      bookingId: "booking-xyz",
      person1Name: "Hans",
      email: "hans@example.com",
      participantCount: 3,
    });
    const mail = sentMail();
    expect(mail.html).toContain("Skiausfahrt");
    expect(mail.html).toContain("booking-xyz");
    expect(mail.html).toContain("3");
  });
});

// ─── sendBookingCancellation ──────────────────────────────────────────────────

describe("sendBookingCancellation", () => {
  const base = {
    to: "user@example.com",
    person1Name: "Max",
    eventTitleDe: "Skiausfahrt",
    eventTitleEn: "Ski Trip",
    startDate: new Date("2027-01-15"),
    locale: "de",
  };

  it("sends German cancellation subject", async () => {
    mockSend.mockResolvedValue([]);
    await sendBookingCancellation(base);
    expect(sentMail().subject).toContain("Stornierung");
  });

  it("sends English cancellation subject", async () => {
    mockSend.mockResolvedValue([]);
    await sendBookingCancellation({ ...base, locale: "en" });
    expect(sentMail().subject).toContain("cancelled");
  });
});

// ─── sendNewsletterToMember ───────────────────────────────────────────────────

describe("sendNewsletterToMember", () => {
  const base = {
    to: "user@example.com",
    subjectDe: "Rundbrief",
    subjectEn: "Newsletter",
    bodyDe: "<p>Inhalt</p>",
    bodyEn: "<p>Content</p>",
    locale: "de",
  };

  it("sends German subject/body for de locale", async () => {
    mockSend.mockResolvedValue([]);
    await sendNewsletterToMember(base);
    const mail = sentMail();
    expect(mail.subject).toBe("Rundbrief");
    expect(mail.html).toBe("<p>Inhalt</p>");
  });

  it("sends English subject/body for en locale", async () => {
    mockSend.mockResolvedValue([]);
    await sendNewsletterToMember({ ...base, locale: "en" });
    const mail = sentMail();
    expect(mail.subject).toBe("Newsletter");
    expect(mail.html).toBe("<p>Content</p>");
  });
});

// ─── sendUserVerification ─────────────────────────────────────────────────────

describe("sendUserVerification", () => {
  const base = {
    to: "user@example.com",
    firstName: "Lisa",
    verificationUrl: "https://wsc81.vercel.app/de/verify?token=xyz",
    locale: "de",
  };

  it("includes verification URL in html", async () => {
    mockSend.mockResolvedValue([]);
    await sendUserVerification(base);
    expect(sentMail().html).toContain("verify?token=xyz");
  });

  it("sends German subject for de", async () => {
    mockSend.mockResolvedValue([]);
    await sendUserVerification(base);
    expect(sentMail().subject).toContain("bestätigen");
  });

  it("sends English subject for en", async () => {
    mockSend.mockResolvedValue([]);
    await sendUserVerification({ ...base, locale: "en" });
    expect(sentMail().subject).toContain("verify");
  });
});

// ─── sendEmailChangeVerification ──────────────────────────────────────────────

describe("sendEmailChangeVerification", () => {
  const base = {
    to: "new@example.com",
    firstName: "Tom",
    verificationUrl: "https://wsc81.vercel.app/de/verify-email-change?token=abc",
    locale: "de",
  };

  it("sends German subject", async () => {
    mockSend.mockResolvedValue([]);
    await sendEmailChangeVerification(base);
    expect(sentMail().subject).toContain("E-Mail");
  });

  it("sends English subject for en", async () => {
    mockSend.mockResolvedValue([]);
    await sendEmailChangeVerification({ ...base, locale: "en" });
    expect(sentMail().subject).toContain("email");
  });

  it("includes verification URL in html", async () => {
    mockSend.mockResolvedValue([]);
    await sendEmailChangeVerification(base);
    expect(sentMail().html).toContain("verify-email-change");
  });
});

// ─── sendPasswordReset ────────────────────────────────────────────────────────

describe("sendPasswordReset", () => {
  const base = {
    to: "user@example.com",
    firstName: "Bob",
    resetUrl: "https://wsc81.vercel.app/de/reset-password?token=tok",
    locale: "de",
  };

  it("includes reset URL in html", async () => {
    mockSend.mockResolvedValue([]);
    await sendPasswordReset(base);
    expect(sentMail().html).toContain("reset-password");
  });

  it("sends German subject", async () => {
    mockSend.mockResolvedValue([]);
    await sendPasswordReset(base);
    expect(sentMail().subject).toContain("Passwort");
  });

  it("sends English subject for en", async () => {
    mockSend.mockResolvedValue([]);
    await sendPasswordReset({ ...base, locale: "en" });
    expect(sentMail().subject).toContain("Reset");
  });
});

// ─── sendUserWelcome ──────────────────────────────────────────────────────────

describe("sendUserWelcome", () => {
  it("sends German welcome for de", async () => {
    mockSend.mockResolvedValue([]);
    await sendUserWelcome({ to: "u@x.de", firstName: "Kai", locale: "de" });
    expect(sentMail().subject).toContain("Willkommen");
  });

  it("sends English welcome for en", async () => {
    mockSend.mockResolvedValue([]);
    await sendUserWelcome({ to: "u@x.de", firstName: "Kai", locale: "en" });
    expect(sentMail().subject).toContain("Welcome");
  });
});

// ─── sendRemainingBalanceReminder ─────────────────────────────────────────────

describe("sendRemainingBalanceReminder", () => {
  const base = {
    to: "user@example.com",
    person1Name: "Maria",
    eventTitleDe: "Skiausfahrt",
    eventTitleEn: "Ski Trip",
    startDate: new Date("2027-01-15"),
    depositAmount: 40,
    remainingAmount: 160,
    totalAmount: 200,
    locale: "de",
  };

  it("sends German subject", async () => {
    mockSend.mockResolvedValue([]);
    await sendRemainingBalanceReminder(base);
    expect(sentMail().subject).toContain("Restbetrag");
  });

  it("sends English subject for en", async () => {
    mockSend.mockResolvedValue([]);
    await sendRemainingBalanceReminder({ ...base, locale: "en" });
    expect(sentMail().subject).toContain("Remaining balance");
  });

  it("includes all amounts in html", async () => {
    mockSend.mockResolvedValue([]);
    await sendRemainingBalanceReminder(base);
    const html = sentMail().html;
    expect(html).toContain("40.00");
    expect(html).toContain("160.00");
    expect(html).toContain("200.00");
  });

  it("includes person name and event title", async () => {
    mockSend.mockResolvedValue([]);
    await sendRemainingBalanceReminder(base);
    const html = sentMail().html;
    expect(html).toContain("Maria");
    expect(html).toContain("Skiausfahrt");
  });
});
