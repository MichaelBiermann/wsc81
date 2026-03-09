"use client";

import dynamic from "next/dynamic";
import DevChatPanel from "@/components/admin/DevChatPanel";
import { useAdminI18n } from "@/components/admin/AdminI18nProvider";

const MermaidDiagram = dynamic(() => import("@/components/admin/MermaidDiagram"), { ssr: false });

const COMPONENT_DIAGRAM = `graph TD
  subgraph Public["Public Site"]
    PL["layout.tsx - Nav + PublicChatPanel"]
    HP["page.tsx - Homepage"]
    EV["events/id/page.tsx"]
    ACC["account/page.tsx"]
    MEM["membership/page.tsx"]
    SR["search/page.tsx"]
  end

  subgraph Admin["Admin Area"]
    AL["layout.tsx - AdminSidebar + AdminChatPanel"]
    AD["page.tsx - Dashboard"]
    AEV["events/"]
    AMEM["members/"]
    ADEV["developer/ - DevChatPanel + Diagrams"]
  end

  subgraph API["API Routes"]
    AB["booking/route.ts"]
    ACO["booking/checkout/route.ts"]
    AST["webhooks/stripe/route.ts"]
    ACH["admin/chat/route.ts"]
    ADC["admin/developer-chat/route.ts"]
    PCH["chat/route.ts"]
    SRCH["search/route.ts"]
    FE["forms/events/route.ts"]
  end

  subgraph Lib["Shared Libraries"]
    PR["prisma.ts"]
    ML["mailer.ts"]
    CT["chat-tools.ts"]
    PCT["public-chat-tools.ts"]
    SCH["search.ts"]
    ANT["Anthropic API"]
  end

  PL --> HP
  PL --> EV
  PL --> ACC
  PL --> MEM
  PL --> SR
  AL --> AD
  AL --> AEV
  AL --> AMEM
  AL --> ADEV
  AB --> PR
  ACO --> PR
  ACH --> PR
  ADC --> ANT
  PCH --> PR
  SRCH --> PR
  FE --> PR
  AB --> ML
  AST --> ML
  AST --> PR
  ACH --> CT
  PCH --> PCT
  SRCH --> SCH
  CT --> PR
  PCT --> PR`;

const DB_DIAGRAM = `erDiagram
  AdminUser {
    string id PK
    string email UK
    string passwordHash
    string name
    datetime createdAt
  }

  User {
    string id PK
    string email UK
    string passwordHash
    string firstName
    string lastName
    date dob
    string street
    string postalCode
    string city
    string phone
    boolean emailVerified
    string verificationToken UK
    datetime tokenExpiresAt
    string memberId UK "FK -> Member"
    string pendingEmail
    string pendingEmailToken UK
    datetime pendingEmailExpiresAt
    string passwordResetToken UK
    datetime passwordResetExpiresAt
    string avatarUrl
    boolean mustChangePassword
    datetime createdAt
  }

  Member {
    string id PK
    int memberNumber UK
    string category "FAMILIE|ERWACHSENE|JUGENDLICHE|SENIOREN|GDB"
    string person1Name
    date person1Dob
    string personNName "person2..10 optional"
    string street
    string postalCode
    string city
    string phone
    string email UK
    string bankName
    string ibanEncrypted
    string ibanLast4
    string bic
    boolean feesPaid
    datetime activatedAt
    datetime createdAt
  }

  PendingMembership {
    string id PK
    string category "FAMILIE|ERWACHSENE|..."
    string person1Name
    date person1Dob
    string personNName "person2..10 optional"
    string street
    string postalCode
    string city
    string phone
    string email UK
    string bankName
    string ibanEncrypted
    string ibanLast4
    string bic
    boolean consentData
    boolean consentCancellation
    boolean consentBylaws
    string activationToken UK
    datetime tokenExpiresAt
    datetime createdAt
  }

  Event {
    string id PK
    string titleDe
    string titleEn
    string descriptionDe
    string descriptionEn
    string location
    datetime startDate
    datetime endDate
    decimal depositAmount
    decimal totalAmount
    string imageUrl
    int maxParticipants
    datetime registrationDeadline
    boolean bookable
    decimal surchargeNonMemberAdult
    decimal surchargeNonMemberChild
    decimal busSurcharge
    decimal roomSingleSurcharge
    decimal roomDoubleSurcharge
    json agePrices
    datetime createdAt
    datetime updatedAt
  }

  EventBooking {
    string id PK
    string eventId FK
    string person1Name
    date person1Dob
    string personNName "person2..10 optional"
    string street
    string postalCode
    string city
    string phone
    string email
    boolean isMember
    string remarks
    int roomsSingle
    int roomsDouble
    string stripePaymentIntentId
    decimal balanceDue
    datetime paymentReminderSentAt
    string userId FK
    datetime createdAt
  }

  NewsPost {
    string id PK
    string slug UK
    string titleDe
    string titleEn
    string bodyDe
    string bodyEn
    string status "DRAFT|PUBLISHED"
    datetime publishedAt
    datetime createdAt
    datetime updatedAt
  }

  Page {
    string id PK
    string slug UK
    string titleDe
    string titleEn
    string bodyDe
    string bodyEn
    string status "DRAFT|PUBLISHED"
    datetime publishedAt
    datetime createdAt
    datetime updatedAt
  }

  Recap {
    string id PK
    string slug UK
    string titleDe
    string titleEn
    string bodyDe
    string bodyEn
    date eventDate
    string imageUrl
    string status "DRAFT|PUBLISHED"
    datetime publishedAt
    datetime createdAt
    datetime updatedAt
  }

  Newsletter {
    string id PK
    string subjectDe
    string subjectEn
    string bodyDe
    string bodyEn
    string status "DRAFT|SENT"
    datetime sentAt
    int recipientCount
    datetime createdAt
    datetime updatedAt
  }

  Sponsor {
    string id PK
    string name
    string websiteUrl
    string imageUrl
    int displayOrder
    datetime createdAt
    datetime updatedAt
  }

  ClubSettings {
    string id PK
    string bankName
    string ibanEncrypted
    string ibanLast4
    string bic
    int feeCollectionDay
    int feeCollectionMonth
    datetime updatedAt
  }

  User ||--o| Member : "memberId (optional link)"
  User ||--o{ EventBooking : "userId (optional)"
  Event ||--o{ EventBooking : "eventId (cascade delete)"
`;

const AUTH_SEQUENCE = `sequenceDiagram
  participant U as User Browser
  participant NA as NextAuth
  participant DB as Database

  U->>NA: POST /api/auth/signin (email+password)
  NA->>DB: User.findUnique(email)
  DB-->>NA: User row
  NA->>NA: bcrypt.compare(password, hash)
  alt Email not verified
    NA-->>U: Error: EMAIL_NOT_VERIFIED
  else Valid credentials
    NA->>NA: Create JWT (id, role, firstName)
    NA-->>U: Set session cookie
    U->>NA: GET /api/auth/session
    NA-->>U: { user: { id, role, firstName, avatarUrl } }
  end`;

const BOOKING_SEQUENCE = `sequenceDiagram
  participant U as User
  participant BF as BookingForm
  participant API as /api/booking/checkout
  participant STR as Stripe
  participant WH as /api/webhooks/stripe
  participant DB as Database
  participant ML as Mailer

  U->>BF: Fill participants + room selection
  BF->>BF: Calculate total (deposit + surcharges)
  BF->>API: POST { eventId, persons[], roomType, ... }
  API->>STR: Create Checkout Session
  STR-->>API: { url, sessionId }
  API-->>BF: { checkoutUrl }
  BF->>STR: Redirect to Stripe Checkout
  U->>STR: Enter card + pay deposit
  STR->>WH: checkout.session.completed
  WH->>DB: Create EventBooking
  WH->>ML: sendBookingConfirmation(user)
  WH->>ML: sendAdminBookingNotification()
  STR-->>U: Redirect to success page`;

const MEMBERSHIP_SEQUENCE = `sequenceDiagram
  participant U as User
  participant MF as MembershipForm
  participant API as /api/membership
  participant DB as Database
  participant ML as Mailer
  participant ADM as Admin

  U->>MF: Fill persons + IBAN + SEPA consent
  MF->>API: POST membership data
  API->>API: Encrypt IBAN (AES-256-GCM)
  API->>DB: Create PendingMembership (7-day token)
  API->>ML: sendMembershipConfirmation(token)
  ML-->>U: Email with activation link

  alt User clicks token link
    U->>API: GET /api/membership/activate?token=...
    API->>DB: Verify token + create Member
    API->>DB: Link User.memberId
    API->>ML: sendWelcomeEmail()
  else Admin activates
    ADM->>API: POST /api/admin/members/pending/[id]/activate
    API->>DB: Create Member + link User.memberId
    API->>ML: sendWelcomeEmail()
  end`;

export default function DeveloperPage() {
  const { t, locale } = useAdminI18n();
  const isDE = locale === "de";

  return (
    <div className="max-w-5xl">
      {/* Print styles: hide sidebar, chat panel, and print button; expand main to full width */}
      <style>{`
        @media print {
          aside, [data-no-print] { display: none !important; }
          main { padding: 0 !important; background: white !important; }
          .max-w-5xl { max-width: none !important; }
          @page { margin: 12mm 10mm; size: A4 landscape; }

          /* Force white backgrounds everywhere — no grey panels */
          * { background: white !important; box-shadow: none !important; }

          /* Never break immediately after a heading */
          h1, h2, h3, h4 { break-after: avoid; }

          /* Keep section heading glued to the content that follows */
          section > h2 { break-after: avoid; }
          section > h2 + * { break-before: avoid; }
          /* Also glue the first diagram inside a flex/grid container to the heading above */
          section > h2 + * > .mermaid-wrap:first-child { break-before: avoid; }

          /* Force sequence diagrams section to always start on a new page */
          .print-break-before { break-before: page; }

          /* Keep diagram title + SVG together */
          .mermaid-wrap { break-inside: avoid; }
          .mermaid-wrap p { break-after: avoid; }
          .mermaid-wrap p + * { break-before: avoid; }

          /* Scale tall diagrams to fit the page height — never overflow */
          .mermaid-wrap svg {
            max-height: 160mm;
            width: 100% !important;
            height: auto !important;
          }

          /* Reduce Mermaid label font size in print */
          .mermaid-wrap svg text,
          .mermaid-wrap svg .label,
          .mermaid-wrap svg .messageText,
          .mermaid-wrap svg .labelText,
          .mermaid-wrap svg .loopText {
            font-size: 11px !important;
          }

          /* Keep table rows intact */
          tr { break-inside: avoid; }
        }
      `}</style>

      <div className="flex items-center justify-between gap-3 mb-8">
        <div className="flex items-center gap-3">
          <span className="material-symbols-rounded text-emerald-700" style={{ fontSize: 32 }} aria-hidden="true">code</span>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{isDE ? "Entwickler-Portal" : "Developer Portal"}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{isDE ? "WSC 81 — Technische Dokumentation" : "WSC 81 — Technical Documentation"}</p>
          </div>
        </div>
        <button
          data-no-print
          onClick={() => {
            const date = new Date().toISOString().split("T")[0];
            const prev = document.title;
            document.title = `developer_wsc81_${date}`;
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

      {/* Repository Overview */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">{isDE ? "Repository-Übersicht" : "Repository Overview"}</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-rounded text-[#4577ac]" style={{ fontSize: 22 }} aria-hidden="true">public</span>
              <h3 className="font-semibold text-gray-800 text-sm">{isDE ? "Öffentliche Website" : "Public Website"}</h3>
            </div>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• {isDE ? "Homepage mit Veranstaltungen, News, Formulare" : "Homepage with events, news, forms"}</li>
              <li>• {isDE ? "Benutzerkonten & Buchungen" : "User accounts & bookings"}</li>
              <li>• {isDE ? "Mitgliedschaft beantragen" : "Membership application"}</li>
              <li>• {isDE ? "Öffentlicher KI-Assistent" : "Public AI assistant"}</li>
              <li>• {isDE ? "DE/EN Lokalisierung (next-intl)" : "DE/EN localisation (next-intl)"}</li>
              <li>• {isDE ? "Stripe Checkout (Anzahlung)" : "Stripe Checkout (deposit)"}</li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-rounded text-[#4577ac]" style={{ fontSize: 22 }} aria-hidden="true">admin_panel_settings</span>
              <h3 className="font-semibold text-gray-800 text-sm">{isDE ? "Admin-Bereich" : "Admin Area"}</h3>
            </div>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• {isDE ? "Veranstaltungen & Buchungsverwaltung" : "Event & booking management"}</li>
              <li>• {isDE ? "Mitgliedschaften & Benutzer" : "Memberships & users"}</li>
              <li>• {isDE ? "Newsletter-Editor (TipTap + KI)" : "Newsletter editor (TipTap + AI)"}</li>
              <li>• {isDE ? "Inhalte: News & statische Seiten" : "Content: news & static pages"}</li>
              <li>• {isDE ? "Rückblicke, Sponsoren, Einstellungen" : "Recaps, sponsors, settings"}</li>
              <li>• {isDE ? "KI-Assistent für DB-Operationen" : "AI assistant for DB operations"}</li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-rounded text-emerald-700" style={{ fontSize: 22 }} aria-hidden="true">terminal</span>
              <h3 className="font-semibold text-gray-800 text-sm">{isDE ? "Entwickler-Portal" : "Developer Portal"}</h3>
            </div>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• {isDE ? "Technische Dokumentation" : "Technical documentation"}</li>
              <li>• {isDE ? "Architektur-Diagramme (Mermaid)" : "Architecture diagrams (Mermaid)"}</li>
              <li>• {isDE ? "Sequenzdiagramme der Kernabläufe" : "Sequence diagrams of core flows"}</li>
              <li>• {isDE ? "KI-Assistent für Code-Fragen" : "AI assistant for code questions"}</li>
              <li>• {isDE ? "Nur für Admins zugänglich" : "Accessible to admins only"}</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">{isDE ? "Tech Stack" : "Tech Stack"}</h2>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-2 text-sm">
            {[
              ["Framework", "Next.js 16 (App Router, TypeScript)"],
              ["Database", "PostgreSQL (Neon) + Prisma ORM v7"],
              ["Auth", "NextAuth.js v5 beta (Credentials providers)"],
              ["Styling", "Tailwind CSS + Material Symbols Rounded"],
              ["i18n", "next-intl (DE/EN) + admin-i18n.ts"],
              ["Rich Text", "TipTap"],
              ["AI", "Anthropic Claude API (Sonnet 4.6 / Haiku 4.5)"],
              ["Email", "SendGrid"],
              ["Payments", "Stripe Checkout"],
              ["File Storage", "Vercel Blob (avatars)"],
              ["Deployment", "Vercel"],
              ["Validation", "Zod"],
            ].map(([label, value]) => (
              <div key={label} className="flex gap-2">
                <span className="font-medium text-gray-600 w-28 flex-shrink-0">{label}</span>
                <span className="text-gray-800">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Architecture Diagram */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">{isDE ? "Komponentenarchitektur" : "Component Architecture"}</h2>
        <MermaidDiagram
          chart={COMPONENT_DIAGRAM}
          title={isDE ? "Haupt-Komponenten & Abhängigkeiten" : "Main components & dependencies"}
        />
      </section>

      {/* Sequence Diagrams */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">{isDE ? "Datenbankschema" : "Database Schema"}</h2>
        <MermaidDiagram chart={DB_DIAGRAM} title={isDE ? "Tabellen, Attribute & Fremdschlüssel" : "Tables, attributes & foreign keys"} />
      </section>

      {/* Sequence Diagrams */}
      <section className="mb-10 print-break-before">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">{isDE ? "Sequenzdiagramme" : "Sequence Diagrams"}</h2>
        <div className="flex flex-col gap-6">
          <MermaidDiagram chart={AUTH_SEQUENCE} title={isDE ? "Authentifizierungsablauf" : "Authentication flow"} />
          <MermaidDiagram chart={BOOKING_SEQUENCE} title={isDE ? "Buchungsablauf (Stripe)" : "Booking flow (Stripe)"} />
          <MermaidDiagram chart={MEMBERSHIP_SEQUENCE} title={isDE ? "Mitgliedschaftsablauf" : "Membership flow"} />
        </div>
      </section>

      {/* Key File Locations */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">{isDE ? "Wichtige Dateipfade" : "Key File Locations"}</h2>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-3 py-2 font-semibold text-gray-600 border-b border-gray-200">{isDE ? "Bereich" : "Area"}</th>
                <th className="text-left px-3 py-2 font-semibold text-gray-600 border-b border-gray-200">{isDE ? "Pfad" : "Path"}</th>
              </tr>
            </thead>
            <tbody>
              {[
                [isDE ? "Auth-Konfiguration" : "Auth config", "src/auth/config.ts, src/auth/index.ts"],
                [isDE ? "Prisma Schema" : "Prisma schema", "prisma/schema.prisma"],
                [isDE ? "E-Mail" : "Email", "src/lib/mailer.ts"],
                [isDE ? "Admin i18n" : "Admin i18n", "src/lib/admin-i18n.ts"],
                [isDE ? "Öffentliche i18n" : "Public i18n", "messages/de.json, messages/en.json"],
                [isDE ? "Admin-KI-Tools" : "Admin AI tools", "src/lib/chat-tools.ts"],
                [isDE ? "Öffentliche KI-Tools" : "Public AI tools", "src/lib/public-chat-tools.ts"],
                [isDE ? "Validierung" : "Validation", "src/lib/validation.ts"],
                [isDE ? "Suche" : "Search", "src/lib/search.ts"],
                [isDE ? "Buchungs-API" : "Booking API", "src/app/api/booking/route.ts"],
                [isDE ? "Stripe Webhook" : "Stripe webhook", "src/app/api/webhooks/stripe/route.ts"],
                [isDE ? "Cron (Cleanup)" : "Cron (cleanup)", "src/app/api/cron/cleanup/route.ts"],
                [isDE ? "Admin Chat UI" : "Admin chat UI", "src/components/admin/AdminChatPanel.tsx"],
                [isDE ? "Entwickler Chat UI" : "Dev chat UI", "src/components/admin/DevChatPanel.tsx"],
                [isDE ? "Öffentlicher Chat UI" : "Public chat UI", "src/components/PublicChatPanel.tsx"],
                [isDE ? "Buchungsformular" : "Booking form", "src/components/BookingForm.tsx"],
                [isDE ? "Formulare-Abschnitt" : "Forms section", "src/components/FormsSection.tsx"],
              ].map(([area, path]) => (
                <tr key={area} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-3 py-1.5 text-gray-700">{area}</td>
                  <td className="px-3 py-1.5 font-mono text-gray-500">{path}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div data-no-print><DevChatPanel /></div>
    </div>
  );
}
