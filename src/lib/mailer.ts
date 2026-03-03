import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY ?? "");

const FROM = process.env.SENDGRID_FROM ?? "michbier@gmail.com";
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

async function sendMail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const text = html.replace(/<[^>]+>/g, "").replace(/\n\s*\n/g, "\n");
  await sgMail.send({ from: FROM, to, subject, html, text });
}

// ─── Membership Confirmation ──────────────────────────────────────────────────

export async function sendMembershipConfirmation({
  to,
  person1Name,
  activationToken,
  locale,
}: {
  to: string;
  person1Name: string;
  activationToken: string;
  locale: string;
}) {
  const activationUrl = `${BASE_URL}/${locale}/membership/activate/${activationToken}`;
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 7);
  const expiryStr = expiry.toLocaleDateString(locale === "de" ? "de-DE" : "en-GB");

  const isDE = locale === "de";
  const subject = isDE
    ? "Bitte bestätigen Sie Ihre Mitgliedschaft – Ski-Club Walldorf"
    : "Please confirm your membership – Ski-Club Walldorf";

  const html = isDE
    ? `<p>Guten Tag ${person1Name},</p>
       <p>vielen Dank für Ihre Anmeldung beim Walldorfer Ski-Club 81 e.V.</p>
       <p>Bitte klicken Sie auf den folgenden Link, um Ihre E-Mail-Adresse zu bestätigen:</p>
       <p><a href="${activationUrl}">Mitgliedschaft aktivieren</a></p>
       <p>Dieser Link ist bis zum ${expiryStr} gültig.</p>
       <p>Falls Sie diese Anmeldung nicht veranlasst haben, können Sie diese E-Mail ignorieren.</p>`
    : `<p>Dear ${person1Name},</p>
       <p>Thank you for applying to join Walldorfer Ski-Club 81 e.V.</p>
       <p>Please click the link below to confirm your email address:</p>
       <p><a href="${activationUrl}">Activate membership</a></p>
       <p>This link is valid until ${expiryStr}.</p>
       <p>If you did not initiate this, you can safely ignore this email.</p>`;


  await sendMail({ to, subject, html });
}

// ─── Membership Welcome ───────────────────────────────────────────────────────

export async function sendMembershipWelcome({
  to,
  person1Name,
  memberNumber,
  locale,
}: {
  to: string;
  person1Name: string;
  memberNumber: number;
  locale: string;
}) {
  const isDE = locale === "de";
  const subject = isDE
    ? "Willkommen beim Walldorfer Ski-Club 81 e.V.!"
    : "Welcome to Walldorfer Ski-Club 81 e.V.!";

  const html = isDE
    ? `<p>Herzlich willkommen, ${person1Name}!</p>
       <p>Ihre Mitgliedschaft beim Walldorfer Ski-Club 81 e.V. wurde erfolgreich aktiviert.</p>
       <p>Ihre Mitgliedsnummer lautet: <strong>${memberNumber}</strong></p>
       <p>Wir freuen uns auf Sie!</p>`
    : `<p>Welcome, ${person1Name}!</p>
       <p>Your membership with Walldorfer Ski-Club 81 e.V. has been successfully activated.</p>
       <p>Your member number is: <strong>${memberNumber}</strong></p>
       <p>We look forward to seeing you!</p>`;

  await sendMail({ to, subject, html });
}

// ─── Booking Confirmation ─────────────────────────────────────────────────────

export async function sendBookingConfirmation({
  to,
  person1Name,
  eventTitleDe,
  eventTitleEn,
  startDate,
  locale,
}: {
  to: string;
  person1Name: string;
  eventTitleDe: string;
  eventTitleEn: string;
  startDate: Date;
  locale: string;
}) {
  const isDE = locale === "de";
  const eventTitle = isDE ? eventTitleDe : eventTitleEn;
  const dateStr = startDate.toLocaleDateString(isDE ? "de-DE" : "en-GB");
  const subject = isDE
    ? `Buchungsbestätigung: ${eventTitle}`
    : `Booking confirmation: ${eventTitle}`;

  const html = isDE
    ? `<p>Guten Tag ${person1Name},</p>
       <p>Ihre Anmeldung für <strong>${eventTitle}</strong> (${dateStr}) ist eingegangen.</p>
       <p>Wir melden uns bei Ihnen mit weiteren Details.</p>`
    : `<p>Dear ${person1Name},</p>
       <p>Your registration for <strong>${eventTitle}</strong> (${dateStr}) has been received.</p>
       <p>We will be in touch with further details.</p>`;

  await sendMail({ to, subject, html });
}

// ─── Booking Admin Notification ───────────────────────────────────────────────

export async function sendBookingAdminNotification({
  eventTitleDe,
  bookingId,
  person1Name,
  email,
  participantCount,
}: {
  eventTitleDe: string;
  bookingId: string;
  person1Name: string;
  email: string;
  participantCount: number;
}) {
  const adminEmail = process.env.ADMIN_EMAIL ?? FROM;
  const subject = `Neue Buchung: ${eventTitleDe}`;
  const html = `<p>Neue Buchung eingegangen:</p>
    <ul>
      <li><strong>Veranstaltung:</strong> ${eventTitleDe}</li>
      <li><strong>Buchungs-ID:</strong> ${bookingId}</li>
      <li><strong>Name:</strong> ${person1Name}</li>
      <li><strong>E-Mail:</strong> ${email}</li>
      <li><strong>Teilnehmer:</strong> ${participantCount}</li>
    </ul>`;
  await sendMail({ to: adminEmail, subject, html });
}

// ─── Newsletter ───────────────────────────────────────────────────────────────

export async function sendNewsletterToMember({
  to,
  subjectDe,
  subjectEn,
  bodyDe,
  bodyEn,
  locale,
}: {
  to: string;
  subjectDe: string;
  subjectEn: string;
  bodyDe: string;
  bodyEn: string;
  locale: string;
}) {
  const isDE = locale === "de";
  const subject = isDE ? subjectDe : subjectEn;
  const html = isDE ? bodyDe : bodyEn;
  await sendMail({ to, subject, html });
}

// ─── User Account Verification ────────────────────────────────────────────────

export async function sendUserVerification({
  to,
  firstName,
  verificationUrl,
  locale,
}: {
  to: string;
  firstName: string;
  verificationUrl: string;
  locale: string;
}) {
  const isDE = locale === "de";
  const subject = isDE
    ? "Bitte bestätigen Sie Ihre E-Mail-Adresse – Ski-Club Walldorf"
    : "Please verify your email address – Ski-Club Walldorf";

  const html = isDE
    ? `<p>Guten Tag ${firstName},</p>
       <p>vielen Dank für Ihre Registrierung beim Walldorfer Ski-Club 81.</p>
       <p>Bitte klicken Sie auf den folgenden Link, um Ihre E-Mail-Adresse zu bestätigen (gültig für 24 Stunden):</p>
       <p><a href="${verificationUrl}">E-Mail-Adresse bestätigen</a></p>
       <p>Falls Sie sich nicht registriert haben, können Sie diese E-Mail ignorieren.</p>`
    : `<p>Dear ${firstName},</p>
       <p>Thank you for registering with Walldorfer Ski-Club 81.</p>
       <p>Please click the link below to verify your email address (valid for 24 hours):</p>
       <p><a href="${verificationUrl}">Verify email address</a></p>
       <p>If you did not register, you can safely ignore this email.</p>`;

  await sendMail({ to, subject, html });
}

// ─── Email Change Verification ────────────────────────────────────────────────

export async function sendEmailChangeVerification({
  to,
  firstName,
  verificationUrl,
  locale,
}: {
  to: string;
  firstName: string;
  verificationUrl: string;
  locale: string;
}) {
  const isDE = locale === "de";
  const subject = isDE
    ? "Bitte bestätigen Sie Ihre neue E-Mail-Adresse – Ski-Club Walldorf"
    : "Please confirm your new email address – Ski-Club Walldorf";

  const html = isDE
    ? `<p>Guten Tag ${firstName},</p>
       <p>Sie haben eine Änderung Ihrer E-Mail-Adresse beantragt.</p>
       <p>Bitte klicken Sie auf den folgenden Link, um Ihre neue E-Mail-Adresse zu bestätigen (gültig für 7 Tage):</p>
       <p><a href="${verificationUrl}">Neue E-Mail-Adresse bestätigen</a></p>
       <p>Bis zur Bestätigung bleibt Ihre bisherige E-Mail-Adresse aktiv.</p>
       <p>Falls Sie diese Änderung nicht beantragt haben, können Sie diese E-Mail ignorieren.</p>`
    : `<p>Dear ${firstName},</p>
       <p>You have requested an email address change.</p>
       <p>Please click the link below to confirm your new email address (valid for 7 days):</p>
       <p><a href="${verificationUrl}">Confirm new email address</a></p>
       <p>Your current email address remains active until you confirm the new one.</p>
       <p>If you did not request this change, you can safely ignore this email.</p>`;

  await sendMail({ to, subject, html });
}


export async function sendUserWelcome({
  to,
  firstName,
  locale,
}: {
  to: string;
  firstName: string;
  locale: string;
}) {
  const isDE = locale === "de";
  const subject = isDE
    ? "Willkommen beim Walldorfer Ski-Club 81 e.V.!"
    : "Welcome to Walldorfer Ski-Club 81 e.V.!";

  const html = isDE
    ? `<p>Hallo ${firstName},</p>
       <p>Ihr Konto beim Walldorfer Ski-Club 81 wurde erfolgreich aktiviert.</p>
       <p>Sie können sich jetzt anmelden und Veranstaltungen buchen.</p>
       <p><a href="${BASE_URL}/de/login">Jetzt anmelden</a></p>`
    : `<p>Hello ${firstName},</p>
       <p>Your account with Walldorfer Ski-Club 81 has been successfully verified.</p>
       <p>You can now log in and book events.</p>
       <p><a href="${BASE_URL}/en/login">Sign in now</a></p>`;

  await sendMail({ to, subject, html });
}
