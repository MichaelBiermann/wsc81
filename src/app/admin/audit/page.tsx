"use client";

import { useAdminI18n } from "@/components/admin/AdminI18nProvider";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">{title}</h2>
      {children}
    </section>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-gray-200 bg-white p-5 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function Badge({ color, children }: { color: "green" | "blue" | "yellow" | "red" | "gray"; children: React.ReactNode }) {
  const cls = {
    green: "bg-green-100 text-green-700",
    blue: "bg-blue-100 text-blue-700",
    yellow: "bg-yellow-100 text-yellow-700",
    red: "bg-red-100 text-red-700",
    gray: "bg-gray-100 text-gray-600",
  }[color];
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>{children}</span>;
}

function CheckRow({ label, status, note }: { label: string; status: "ok" | "partial" | "na"; note?: string }) {
  const icon = status === "ok" ? "check_circle" : status === "partial" ? "warning" : "remove_circle";
  const color = status === "ok" ? "text-green-600" : status === "partial" ? "text-yellow-600" : "text-gray-400";
  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50">
      <td className="px-3 py-2 text-sm text-gray-800">{label}</td>
      <td className="px-3 py-2">
        <span className={`material-symbols-rounded ${color}`} style={{ fontSize: 20, fontVariationSettings: "'FILL' 1" }} aria-hidden="true">{icon}</span>
      </td>
      <td className="px-3 py-2 text-xs text-gray-500">{note ?? ""}</td>
    </tr>
  );
}

export default function AuditPage() {
  const { t, locale } = useAdminI18n();
  const isDE = locale === "de";

  return (
    <div className="max-w-5xl">
      <style>{`
        @media print {
          aside, [data-no-print] { display: none !important; }
          main { padding: 0 !important; background: white !important; }
          .max-w-5xl { max-width: none !important; }
          @page { margin: 15mm 12mm; size: A4 portrait; }
          * { background: white !important; box-shadow: none !important; }
          h1, h2, h3, h4 { break-after: avoid; }
          section { break-inside: avoid; }
          tr { break-inside: avoid; }
          .print-break-before { break-before: page; }
        }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-8">
        <div className="flex items-center gap-3">
          <span className="material-symbols-rounded text-amber-600" style={{ fontSize: 32 }} aria-hidden="true">verified_user</span>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{isDE ? "Audit & Compliance" : "Audit & Compliance"}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{isDE ? "WSC 81 — Datenschutz, Sicherheit & Systemnachweise" : "WSC 81 — Data Protection, Security & System Evidence"}</p>
          </div>
        </div>
        <button
          data-no-print
          onClick={() => {
            const date = new Date().toISOString().split("T")[0];
            const prev = document.title;
            document.title = `audit_wsc81_${date}`;
            window.print();
            document.title = prev;
          }}
          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 shadow-sm hover:bg-gray-50 transition-colors flex-shrink-0"
          aria-label={isDE ? "Als PDF exportieren" : "Export as PDF"}
        >
          <span className="material-symbols-rounded" style={{ fontSize: 18 }} aria-hidden="true">picture_as_pdf</span>
          {isDE ? "PDF exportieren" : "Export PDF"}
        </button>
      </div>

      {/* System Identity */}
      <Section title={isDE ? "Systemidentifikation" : "System Identity"}>
        <Card>
          <div className="grid gap-3 sm:grid-cols-2 text-sm">
            {[
              [isDE ? "Systemname" : "System Name", "WSC 81 Vereinsverwaltung"],
              [isDE ? "Betreiber" : "Operator", "Walldorfer Ski-Club 81 e.V., Walldorf, Baden-Württemberg"],
              [isDE ? "Rechtsform" : "Legal Form", "Eingetragener Verein (e.V.)"],
              [isDE ? "Produktions-URL" : "Production URL", "https://wsc81.vercel.app"],
              [isDE ? "Repository" : "Repository", "github.com/MichaelBiermann/wsc81 (privat)"],
              [isDE ? "Deployment-Plattform" : "Deployment Platform", "Vercel (Edge Network, Frankfurt/EU)"],
              [isDE ? "Datenbankregion" : "Database Region", "Neon PostgreSQL — EU West (Frankfurt)"],
              [isDE ? "Framework" : "Framework", "Next.js 16 (App Router, TypeScript)"],
              [isDE ? "Letzte Überprüfung" : "Last Review", new Date().toLocaleDateString(isDE ? "de-DE" : "en-GB")],
              [isDE ? "Klassifizierung" : "Classification", isDE ? "Nicht öffentlich — nur für autorisierte Prüfer" : "Non-public — authorised auditors only"],
            ].map(([label, value]) => (
              <div key={label} className="flex gap-2">
                <span className="font-medium text-gray-600 w-40 flex-shrink-0">{label}</span>
                <span className="text-gray-800">{value}</span>
              </div>
            ))}
          </div>
        </Card>
      </Section>

      {/* GDPR / DSGVO */}
      <Section title={isDE ? "Datenschutz (DSGVO)" : "Data Protection (GDPR)"}>
        <div className="grid gap-4 sm:grid-cols-2 mb-4">
          <Card>
            <h3 className="font-semibold text-sm text-gray-700 mb-3 flex items-center gap-1.5">
              <span className="material-symbols-rounded text-[#4577ac]" style={{ fontSize: 18 }} aria-hidden="true">person</span>
              {isDE ? "Verarbeitete personenbezogene Daten" : "Personal Data Processed"}
            </h3>
            <ul className="text-xs text-gray-600 space-y-1.5">
              <li className="flex gap-2"><Badge color="blue">{isDE ? "Benutzer" : "User"}</Badge> {isDE ? "Name, E-Mail, Geburtsdatum, Adresse, Telefon, Avatar" : "Name, email, date of birth, address, phone, avatar"}</li>
              <li className="flex gap-2"><Badge color="blue">{isDE ? "Mitglied" : "Member"}</Badge> {isDE ? "Wie Benutzer + IBAN (verschlüsselt), BIC, Bankname, Mitgliedsnummer" : "As user + IBAN (encrypted), BIC, bank name, member number"}</li>
              <li className="flex gap-2"><Badge color="blue">{isDE ? "Buchung" : "Booking"}</Badge> {isDE ? "Teilnehmerdaten (Name, DOB) aller Personen, Zimmertyp, Zahlungsstatus" : "Participant data (name, DOB) for all persons, room type, payment status"}</li>
              <li className="flex gap-2"><Badge color="blue">{isDE ? "Support-Ticket" : "Support ticket"}</Badge> {isDE ? "Nachrichteninhalt, Typ, Status (verknüpft mit Benutzerkonto)" : "Message content, type, status (linked to user account)"}</li>
              <li className="flex gap-2"><Badge color="gray">{isDE ? "Admin" : "Admin"}</Badge> {isDE ? "Name, E-Mail (Zugangsdaten)" : "Name, email (credentials only)"}</li>
            </ul>
          </Card>
          <Card>
            <h3 className="font-semibold text-sm text-gray-700 mb-3 flex items-center gap-1.5">
              <span className="material-symbols-rounded text-[#4577ac]" style={{ fontSize: 18 }} aria-hidden="true">policy</span>
              {isDE ? "Rechtsgrundlagen" : "Legal Bases"}
            </h3>
            <ul className="text-xs text-gray-600 space-y-1.5">
              <li>• <strong>{isDE ? "Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO):" : "Contract performance (Art. 6(1)(b) GDPR):"}</strong> {isDE ? "Buchungen, Mitgliedschaft, Zahlungsabwicklung" : "Bookings, membership, payment processing"}</li>
              <li>• <strong>{isDE ? "Einwilligung (Art. 6 Abs. 1 lit. a DSGVO):" : "Consent (Art. 6(1)(a) GDPR):"}</strong> {isDE ? "E-Mail-Verifizierung, Newsletter" : "Email verification, newsletter"}</li>
              <li>• <strong>{isDE ? "Berechtigtes Interesse (Art. 6 Abs. 1 lit. f DSGVO):" : "Legitimate interest (Art. 6(1)(f) GDPR):"}</strong> {isDE ? "Sicherheitslogs, Sitzungsverwaltung" : "Security logs, session management"}</li>
              <li>• <strong>{isDE ? "Rechtliche Verpflichtung (Art. 6 Abs. 1 lit. c DSGVO):" : "Legal obligation (Art. 6(1)(c) GDPR):"}</strong> {isDE ? "Aufbewahrung von Zahlungsdaten (Handelsrecht)" : "Retention of payment data (commercial law)"}</li>
            </ul>
          </Card>
        </div>
        <Card>
          <h3 className="font-semibold text-sm text-gray-700 mb-3 flex items-center gap-1.5">
            <span className="material-symbols-rounded text-[#4577ac]" style={{ fontSize: 18 }} aria-hidden="true">timer</span>
            {isDE ? "Aufbewahrungsfristen & Löschkonzept" : "Retention Periods & Deletion Policy"}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-3 py-2 font-semibold text-gray-600 border-b border-gray-200">{isDE ? "Datenkategorie" : "Data Category"}</th>
                  <th className="text-left px-3 py-2 font-semibold text-gray-600 border-b border-gray-200">{isDE ? "Aufbewahrung" : "Retention"}</th>
                  <th className="text-left px-3 py-2 font-semibold text-gray-600 border-b border-gray-200">{isDE ? "Löschmechanismus" : "Deletion Mechanism"}</th>
                </tr>
              </thead>
              <tbody>
                {[
                  [isDE ? "Ausstehende Mitgliedsanträge (nicht aktiviert)" : "Pending membership applications (not activated)", isDE ? "7 Tage" : "7 days", isDE ? "Automatisch — Cron-Job täglich 03:00 UTC" : "Automatic — cron job daily 03:00 UTC"],
                  [isDE ? "E-Mail-Verifizierungstoken" : "Email verification tokens", isDE ? "24 Stunden" : "24 hours", isDE ? "Automatisch — Cron-Job täglich 03:00 UTC" : "Automatic — cron job daily 03:00 UTC"],
                  [isDE ? "Passwort-Reset-Token" : "Password reset tokens", isDE ? "24 Stunden" : "24 hours", isDE ? "Automatisch — Cron-Job täglich 03:00 UTC" : "Automatic — cron job daily 03:00 UTC"],
                  [isDE ? "Benutzerkonten (aktiv)" : "User accounts (active)", isDE ? "Bis zur Löschung durch Admin" : "Until deleted by admin", isDE ? "Manuell — Admin-Bereich /admin/users" : "Manual — admin area /admin/users"],
                  [isDE ? "Mitgliedsdaten (aktiviert)" : "Member data (activated)", isDE ? "Vereinsrechtlich: mind. 10 Jahre" : "Club law: min. 10 years", isDE ? "Manuell nach Ablauf der Aufbewahrungspflicht" : "Manual after retention period expires"],
                  [isDE ? "Buchungsdaten inkl. Teilnehmer" : "Booking data incl. participants", isDE ? "Steuerrechtlich: 10 Jahre" : "Tax law: 10 years", isDE ? "Manuell durch Admin" : "Manual by admin"],
                  [isDE ? "Zahlungsdaten (Stripe-Referenz)" : "Payment data (Stripe reference)", isDE ? "10 Jahre (§ 147 AO)" : "10 years (§ 147 AO)", isDE ? "Stripe verwaltet Zahlungsdaten eigenständig" : "Stripe manages payment data independently"],
                  [isDE ? "Newsletter-Versandprotokolle" : "Newsletter send logs", isDE ? "Bis zur manuellen Löschung" : "Until manually deleted", isDE ? "Manuell durch Admin" : "Manual by admin"],
                  [isDE ? "IBAN (verschlüsselt)" : "IBAN (encrypted)", isDE ? "Wie Mitgliedsdaten" : "Same as member data", isDE ? "Gemeinsam mit Mitgliedsdatensatz" : "Together with member record"],
                  [isDE ? "Support-Tickets & Nachrichten" : "Support tickets & messages", isDE ? "Bis zur manuellen Löschung" : "Until manually deleted", isDE ? "Manuell durch Admin (cascade löscht Nachrichten)" : "Manual by admin (cascade deletes messages)"],
                ].map(([cat, ret, del]) => (
                  <tr key={cat} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-3 py-1.5 text-gray-800">{cat}</td>
                    <td className="px-3 py-1.5 text-gray-600">{ret}</td>
                    <td className="px-3 py-1.5 text-gray-500">{del}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </Section>

      {/* Security Measures */}
      <Section title={isDE ? "Sicherheitsmaßnahmen" : "Security Measures"}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <h3 className="font-semibold text-sm text-gray-700 mb-3 flex items-center gap-1.5">
              <span className="material-symbols-rounded text-[#4577ac]" style={{ fontSize: 18 }} aria-hidden="true">lock</span>
              {isDE ? "Authentifizierung & Zugriffskontrolle" : "Authentication & Access Control"}
            </h3>
            <ul className="text-xs text-gray-600 space-y-1.5">
              <li>• {isDE ? "Passwörter: bcrypt-Hash (Work Factor 10+) — kein Klartext gespeichert" : "Passwords: bcrypt hash (work factor 10+) — no plaintext stored"}</li>
              <li>• {isDE ? "Sitzungen: NextAuth.js v5 — signierte JWT-Cookies (HttpOnly, Secure, SameSite=Lax)" : "Sessions: NextAuth.js v5 — signed JWT cookies (HttpOnly, Secure, SameSite=Lax)"}</li>
              <li>• {isDE ? "Admin-Bereich: separate Credentials-Provider-Tabelle (AdminUser)" : "Admin area: separate credentials provider table (AdminUser)"}</li>
              <li>• {isDE ? "Rollenbasierte Zugriffskontrolle: admin / member / user" : "Role-based access control: admin / member / user"}</li>
              <li>• {isDE ? "E-Mail-Verifizierung bei Registrierung (48-Byte-Hex-Token, 24 h)" : "Email verification on registration (48-byte hex token, 24 h)"}</li>
              <li>• {isDE ? "Passwort-Reset via E-Mail-Token (48-Byte-Hex, 24 h Ablauf)" : "Password reset via email token (48-byte hex, 24 h expiry)"}</li>
              <li>• {isDE ? "Mitgliedschaftsaktivierung: 48-Byte-Token, 7 Tage Ablauf" : "Membership activation: 48-byte token, 7-day expiry"}</li>
            </ul>
          </Card>
          <Card>
            <h3 className="font-semibold text-sm text-gray-700 mb-3 flex items-center gap-1.5">
              <span className="material-symbols-rounded text-[#4577ac]" style={{ fontSize: 18 }} aria-hidden="true">encrypted</span>
              {isDE ? "Datenverschlüsselung" : "Data Encryption"}
            </h3>
            <ul className="text-xs text-gray-600 space-y-1.5">
              <li>• {isDE ? "Transport: TLS 1.2+ (erzwungen durch Vercel / Neon)" : "Transport: TLS 1.2+ (enforced by Vercel / Neon)"}</li>
              <li>• {isDE ? "IBAN at rest: AES-256-GCM, zufälliger IV pro Verschlüsselungsvorgang" : "IBAN at rest: AES-256-GCM, random IV per encryption operation"}</li>
              <li>• {isDE ? "Verschlüsselungsschlüssel: 32-Byte-Hex aus Umgebungsvariable IBAN_ENCRYPTION_KEY" : "Encryption key: 32-byte hex from env var IBAN_ENCRYPTION_KEY"}</li>
              <li>• {isDE ? "Nur die letzten 4 IBAN-Stellen im Klartext gespeichert (für Anzeige)" : "Only last 4 IBAN digits stored in plaintext (for display)"}</li>
              <li>• {isDE ? "Datenbankverbindung: verschlüsselt via SSL (Neon Serverless)" : "Database connection: encrypted via SSL (Neon serverless)"}</li>
              <li>• {isDE ? "Auth-Secret: NEXTAUTH_SECRET aus Umgebungsvariable (JWT-Signierung)" : "Auth secret: NEXTAUTH_SECRET from env var (JWT signing)"}</li>
            </ul>
          </Card>
          <Card>
            <h3 className="font-semibold text-sm text-gray-700 mb-3 flex items-center gap-1.5">
              <span className="material-symbols-rounded text-[#4577ac]" style={{ fontSize: 18 }} aria-hidden="true">security</span>
              {isDE ? "Anwendungssicherheit" : "Application Security"}
            </h3>
            <ul className="text-xs text-gray-600 space-y-1.5">
              <li>• {isDE ? "Eingabevalidierung: Zod-Schemas auf allen API-Endpunkten" : "Input validation: Zod schemas on all API endpoints"}</li>
              <li>• {isDE ? "SQL-Injection: verhindert durch Prisma ORM (parametrisierte Abfragen)" : "SQL injection: prevented by Prisma ORM (parameterised queries)"}</li>
              <li>• {isDE ? "XSS: Next.js React-Rendering escapet Ausgabe standardmäßig" : "XSS: Next.js React rendering escapes output by default"}</li>
              <li>• {isDE ? "CSRF: SameSite-Cookie-Attribut + NextAuth CSRF-Token" : "CSRF: SameSite cookie attribute + NextAuth CSRF token"}</li>
              <li>• {isDE ? "Stripe-Webhook: HMAC-SHA256-Signaturprüfung (STRIPE_WEBHOOK_SECRET)" : "Stripe webhook: HMAC-SHA256 signature verification (STRIPE_WEBHOOK_SECRET)"}</li>
              <li>• {isDE ? "Cron-Endpunkt: Bearer-Token-Authentifizierung (CRON_SECRET)" : "Cron endpoint: bearer token authentication (CRON_SECRET)"}</li>
              <li>• {isDE ? "Datei-Uploads: ausschließlich Vercel Blob (kein direkter Serverzugriff)" : "File uploads: Vercel Blob only (no direct server access)"}</li>
            </ul>
          </Card>
          <Card>
            <h3 className="font-semibold text-sm text-gray-700 mb-3 flex items-center gap-1.5">
              <span className="material-symbols-rounded text-[#4577ac]" style={{ fontSize: 18 }} aria-hidden="true">key</span>
              {isDE ? "Secrets & Umgebungsvariablen" : "Secrets & Environment Variables"}
            </h3>
            <ul className="text-xs text-gray-600 space-y-1.5">
              <li>• {isDE ? "Alle Secrets ausschließlich in Vercel-Umgebungsvariablen — nie im Code" : "All secrets in Vercel env vars only — never in code"}</li>
              <li>• {isDE ? ".env.local nicht in Git eingecheckt (.gitignore)" : ".env.local not checked into git (.gitignore)"}</li>
              <li>• {isDE ? "Produktionsgeheimnisse: DATABASE_URL, IBAN_ENCRYPTION_KEY, AUTH_SECRET, SENDGRID_API_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, CRON_SECRET, ANTHROPIC_API_KEY, BLOB_READ_WRITE_TOKEN" : "Production secrets: DATABASE_URL, IBAN_ENCRYPTION_KEY, AUTH_SECRET, SENDGRID_API_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, CRON_SECRET, ANTHROPIC_API_KEY, BLOB_READ_WRITE_TOKEN"}</li>
            </ul>
          </Card>
        </div>
      </Section>

      {/* Third-Party Services */}
      <Section title={isDE ? "Drittanbieter & Datenübermittlung" : "Third-Party Services & Data Transfers"}>
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-3 py-2 font-semibold text-gray-600 border-b border-gray-200">{isDE ? "Anbieter" : "Provider"}</th>
                  <th className="text-left px-3 py-2 font-semibold text-gray-600 border-b border-gray-200">{isDE ? "Zweck" : "Purpose"}</th>
                  <th className="text-left px-3 py-2 font-semibold text-gray-600 border-b border-gray-200">{isDE ? "Übermittelte Daten" : "Data Transferred"}</th>
                  <th className="text-left px-3 py-2 font-semibold text-gray-600 border-b border-gray-200">{isDE ? "Region" : "Region"}</th>
                  <th className="text-left px-3 py-2 font-semibold text-gray-600 border-b border-gray-200">{isDE ? "Rechtsgrundlage" : "Legal Basis"}</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Vercel", isDE ? "Hosting & Deployment" : "Hosting & deployment", isDE ? "HTTP-Anfragen, keine personenbezogenen Daten gespeichert" : "HTTP requests, no personal data stored", "EU (Frankfurt)", isDE ? "Art. 6 Abs. 1 lit. b" : "Art. 6(1)(b)"],
                  ["Neon (PostgreSQL)", isDE ? "Datenbankhosting" : "Database hosting", isDE ? "Alle personenbezogenen Daten (verschlüsselt übertragen)" : "All personal data (encrypted in transit)", "EU West (Frankfurt)", isDE ? "Art. 6 Abs. 1 lit. b" : "Art. 6(1)(b)"],
                  ["SendGrid (Twilio)", isDE ? "E-Mail-Versand" : "Email sending", isDE ? "E-Mail-Adresse, Name (Transaktions-E-Mails)" : "Email address, name (transactional emails)", "USA (SCCs)", isDE ? "Art. 6 Abs. 1 lit. b / SCCs" : "Art. 6(1)(b) / SCCs"],
                  ["Stripe", isDE ? "Zahlungsabwicklung" : "Payment processing", isDE ? "Name, E-Mail, Zahlungsdaten (PCI-DSS-Scope bei Stripe)" : "Name, email, payment data (PCI-DSS scope at Stripe)", "USA/EU (SCCs)", isDE ? "Art. 6 Abs. 1 lit. b / SCCs" : "Art. 6(1)(b) / SCCs"],
                  ["Vercel Blob", isDE ? "Avatar-Bildspeicherung" : "Avatar image storage", isDE ? "Profilbilder (kein Personenbezug außer Dateiname)" : "Profile images (no personal data except filename)", "EU", isDE ? "Art. 6 Abs. 1 lit. b" : "Art. 6(1)(b)"],
                  ["Anthropic (Claude)", isDE ? "KI-Assistent (Admin + Öffentlich)" : "AI assistant (admin + public)", isDE ? "Chat-Nachrichten, Datenbankabfrageergebnisse (keine IBAN)" : "Chat messages, DB query results (no IBAN)", "USA (SCCs)", isDE ? "Art. 6 Abs. 1 lit. f / SCCs" : "Art. 6(1)(f) / SCCs"],
                  ["Google Fonts", isDE ? "Icon-Schriftart (Material Symbols)" : "Icon font (Material Symbols)", isDE ? "IP-Adresse (Schriftart-Request)" : "IP address (font request)", "USA (SCCs)", isDE ? "Art. 6 Abs. 1 lit. f / SCCs" : "Art. 6(1)(f) / SCCs"],
                  ["GitHub", isDE ? "Quellcode-Repository (privat)" : "Source code repository (private)", isDE ? "Quellcode (keine personenbezogenen Nutzerdaten)" : "Source code (no user personal data)", "USA (SCCs)", isDE ? "Art. 6 Abs. 1 lit. f" : "Art. 6(1)(f)"],
                ].map(([provider, purpose, data, region, basis]) => (
                  <tr key={provider} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-3 py-1.5 font-medium text-gray-800">{provider}</td>
                    <td className="px-3 py-1.5 text-gray-600">{purpose}</td>
                    <td className="px-3 py-1.5 text-gray-500">{data}</td>
                    <td className="px-3 py-1.5 text-gray-500">{region}</td>
                    <td className="px-3 py-1.5 text-gray-500">{basis}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 mt-3">{isDE ? "SCCs = EU-Standardvertragsklauseln gemäß Durchführungsbeschluss (EU) 2021/914" : "SCCs = EU Standard Contractual Clauses per Commission Decision (EU) 2021/914"}</p>
        </Card>
      </Section>

      {/* Data Flow */}
      <Section title={isDE ? "Datenflüsse" : "Data Flows"} >
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <h3 className="font-semibold text-sm text-gray-700 mb-3 flex items-center gap-1.5">
              <span className="material-symbols-rounded text-[#4577ac]" style={{ fontSize: 18 }} aria-hidden="true">how_to_reg</span>
              {isDE ? "Mitgliedschaft & Registrierung" : "Membership & Registration"}
            </h3>
            <ol className="text-xs text-gray-600 space-y-1 list-decimal pl-4">
              <li>{isDE ? "Nutzer füllt Formular aus (Daten bleiben im Browser bis Submit)" : "User fills form (data stays in browser until submit)"}</li>
              <li>{isDE ? "POST /api/membership — IBAN wird serverseitig mit AES-256-GCM verschlüsselt" : "POST /api/membership — IBAN encrypted server-side with AES-256-GCM"}</li>
              <li>{isDE ? "PendingMembership in DB gespeichert + Aktivierungstoken per E-Mail (SendGrid)" : "PendingMembership stored in DB + activation token sent via email (SendGrid)"}</li>
              <li>{isDE ? "Aktivierung: Token-Link oder Admin-Klick → Member-Datensatz erstellt, User.memberId verknüpft" : "Activation: token link or admin click → Member record created, User.memberId linked"}</li>
              <li>{isDE ? "Willkommens-E-Mail via SendGrid" : "Welcome email via SendGrid"}</li>
              <li>{isDE ? "Cron löscht abgelaufene PendingMemberships (7 Tage)" : "Cron deletes expired PendingMemberships (7 days)"}</li>
            </ol>
          </Card>
          <Card>
            <h3 className="font-semibold text-sm text-gray-700 mb-3 flex items-center gap-1.5">
              <span className="material-symbols-rounded text-[#4577ac]" style={{ fontSize: 18 }} aria-hidden="true">credit_card</span>
              {isDE ? "Zahlungsfluss (Stripe Checkout)" : "Payment Flow (Stripe Checkout)"}
            </h3>
            <ol className="text-xs text-gray-600 space-y-1 list-decimal pl-4">
              <li>{isDE ? "Nutzer wählt Veranstaltung + Teilnehmer im Buchungsformular" : "User selects event + participants in booking form"}</li>
              <li>{isDE ? "POST /api/booking/checkout — Stripe Checkout Session wird serverseitig erstellt" : "POST /api/booking/checkout — Stripe Checkout Session created server-side"}</li>
              <li>{isDE ? "Weiterleitunng zu Stripe (Kartendaten verlassen nie die WSC-81-Infrastruktur)" : "Redirect to Stripe (card data never enters WSC 81 infrastructure)"}</li>
              <li>{isDE ? "Nach Zahlung: Stripe sendet checkout.session.completed-Webhook" : "After payment: Stripe sends checkout.session.completed webhook"}</li>
              <li>{isDE ? "Webhook-Signatur verifiziert (HMAC-SHA256) → EventBooking in DB erstellt" : "Webhook signature verified (HMAC-SHA256) → EventBooking created in DB"}</li>
              <li>{isDE ? "Bestätigungs-E-Mail an Nutzer + Benachrichtigung an Admin (SendGrid)" : "Confirmation email to user + notification to admin (SendGrid)"}</li>
            </ol>
          </Card>
          <Card>
            <h3 className="font-semibold text-sm text-gray-700 mb-3 flex items-center gap-1.5">
              <span className="material-symbols-rounded text-[#4577ac]" style={{ fontSize: 18 }} aria-hidden="true">support_agent</span>
              {isDE ? "Support-Ticket-Ablauf" : "Support Ticket Flow"}
            </h3>
            <ol className="text-xs text-gray-600 space-y-1 list-decimal pl-4">
              <li>{isDE ? "Eingeloggter Nutzer öffnet /support und sendet Ticket (Typ, Betreff, Text)" : "Logged-in user opens /support and submits ticket (type, subject, body)"}</li>
              <li>{isDE ? "POST /api/support — Zod-Validierung, Auth-Check — SupportTicket in DB gespeichert" : "POST /api/support — Zod validation, auth check — SupportTicket stored in DB"}</li>
              <li>{isDE ? "E-Mail-Benachrichtigung an ADMIN_EMAIL mit Reply-To: user@email (SendGrid)" : "Email notification to ADMIN_EMAIL with Reply-To: user@email (SendGrid)"}</li>
              <li>{isDE ? "Admin antwortet im Admin-Bereich /admin/support — POST /api/admin/support/[id]/reply" : "Admin replies in admin area /admin/support — POST /api/admin/support/[id]/reply"}</li>
              <li>{isDE ? "Status OPEN → IN_PROGRESS bei erster Admin-Antwort; Admin kann manuell auf CLOSED setzen" : "Status OPEN → IN_PROGRESS on first admin reply; admin can manually set CLOSED"}</li>
              <li>{isDE ? "E-Mail an Nutzer mit Reply-To: ADMIN_EMAIL — weiterer Austausch direkt per E-Mail möglich" : "Email to user with Reply-To: ADMIN_EMAIL — further exchange possible directly by email"}</li>
            </ol>
          </Card>
        </div>
      </Section>
      <Section title={isDE ? "Zugriffsrechte-Matrix" : "Access Control Matrix"}>
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-3 py-2 font-semibold text-gray-600 border-b border-gray-200">{isDE ? "Bereich / Ressource" : "Area / Resource"}</th>
                  <th className="text-center px-3 py-2 font-semibold text-gray-600 border-b border-gray-200">{isDE ? "Anonym" : "Anonymous"}</th>
                  <th className="text-center px-3 py-2 font-semibold text-gray-600 border-b border-gray-200">{isDE ? "Benutzer" : "User"}</th>
                  <th className="text-center px-3 py-2 font-semibold text-gray-600 border-b border-gray-200">{isDE ? "Mitglied" : "Member"}</th>
                  <th className="text-center px-3 py-2 font-semibold text-gray-600 border-b border-gray-200">Admin</th>
                </tr>
              </thead>
              <tbody>
                {([
                  [isDE ? "Öffentliche Website (Lesen)" : "Public website (read)", "ok", "ok", "ok", "ok"],
                  [isDE ? "Buchungsformular" : "Booking form", "ok", "ok", "ok", "ok"],
                  [isDE ? "Benutzerkonto /account" : "User account /account", "na", "ok", "ok", "ok"],
                  [isDE ? "Eigene Buchungshistorie" : "Own booking history", "na", "ok", "ok", "ok"],
                  [isDE ? "Support-Ticket einreichen /support" : "Submit support ticket /support", "na", "ok", "ok", "na"],
                  [isDE ? "Support-Tickets einsehen & beantworten" : "View & reply to support tickets", "na", "na", "na", "ok"],
                  [isDE ? "Admin-Dashboard" : "Admin dashboard", "na", "na", "na", "ok"],
                  [isDE ? "Alle Buchungen einsehen" : "View all bookings", "na", "na", "na", "ok"],
                  [isDE ? "Mitgliedsdaten (inkl. IBAN)" : "Member data (incl. IBAN)", "na", "na", "na", "ok"],
                  [isDE ? "Benutzerkonten verwalten" : "Manage user accounts", "na", "na", "na", "ok"],
                  [isDE ? "Veranstaltungen erstellen/löschen" : "Create/delete events", "na", "na", "na", "ok"],
                  [isDE ? "Newsletter versenden" : "Send newsletter", "na", "na", "na", "ok"],
                  [isDE ? "Audit-Seite" : "Audit page", "na", "na", "na", "ok"],
                  [isDE ? "Entwickler-Portal" : "Developer portal", "na", "na", "na", "ok"],
                  [isDE ? "API /api/admin/*" : "API /api/admin/*", "na", "na", "na", "ok"],
                  [isDE ? "Cron /api/cron/cleanup" : "Cron /api/cron/cleanup", "na", "na", "na", isDE ? "Bearer Token" : "Bearer token"],
                ] as [string, string, string, string, string][]).map(([area, anon, user, member, admin]) => {
                  const cell = (v: string) => {
                    if (v === "ok") return <span className="material-symbols-rounded text-green-600" style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }} aria-hidden="true">check_circle</span>;
                    if (v === "na") return <span className="material-symbols-rounded text-gray-300" style={{ fontSize: 16, fontVariationSettings: "'FILL' 0" }} aria-hidden="true">cancel</span>;
                    return <span className="text-blue-600 font-medium">{v}</span>;
                  };
                  return (
                    <tr key={area} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-1.5 text-gray-800">{area}</td>
                      <td className="px-3 py-1.5 text-center">{cell(anon)}</td>
                      <td className="px-3 py-1.5 text-center">{cell(user)}</td>
                      <td className="px-3 py-1.5 text-center">{cell(member)}</td>
                      <td className="px-3 py-1.5 text-center">{cell(admin)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </Section>

      {/* Compliance Checklist */}
      <Section title={isDE ? "Compliance-Checkliste" : "Compliance Checklist"}>
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-3 py-2 font-semibold text-gray-600 border-b border-gray-200">{isDE ? "Anforderung" : "Requirement"}</th>
                  <th className="text-center px-3 py-2 font-semibold text-gray-600 border-b border-gray-200">{isDE ? "Status" : "Status"}</th>
                  <th className="text-left px-3 py-2 font-semibold text-gray-600 border-b border-gray-200">{isDE ? "Umsetzung / Hinweis" : "Implementation / Note"}</th>
                </tr>
              </thead>
              <tbody>
                <CheckRow label={isDE ? "Passwörter gehasht (nicht im Klartext gespeichert)" : "Passwords hashed (not stored in plaintext)"} status="ok" note="bcrypt, work factor 10+" />
                <CheckRow label={isDE ? "Verschlüsselung sensibler Daten at rest (IBAN)" : "Encryption of sensitive data at rest (IBAN)"} status="ok" note="AES-256-GCM, random IV" />
                <CheckRow label={isDE ? "Verschlüsselung in transit (TLS)" : "Encryption in transit (TLS)"} status="ok" note="TLS 1.2+ via Vercel + Neon" />
                <CheckRow label={isDE ? "E-Mail-Verifizierung bei Registrierung" : "Email verification on registration"} status="ok" note="48-byte hex token, 24 h" />
                <CheckRow label={isDE ? "Automatische Löschung abgelaufener Tokens/Anträge" : "Automatic deletion of expired tokens/applications"} status="ok" note={isDE ? "Cron täglich 03:00 UTC" : "Cron daily 03:00 UTC"} />
                <CheckRow label={isDE ? "Rollenbasierte Zugriffskontrolle" : "Role-based access control"} status="ok" note="admin / member / user" />
                <CheckRow label={isDE ? "Zahlungsabwicklung PCI-DSS-konform" : "Payment processing PCI-DSS compliant"} status="ok" note={isDE ? "Kein Kartendatenkontakt — Stripe Checkout" : "No card data contact — Stripe Checkout"} />
                <CheckRow label={isDE ? "Webhook-Signaturvalidierung (Stripe)" : "Webhook signature validation (Stripe)"} status="ok" note="HMAC-SHA256" />
                <CheckRow label={isDE ? "Datenschutzerklärung veröffentlicht" : "Privacy policy published"} status="ok" note="/datenschutz" />
                <CheckRow label={isDE ? "AGB veröffentlicht" : "Terms of service published"} status="ok" note="/agb" />
                <CheckRow label={isDE ? "Impressum veröffentlicht" : "Legal notice published"} status="ok" note="/impressum" />
                <CheckRow label={isDE ? "SEPA-Einwilligung bei Mitgliedschaft eingeholt" : "SEPA consent collected during membership"} status="ok" note={isDE ? "Explizites Checkbox-Feld im Formular" : "Explicit checkbox in form"} />
                <CheckRow label={isDE ? "Drittanbieter-Verträge (DPA) mit EU-Standardklauseln" : "Third-party DPA with EU Standard Contractual Clauses"} status="partial" note={isDE ? "Vercel, Neon: EU-Region; SendGrid, Stripe, Anthropic: USA + SCCs" : "Vercel, Neon: EU region; SendGrid, Stripe, Anthropic: USA + SCCs"} />
                <CheckRow label={isDE ? "Verarbeitungsverzeichnis (VVT) nach Art. 30 DSGVO" : "Record of processing activities (Art. 30 GDPR)"} status="partial" note={isDE ? "Diese Seite dokumentiert Verarbeitungstätigkeiten; formelles VVT-Dokument gesondert zu führen" : "This page documents processing; formal RoPA document to be maintained separately"} />
                <CheckRow label={isDE ? "Auftragsverarbeitungsverträge (AVV) abgeschlossen" : "Data processing agreements (DPA) concluded"} status="partial" note={isDE ? "Vercel, Neon, SendGrid, Stripe bieten DPA an — Abschluss durch Betreiber zu bestätigen" : "Vercel, Neon, SendGrid, Stripe offer DPA — operator to confirm conclusion"} />
                <CheckRow label={isDE ? "Zugriffsprotokollierung / Audit-Log" : "Access logging / audit log"} status="partial" note={isDE ? "Vercel-Infrastruktur-Logs vorhanden; kein anwendungsseitiges Audit-Log implementiert" : "Vercel infrastructure logs available; no application-level audit log implemented"} />
                <CheckRow label={isDE ? "Backup & Wiederherstellung dokumentiert" : "Backup & recovery documented"} status="partial" note={isDE ? "Neon Point-in-Time Recovery (PITR) verfügbar; Backup-Intervall durch Neon-Plan bestimmt" : "Neon Point-in-Time Recovery (PITR) available; backup interval determined by Neon plan"} />
                <CheckRow label={isDE ? "Penetrationstest durchgeführt" : "Penetration test performed"} status="na" note={isDE ? "Noch nicht durchgeführt" : "Not yet performed"} />
                <CheckRow label={isDE ? "Datenschutz-Folgenabschätzung (DSFA/DPIA)" : "Data Protection Impact Assessment (DPIA)"} status="na" note={isDE ? "Noch nicht durchgeführt (empfohlen bei IBAN-Verarbeitung)" : "Not yet performed (recommended for IBAN processing)"} />
              </tbody>
            </table>
          </div>
          <div className="flex gap-4 mt-3 text-xs text-gray-500">
            <span className="flex items-center gap-1"><span className="material-symbols-rounded text-green-600" style={{ fontSize: 14, fontVariationSettings: "'FILL' 1" }}>check_circle</span> {isDE ? "Implementiert" : "Implemented"}</span>
            <span className="flex items-center gap-1"><span className="material-symbols-rounded text-yellow-600" style={{ fontSize: 14, fontVariationSettings: "'FILL' 1" }}>warning</span> {isDE ? "Teilweise / Hinweis" : "Partial / Note"}</span>
            <span className="flex items-center gap-1"><span className="material-symbols-rounded text-gray-400" style={{ fontSize: 14, fontVariationSettings: "'FILL' 0" }}>remove_circle</span> {isDE ? "Nicht implementiert" : "Not implemented"}</span>
          </div>
        </Card>
      </Section>

      {/* Infrastructure */}
      <Section title={isDE ? "Infrastruktur & Verfügbarkeit" : "Infrastructure & Availability"}>
        <Card>
          <div className="grid gap-3 sm:grid-cols-2 text-xs text-gray-600">
            {[
              [isDE ? "Hosting" : "Hosting", isDE ? "Vercel — Serverless Edge Network, automatisches Failover" : "Vercel — serverless edge network, automatic failover"],
              [isDE ? "Datenbankregion" : "Database region", "Neon — eu-west-1 (Frankfurt, Deutschland)"],
              [isDE ? "Datenbanktyp" : "Database type", "PostgreSQL 16 (Neon Serverless, connection pooling via pgBouncer)"],
              [isDE ? "Skalierung" : "Scaling", isDE ? "Automatisch (Vercel Serverless Functions + Neon Autoscaling)" : "Automatic (Vercel serverless functions + Neon autoscaling)"],
              [isDE ? "Backup" : "Backup", isDE ? "Neon PITR (Point-in-Time Recovery) — Wiederherstellung bis zu 7 Tage" : "Neon PITR (point-in-time recovery) — restore up to 7 days"],
              [isDE ? "Geplante Wartungszeiten" : "Planned maintenance windows", isDE ? "Keine (serverless, rollende Deployments ohne Downtime)" : "None (serverless, rolling deployments with zero downtime)"],
              [isDE ? "SLA" : "SLA", isDE ? "Vercel: 99,99 % uptime SLA (Enterprise); Neon: 99,95 % (Serverless)" : "Vercel: 99.99% uptime SLA (Enterprise); Neon: 99.95% (serverless)"],
              [isDE ? "Cron-Job" : "Cron job", isDE ? "Vercel Cron — täglich 03:00 UTC — bereinigt abgelaufene Tokens & Anträge" : "Vercel cron — daily 03:00 UTC — cleans up expired tokens & applications"],
            ].map(([label, value]) => (
              <div key={label} className="flex gap-2">
                <span className="font-medium text-gray-600 w-44 flex-shrink-0">{label}</span>
                <span className="text-gray-800">{value}</span>
              </div>
            ))}
          </div>
        </Card>
      </Section>
    </div>
  );
}
