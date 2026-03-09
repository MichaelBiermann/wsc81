import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY ?? "");

const FROM = process.env.SENDGRID_FROM ?? "michbier@gmail.com";
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

async function sendMail({ to, subject, html, replyTo }: { to: string; subject: string; html: string; replyTo?: string }) {
  const text = html.replace(/<[^>]+>/g, "").replace(/\n\s*\n/g, "\n");
  await sgMail.send({ from: FROM, to, subject, html, text, ...(replyTo ? { replyTo } : {}) });
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

// ─── Membership Account Created (auto-created user account) ───────────────────

export async function sendMembershipAccountCreated({
  to,
  person1Name,
  activationToken,
  otp,
  locale,
}: {
  to: string;
  person1Name: string;
  activationToken: string;
  otp: string;
  locale: string;
}) {
  const activationUrl = `${BASE_URL}/${locale}/membership/activate/${activationToken}`;
  const loginUrl = `${BASE_URL}/${locale}/login`;
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 7);
  const expiryStr = expiry.toLocaleDateString(locale === "de" ? "de-DE" : "en-GB");

  const isDE = locale === "de";
  const subject = isDE
    ? "Willkommen beim Ski-Club Walldorf – Bitte bestätigen Sie Ihre Anmeldung"
    : "Welcome to Ski-Club Walldorf – Please confirm your registration";

  const html = isDE
    ? `<p>Guten Tag ${person1Name},</p>
       <p>vielen Dank für Ihre Anmeldung beim Walldorfer Ski-Club 81 e.V.</p>
       <p>Wir haben für Sie automatisch ein Benutzerkonto angelegt. Bitte klicken Sie auf den folgenden Link, um Ihre E-Mail-Adresse zu bestätigen und Ihre Mitgliedschaft zu aktivieren:</p>
       <p><a href="${activationUrl}">Mitgliedschaft aktivieren &amp; E-Mail bestätigen</a></p>
       <p>Dieser Link ist bis zum ${expiryStr} gültig.</p>
       <p>Nach der Bestätigung können Sie sich mit folgenden Zugangsdaten anmelden:</p>
       <p><strong>E-Mail:</strong> ${to}<br/>
       <strong>Einmalpasswort:</strong> <code style="background:#f3f4f6;padding:2px 6px;border-radius:4px;">${otp}</code></p>
       <p>Sie werden beim ersten Login aufgefordert, ein neues Passwort zu vergeben.</p>
       <p><a href="${loginUrl}">Jetzt anmelden</a></p>
       <p>Falls Sie diese Anmeldung nicht veranlasst haben, können Sie diese E-Mail ignorieren.</p>`
    : `<p>Dear ${person1Name},</p>
       <p>Thank you for applying to join Walldorfer Ski-Club 81 e.V.</p>
       <p>We have automatically created a user account for you. Please click the link below to confirm your email address and activate your membership:</p>
       <p><a href="${activationUrl}">Activate membership &amp; confirm email</a></p>
       <p>This link is valid until ${expiryStr}.</p>
       <p>After confirmation you can log in with the following credentials:</p>
       <p><strong>Email:</strong> ${to}<br/>
       <strong>One-time password:</strong> <code style="background:#f3f4f6;padding:2px 6px;border-radius:4px;">${otp}</code></p>
       <p>You will be asked to set a new password on first login.</p>
       <p><a href="${loginUrl}">Sign in now</a></p>
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
  depositAmount,
  totalAmount,
}: {
  to: string;
  person1Name: string;
  eventTitleDe: string;
  eventTitleEn: string;
  startDate: Date;
  locale: string;
  depositAmount?: number;
  totalAmount?: number;
}) {
  const isDE = locale === "de";
  const eventTitle = isDE ? eventTitleDe : eventTitleEn;
  const dateStr = startDate.toLocaleDateString(isDE ? "de-DE" : "en-GB");
  const subject = isDE
    ? `Buchungsbestätigung: ${eventTitle}`
    : `Booking confirmation: ${eventTitle}`;

  const paymentInfo = depositAmount && totalAmount
    ? isDE
      ? `<p>Anzahlung bezahlt: <strong>€${depositAmount.toFixed(2)}</strong><br>Verbleibender Betrag: <strong>€${(totalAmount - depositAmount).toFixed(2)}</strong><br>Gesamtbetrag: <strong>€${totalAmount.toFixed(2)}</strong></p>`
      : `<p>Deposit paid: <strong>€${depositAmount.toFixed(2)}</strong><br>Remaining balance: <strong>€${(totalAmount - depositAmount).toFixed(2)}</strong><br>Total: <strong>€${totalAmount.toFixed(2)}</strong></p>`
    : "";

  const html = isDE
    ? `<p>Guten Tag ${person1Name},</p>
       <p>Ihre Anmeldung für <strong>${eventTitle}</strong> (${dateStr}) ist eingegangen.</p>
       ${paymentInfo}
       <p>Wir melden uns bei Ihnen mit weiteren Details.</p>`
    : `<p>Dear ${person1Name},</p>
       <p>Your registration for <strong>${eventTitle}</strong> (${dateStr}) has been received.</p>
       ${paymentInfo}
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

// ─── Booking Cancellation ─────────────────────────────────────────────────────

export async function sendBookingCancellation({
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
    ? `Stornierung Ihrer Buchung: ${eventTitle}`
    : `Your booking has been cancelled: ${eventTitle}`;

  const html = isDE
    ? `<p>Guten Tag ${person1Name},</p>
       <p>Ihre Buchung für <strong>${eventTitle}</strong> (${dateStr}) wurde vom Administrator storniert.</p>
       <p>Bei Fragen wenden Sie sich bitte direkt an uns.</p>`
    : `<p>Dear ${person1Name},</p>
       <p>Your booking for <strong>${eventTitle}</strong> (${dateStr}) has been cancelled by the administrator.</p>
       <p>Please contact us directly if you have any questions.</p>`;

  await sendMail({ to, subject, html });
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


// ─── Password Reset ───────────────────────────────────────────────────────────

export async function sendPasswordReset({
  to,
  firstName,
  resetUrl,
  locale,
}: {
  to: string;
  firstName: string;
  resetUrl: string;
  locale: string;
}) {
  const isDE = locale === "de";
  const subject = isDE
    ? "Passwort zurücksetzen – Ski-Club Walldorf"
    : "Reset your password – Ski-Club Walldorf";

  const html = isDE
    ? `<p>Guten Tag ${firstName},</p>
       <p>Sie haben eine Anfrage zum Zurücksetzen Ihres Passworts gestellt.</p>
       <p>Bitte klicken Sie auf den folgenden Link (gültig für 1 Stunde):</p>
       <p><a href="${resetUrl}">Passwort zurücksetzen</a></p>
       <p>Falls Sie diese Anfrage nicht gestellt haben, können Sie diese E-Mail ignorieren.</p>`
    : `<p>Dear ${firstName},</p>
       <p>You have requested to reset your password.</p>
       <p>Please click the link below (valid for 1 hour):</p>
       <p><a href="${resetUrl}">Reset password</a></p>
       <p>If you did not request this, you can safely ignore this email.</p>`;

  await sendMail({ to, subject, html });
}

// ─── User Welcome ─────────────────────────────────────────────────────────────

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

// ─── Support Tickets ──────────────────────────────────────────────────────────

export async function sendTicketCreatedToAdmin({
  ticketId,
  subject,
  body,
  type,
  userName,
  userEmail,
}: {
  ticketId: string;
  subject: string;
  body: string;
  type: string;
  userName: string;
  userEmail: string;
}) {
  const adminEmail = process.env.ADMIN_EMAIL ?? FROM;
  const shortId = ticketId.slice(-8);
  const typeLabel: Record<string, string> = { BUG: "Fehler", FEATURE: "Feature", QUESTION: "Frage", OTHER: "Sonstiges" };
  const emailSubject = `[WSC 81 Support] #${shortId} — ${subject}`;
  const html = `<p>Neue Support-Anfrage von <strong>${userName}</strong> (${userEmail}):</p>
    <table style="border-collapse:collapse;width:100%;max-width:600px;margin-bottom:12px">
      <tr><td style="padding:4px 8px;font-weight:bold;white-space:nowrap">Typ:</td><td style="padding:4px 8px">${typeLabel[type] ?? type}</td></tr>
      <tr><td style="padding:4px 8px;font-weight:bold;white-space:nowrap">Betreff:</td><td style="padding:4px 8px">${subject}</td></tr>
      <tr><td style="padding:4px 8px;font-weight:bold;white-space:nowrap">Ticket-ID:</td><td style="padding:4px 8px">${ticketId}</td></tr>
    </table>
    <p style="white-space:pre-wrap">${body}</p>
    <hr style="margin:16px 0"/>
    <p style="color:#666;font-size:13px">Antworten Sie direkt auf diese E-Mail, um den Benutzer zu kontaktieren. Oder öffnen Sie das Ticket im Admin-Panel: ${BASE_URL}/admin/support</p>`;
  await sendMail({ to: adminEmail, subject: emailSubject, html, replyTo: userEmail });
}

export async function sendTicketReplyToUser({
  to,
  userName,
  ticketSubject,
  ticketId,
  adminReply,
  locale,
}: {
  to: string;
  userName: string;
  ticketSubject: string;
  ticketId: string;
  adminReply: string;
  locale: string;
}) {
  const adminEmail = process.env.ADMIN_EMAIL ?? FROM;
  const shortId = ticketId.slice(-8);
  const isDE = locale === "de";
  const emailSubject = `Re: [WSC 81 Support] #${shortId} — ${ticketSubject}`;
  const html = isDE
    ? `<p>Hallo ${userName},</p>
       <p>der Admin hat auf Ihre Support-Anfrage geantwortet:</p>
       <blockquote style="border-left:3px solid #4577ac;padding-left:12px;margin:12px 0;color:#333">
         <p style="white-space:pre-wrap">${adminReply}</p>
       </blockquote>
       <p>Sie können direkt auf diese E-Mail antworten.</p>
       <p style="color:#666;font-size:13px">Ticket-ID: ${ticketId}</p>`
    : `<p>Hello ${userName},</p>
       <p>The admin has replied to your support request:</p>
       <blockquote style="border-left:3px solid #4577ac;padding-left:12px;margin:12px 0;color:#333">
         <p style="white-space:pre-wrap">${adminReply}</p>
       </blockquote>
       <p>You can reply directly to this email.</p>
       <p style="color:#666;font-size:13px">Ticket ID: ${ticketId}</p>`;
  await sendMail({ to, subject: emailSubject, html, replyTo: adminEmail });
}

export async function sendRemainingBalanceReminder({
  to,
  person1Name,
  eventTitleDe,
  eventTitleEn,
  startDate,
  depositAmount,
  remainingAmount,
  totalAmount,
  locale,
}: {
  to: string;
  person1Name: string;
  eventTitleDe: string;
  eventTitleEn: string;
  startDate: Date;
  depositAmount: number;
  remainingAmount: number;
  totalAmount: number;
  locale: string;
}) {
  const isDE = locale === "de";
  const eventTitle = isDE ? eventTitleDe : eventTitleEn;
  const dateStr = startDate.toLocaleDateString(isDE ? "de-DE" : "en-GB");
  const subject = isDE
    ? `Restbetrag fällig: ${eventTitle}`
    : `Remaining balance due: ${eventTitle}`;

  const html = isDE
    ? `<p>Guten Tag ${person1Name},</p>
       <p>Vielen Dank für Ihre Anzahlung für <strong>${eventTitle}</strong> (${dateStr}).</p>
       <p>Bitte überweisen Sie den Restbetrag rechtzeitig vor der Veranstaltung:</p>
       <table style="border-collapse:collapse;width:100%;max-width:400px">
         <tr><td style="padding:4px 8px">Anzahlung (bezahlt):</td><td style="padding:4px 8px;text-align:right">€${depositAmount.toFixed(2)}</td></tr>
         <tr><td style="padding:4px 8px;font-weight:bold">Restbetrag:</td><td style="padding:4px 8px;text-align:right;font-weight:bold">€${remainingAmount.toFixed(2)}</td></tr>
         <tr style="border-top:1px solid #ccc"><td style="padding:4px 8px">Gesamtbetrag:</td><td style="padding:4px 8px;text-align:right">€${totalAmount.toFixed(2)}</td></tr>
       </table>
       <p>Bitte überweisen Sie den Restbetrag auf folgendes Konto:<br>
       <strong>Walldorfer Ski-Club 81 e.V.</strong><br>
       Verwendungszweck: ${eventTitle} – ${person1Name}</p>
       <p>Bei Fragen wenden Sie sich bitte an <a href="mailto:vorstand@wsc81.de">vorstand@wsc81.de</a>.</p>`
    : `<p>Dear ${person1Name},</p>
       <p>Thank you for your deposit for <strong>${eventTitle}</strong> (${dateStr}).</p>
       <p>Please transfer the remaining balance before the event:</p>
       <table style="border-collapse:collapse;width:100%;max-width:400px">
         <tr><td style="padding:4px 8px">Deposit (paid):</td><td style="padding:4px 8px;text-align:right">€${depositAmount.toFixed(2)}</td></tr>
         <tr><td style="padding:4px 8px;font-weight:bold">Remaining balance:</td><td style="padding:4px 8px;text-align:right;font-weight:bold">€${remainingAmount.toFixed(2)}</td></tr>
         <tr style="border-top:1px solid #ccc"><td style="padding:4px 8px">Total:</td><td style="padding:4px 8px;text-align:right">€${totalAmount.toFixed(2)}</td></tr>
       </table>
       <p>Please transfer the remaining balance to:<br>
       <strong>Walldorfer Ski-Club 81 e.V.</strong><br>
       Reference: ${eventTitle} – ${person1Name}</p>
       <p>For questions please contact <a href="mailto:vorstand@wsc81.de">vorstand@wsc81.de</a>.</p>`;

  await sendMail({ to, subject, html });
}
