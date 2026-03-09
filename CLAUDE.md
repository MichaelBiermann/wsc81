# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Homepage for **Walldorfer Ski-Club 81 e.V. (WSC 81)**. Modelled after the existing site at wsc81.de — same layout, sections, and blue/white color scheme (`#4577ac`). The site presents club information, events, news, and allows membership applications and event bookings.

- **Primary language:** German (default)
- **Secondary language:** English (alternative)
- **Deployed at:** https://wsc81.vercel.app

## Tech Stack

- **Framework:** Next.js 16 (App Router, TypeScript)
- **Database:** PostgreSQL (Neon serverless) + Prisma ORM v7
- **Auth:** NextAuth.js v5 beta — two Credentials providers: `admin-credentials` (AdminUser table) and `user-credentials` (User table)
- **Email:** SendGrid (`@sendgrid/mail`)
- **i18n:** next-intl (de default, en alternative); admin area uses `src/lib/admin-i18n.ts` (static const, no next-intl)
- **Styling:** Tailwind CSS
- **Icons:** Material Symbols Rounded (loaded via Google Fonts in root layout)
- **Validation:** Zod
- **Rich text editor:** TipTap (newsletter editor, content editor, event descriptions)
- **AI:** Anthropic Claude API (`claude-sonnet-4-6`) — content actions: rephrase, shorten, expand, fix grammar, translate → DE, translate → EN, optimize_event; admin chat assistant: natural language DB management via tool use
- **File storage:** Vercel Blob (avatars only — sponsor images now self-hosted in `public/images/sponsors/`)
- **Deployment:** Vercel

## Build & Development

```bash
npm install
cp .env.example .env.local      # fill in DATABASE_URL, SENDGRID_*, ANTHROPIC_API_KEY, etc.
npx prisma migrate dev           # apply DB migrations locally
npm run dev                      # start dev server at http://localhost:3000
```

**Production build** (use this — `npm run build` calls it internally):
```bash
node node_modules/next/dist/bin/next build
```

**DB migrations on production:**
```bash
DATABASE_URL=<prod_url> npx prisma migrate deploy
npx prisma generate              # after any schema change
```

### Default admin credentials (change after first login!)
- Email: `admin@wsc81.de`
- Password: `admin123`

## Key Features

### 1. Public Site
- Sticky navigation, hero image slider, events calendar, news block, sponsors strip, footer
- Pages: `/verein`, `/vorstand`, `/uebungsleiter`, `/sponsoren`, `/satzung`, `/agb`, `/datenschutz`, `/impressum`
- Full-text search via PostgreSQL `tsvector` / `plainto_tsquery`
- All images/assets self-hosted in `public/images/` and `public/documents/` (no verwaltungsportal.de dependencies)
- **Public Chat Assistant** — floating panel on all public pages (`src/components/PublicChatPanel.tsx`); answers questions about events, membership, and the club via `POST /api/chat`; tools in `src/lib/public-chat-tools.ts`

### 2. User Accounts
Registered users (email + password) get a persistent account at `/[locale]/account`.

- Register at `/[locale]/register` — email verification required (24h token)
- Login at `/[locale]/login` — with unverified-account error handling
- Account page shows: profile data, avatar, membership status, booking history
- Avatar upload via Vercel Blob (`POST/DELETE /api/user/avatar`)
- Profile editing (street, city, phone) via `PATCH /api/user/profile`
- Email change with verification link (`PATCH/DELETE /api/user/email`, `GET /api/user/verify-email-change`)
- Password reset via email token (`/forgot-password`, `/reset-password`)

### 3. Event Booking
- Up to **10 participants** per booking, contact fields, member checkbox, room selection, remarks
- Per-person pricing: non-member surcharge (adult 18+ vs under 18), bus surcharge, single/double room price per person
- `roomSingleSurcharge` and `roomDoubleSurcharge` on `Event` are full per-person prices (not deltas); `roomDoubleSurcharge=0` means double room is included in the base `depositAmount`
- Surcharges waived if `user.member` exists and `feesPaid = true`
- Booking form pre-filled from user account when logged in
- **Stripe Checkout** for events with `depositAmount > 0`: deposit paid online via `POST /api/booking/checkout`; `checkout.session.completed` webhook at `POST /api/webhooks/stripe` creates the `EventBooking` row and stores `stripePaymentIntentId` and `balanceDue`
- Free events (all surcharges zero): direct booking without payment via `POST /api/booking`
- On submit: confirmation email to user + admin notification
- Admin can delete bookings → cancellation email sent to user
- Admin can **download PDF** per event (`GET /api/admin/events/[id]/pdf`) — includes event details + full booking list with all participants, DOB, contact info
- Bookings queried by `userId OR email` (legacy support)
- **Payment reminders**: cron sends `sendPaymentReminder` email to bookings with outstanding `balanceDue` within the configured reminder window; `paymentReminderSentAt` stamped to prevent duplicates

### 4. Membership Application
- Form covers up to **10 persons**, contact, IBAN (AES-256-GCM encrypted), SEPA consent
- Submitted → `PendingMembership` row + confirmation email with 7-day activation token
- **User token link** or **admin "Aktivieren" button** → creates `Member` row, links `User.memberId`, sends welcome email
- Expired pending applications cleaned up by cron at 03:00 UTC
- `feesPaid` flag toggled by admin on Memberships page (clickable badge)

### 5. Rückblicke (Event Reports)
- Public list at `/[locale]/rueckblicke`, detail at `/[locale]/rueckblicke/[slug]`
- "Rückblicke" dropdown in nav (desktop + mobile) links to all 7 items + overview
- 7 recaps seeded with full content + photo galleries from wsc81.de: "Auf nach Lenggries…", "Der WSC in den Dolomiten", "Ski-Club Wochenende am Arlberg", "Saisoneröffnung mit Oli in Kühtai", "Walldorfer Weihnachtsmarkt", "Winterlicher Hüttenzauber", "Wandern im Kraichgau"
- Admin UI at `/admin/recaps` — CRUD with TipTap rich text editor + AI actions
- API: `GET/POST /api/admin/recaps`, `GET/PUT/DELETE /api/admin/recaps/[id]`
- Recap slugs must be `[a-z0-9-]` only (no umlauts) — e.g. `saisonoeffnung-mit-oli-in-kuehtai`

### 6. Events — Bookable vs. Informational
- `Event.bookable` (Boolean, default `true`) — controls whether booking is possible
- `bookable = true`: shows "Jetzt buchen" button in EventCalendar; detail page shows booking form + pricing panel
- `bookable = false`: shows "Anmeldung: siehe Beschreibung" label; detail page hides booking form, pricing panel, and registration info box; content column is full-width; event appears in "Weitere Veranstaltungen" section on homepage
- Homepage "Weitere Veranstaltungen" section is driven by DB events with `bookable = false`; falls back to static `RegularActivities` component if none exist
- Admin EventForm has a "Buchbar" checkbox to toggle this flag; prices section is only shown when bookable=true
- 4 regular activities seeded as non-bookable events: `regular-ski-gymnastics`, `regular-nordic-walking`, `regular-lauftreff`, `regular-sportabzeichen`
- **Age-based prices**: `Event.agePrices` JSON column stores up to 10 `{ label, price }` entries (e.g. "Kinder 3–5 Jahre", €25); shown in admin EventForm as dynamic add/remove rows and in the public event detail pricing panel; derived from description by the AI "Aus Beschreibung ableiten" button (`extract_surcharges` action)

### 7. Content (News & Static Pages)
- News articles: public at `/[locale]/news/[slug]` — shows published `NewsPost` with date, title, body
- Static pages: public at `/[locale]/seite/[slug]` — shows published `Page` with title, body
- Both return 404 for drafts or unknown slugs
- Admin content editor shows a `open_in_new` link next to the slug field to open the live public URL
- Admin: `/admin/content/news` and `/admin/content/pages` — CRUD with TipTap + AI rephrase

### 8. Search
- Full-text search covers: `Event`, `NewsPost`, `Recap`, `Page` (all published)
- Results link to correct public URLs: `/events/[id]`, `/news/[slug]`, `/rueckblicke/[slug]`, `/seite/[slug]`
- Type badges: Veranstaltung / Event, Neuigkeit / News, Rückblick / Recap, Seite / Page

### 9. Formulare (Forms Section)
- Public homepage section between "Weitere Veranstaltungen" and sponsors strip
- 6 cards in a responsive grid (`src/components/FormsSection.tsx`, `"use client"`)
- Card 1: Walldorf-Pass → download `/documents/walldorfpass.pdf`
- Card 2: Aktualisierung Mitgliederdaten → download `/documents/aktualisierung-mitgliederdaten.pdf`
- Card 3: Erklärung für Erziehungsberechtigte → download `/documents/erziehungsberechtigte.pdf`
- Card 4: Beitrittsformular → navigates to `/{locale}/membership`
- Card 5: Anmeldung für eine Freizeit → opens event-picker modal (fetches `GET /api/forms/events` on first open — public, no auth)
- Card 6: Hilfe & Support → links to `/{locale}/support` (visible to all; login prompt shown there for unauthenticated users)
- PDFs stored in `public/documents/`
- i18n via `Forms` namespace in `messages/de.json` + `messages/en.json`

### 10. Admin Area (`/admin`)
Protected by `role === "admin"`. All i18n via `src/lib/admin-i18n.ts` (DE + EN).

- **Dashboard** — 5 cards (brand color `#4577ac`): Events, Memberships, Pending Applications, Newsletter Drafts, Rückblicke
- **Events** — CRUD + `bookable` toggle + view/delete bookings per event; image field uses `AdminImageUpload` (upload file or paste URL with crop via `react-easy-crop`); "Aus Beschreibung ableiten" AI button extracts all pricing fields (surcharges + room prices + age-based prices) from description text
- **Memberships** — list activated members, toggle `feesPaid` per member
- **Pending Applications** — list + **Activate** button (creates Member, links User, sends welcome email) + Delete button
- **Users** — list registered user accounts, delete
- **Sponsors** — CRUD with `AdminImageUpload` component (file upload + URL + crop via `react-easy-crop`); sponsor images also self-hosted in `public/images/sponsors/`
- **Newsletter** — compose DE+EN rich-text newsletters, save draft, delete, use as template; send to **members only** (feesPaid=true) or **all users** (members + verified Users, deduplicated by email)
- **Content** — create/edit News articles and static Pages with TipTap + AI rephrase (`POST /api/admin/ai`); slug field shows `open_in_new` link to live public URL
- **Rückblicke** — create/edit event recap reports with TipTap + AI actions; `eventDate` and `imageUrl` optional; image field uses `AdminImageUpload`
- **Settings** — club bank account (IBAN encrypted), annual fee collection day/month, payment reminder weeks (triggers cron reminder emails for outstanding `balanceDue`)
- **Support** — ticket list with status filters (Offen/In Bearbeitung/Geschlossen); inline detail panel with message thread, reply form, and status controls; `GET /api/admin/support`, `GET/PATCH /api/admin/support/[id]`, `POST /api/admin/support/[id]/reply`
- **AI Chat Assistant** — floating panel (bottom-right) on all admin pages; natural language commands mapped to Prisma operations via Claude tool use (`POST /api/admin/chat`); tools in `src/lib/chat-tools.ts`; `navigate` tool opens admin UI pages directly
- **RichTextEditor AI buttons** — fully localized via `admin-i18n.ts` (`richText` namespace); `optimize_event` uses explicit locale so EN editors always produce English output

### 11. Support Tickets
Logged-in users report bugs / request features / ask questions at `/[locale]/support`.

- Submit at `/[locale]/support` — type selector (Bug/Feature/Question/Other), subject, body; login required; admins redirected away
- `POST /api/support` — Zod validation, creates `SupportTicket`; sends email to `ADMIN_EMAIL` with `replyTo: userEmail` (admin can reply directly from inbox)
- Admin views and replies at `/admin/support` — ticket table with filter tabs, inline expandable detail panel, message thread (user left / admin right bubbles)
- `POST /api/admin/support/[id]/reply` — creates `SupportMessage`, advances `OPEN → IN_PROGRESS`, emails user with `replyTo: ADMIN_EMAIL`
- Status flow: `OPEN → IN_PROGRESS` (first admin reply) → `CLOSED` (manual); admin can reopen
- **Email thread design**: both notification emails set `replyTo` so the entire follow-up exchange can happen outside the app in normal email clients
- Nav: "Support" link in the logged-in user account dropdown (desktop + mobile)
- Discovery for unauthenticated users: footer "Support" link (every page) + card 6 in the Formulare section (homepage)

## Database Models

| Model | Purpose |
|-------|---------|
| `AdminUser` | Admin login (email + bcrypt password) |
| `User` | Public user accounts (email + bcrypt, email verification, avatar, `memberId` FK) |
| `PendingMembership` | Unactivated membership applications (7-day token) |
| `Member` | Activated club members (IBAN encrypted, `feesPaid`) |
| `Event` + `EventBooking` | Events and bookings (up to 10 persons); `Event.bookable` flag; `Event.agePrices` JSON (age-based price entries); `EventBooking` stores `stripePaymentIntentId`, `balanceDue`, `paymentReminderSentAt` |
| `Sponsor` | Club sponsors (self-hosted images in `public/images/sponsors/`) |
| `Newsletter` | Draft/sent newsletters |
| `NewsPost` + `Page` | CMS content; search uses runtime `to_tsvector()` (no stored tsvector column) |
| `Recap` | Event recap reports (slug, title/body DE+EN, eventDate, imageUrl, status); also included in search |
| `ClubSettings` | Single-row global settings (bank account, fee day/month, `paymentReminderWeeks`) |
| `SupportTicket` | User-submitted support tickets (type BUG/FEATURE/QUESTION/OTHER, status OPEN/IN_PROGRESS/CLOSED, `userId` FK) |
| `SupportMessage` | Admin replies on a ticket (`fromAdmin` flag, `ticketId` FK, cascade delete) |

## Auth Details

- Session JWT carries: `id`, `role`, `firstName`, `avatarUrl`
- `role`: `"admin"` | `"member"` | `"user"` (member role = User has `memberId` set)
- **Stale JWT note:** Session role may lag behind DB state. Always check DB directly for membership status (e.g. `user.member` on account page, not `session.role`)
- Unverified users throw `Error("EMAIL_NOT_VERIFIED")` in authorize()

## Key File Locations

| Area | Path |
|------|------|
| Auth config | `src/auth/config.ts`, `src/auth/index.ts` |
| Prisma schema | `prisma/schema.prisma` |
| Email sending | `src/lib/mailer.ts` (SendGrid) |
| Admin i18n | `src/lib/admin-i18n.ts` |
| Public i18n | `messages/de.json`, `messages/en.json` |
| Cron cleanup | `src/app/api/cron/cleanup/route.ts` |
| Account page | `src/app/[locale]/account/page.tsx` |
| Booking API | `src/app/api/booking/route.ts` |
| User APIs | `src/app/api/user/{avatar,email,profile}/route.ts` |
| Admin APIs | `src/app/api/admin/{events,members,bookings,users,recaps,...}/` |
| Admin chat API | `src/app/api/admin/chat/route.ts` |
| Admin chat tools | `src/lib/chat-tools.ts` |
| Admin chat UI | `src/components/admin/AdminChatPanel.tsx` |
| Public chat API | `src/app/api/chat/route.ts` |
| Public chat tools | `src/lib/public-chat-tools.ts` |
| Public chat UI | `src/components/PublicChatPanel.tsx` |
| Admin image upload | `src/components/admin/AdminImageUpload.tsx` |
| Stripe webhook | `src/app/api/webhooks/stripe/route.ts` |
| Booking checkout | `src/app/api/booking/checkout/route.ts` |
| Recaps (public) | `src/app/[locale]/rueckblicke/` |
| Recaps (admin) | `src/app/admin/recaps/` |
| News (public) | `src/app/[locale]/news/[slug]/page.tsx` |
| Static pages (public) | `src/app/[locale]/seite/[slug]/page.tsx` |
| Content (admin) | `src/app/admin/content/` |
| Forms section | `src/components/FormsSection.tsx` |
| Forms API | `src/app/api/forms/events/route.ts` |
| Support (public) | `src/app/[locale]/support/page.tsx`, `src/components/SupportForm.tsx` |
| Support API (user) | `src/app/api/support/route.ts` |
| Support API (admin) | `src/app/api/admin/support/[id]/route.ts`, `.../reply/route.ts` |
| Support (admin UI) | `src/app/admin/support/page.tsx` |
| Sponsors strip | `src/components/SponsorsStrip.tsx` (server component, shown after footer on all locale pages) |
| RegularActivities | `src/components/RegularActivities.tsx` (static fallback) |

## Conventions

- All user-facing text supports DE + EN; German is default
- Admin area uses its own i18n system (`admin-i18n.ts`) — not next-intl
- IBAN stored AES-256-GCM encrypted; only last 4 digits in plaintext
- Activation/verification tokens: 48-byte hex, single-use
- Membership tokens expire after 7 days; user email verification after 24 hours
- Email always via SendGrid (`src/lib/mailer.ts`); `SENDGRID_API_KEY` required
- Material Symbols Rounded loaded globally in `src/app/layout.tsx`
- Avatar images stored in Vercel Blob store `wsc81-avatars`
- `EventSchema.imageUrl` accepts empty string and transforms it to `null` (Zod `.or(z.literal("")).transform(...)`) — needed because the form sends `""` when no URL is entered
- `roomSingleSurcharge` / `roomDoubleSurcharge` are full per-person room prices, not deltas — `roomDoubleSurcharge=0` means double room is included in base `depositAmount`
- `AdminImageUpload` (`src/components/admin/AdminImageUpload.tsx`): used in Events, Recaps, Sponsors; supports file upload, URL load, crop (`react-easy-crop`), and rotation; preview thumbnail is 192×112px
- Homepage section order: Neuigkeiten → Kommende Veranstaltungen → Weitere Veranstaltungen → Formulare → Footer → Unsere Sponsoren

## Environment Variables

```
DATABASE_URL                   # Neon PostgreSQL connection string
SENDGRID_API_KEY               # SendGrid API key
SENDGRID_FROM                  # Sender email address
ADMIN_EMAIL                    # Receives booking notifications
NEXT_PUBLIC_BASE_URL           # https://wsc81.vercel.app
IBAN_ENCRYPTION_KEY            # 64-char hex (32 bytes AES key)
CRON_SECRET                    # Protects /api/cron/cleanup
AUTH_SECRET                    # NextAuth secret
BLOB_READ_WRITE_TOKEN          # Vercel Blob token
ANTHROPIC_API_KEY              # Claude API for content AI actions + chat assistants
STRIPE_SECRET_KEY              # Stripe secret key (server-side)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY  # Stripe publishable key (client-side)
STRIPE_WEBHOOK_SECRET          # Stripe webhook signing secret for /api/webhooks/stripe
```

## Testing & Quality

### Running tests
```bash
npm test                  # run all tests once
npm run test:watch        # watch mode
npm run test:coverage     # with coverage report
```

### Test suite
**377 tests across 15 test files** — all in `src/__tests__/`.

| File | What it covers |
|------|---------------|
| `accessibility.test.tsx` | Section 508 / WCAG 2.1 AA — FormField/Input/Button/Textarea ARIA, focus-trap logic, dialog/menu/live-region/skip-link patterns; uses `jest-axe` + `@testing-library/react` |
| `admin-chat-route.test.ts` | `POST /api/admin/chat` — auth, tool-use loop, navigate capture, error handling |
| `admin-chat-tools.test.ts` | All `executeTool` cases in `src/lib/chat-tools.ts` |
| `admin-image-upload.test.ts` | `POST/DELETE /api/admin/images` — upload, crop, delete |
| `chat-route.test.ts` | `POST /api/chat` — tool-use loop, navigate capture, locale handling |
| `crypto.test.ts` | `encryptIBAN` / `decryptIBAN` round-trip, random IV, `ibanLast4` |
| `developer-chat-route.test.ts` | `POST /api/admin/developer-chat` — auth, tool-use loop |
| `forms-events-route.test.ts` | `GET /api/forms/events` — filters, ordering |
| `mailer.test.ts` | All 13 `send*` functions in `src/lib/mailer.ts` — DE/EN subjects, HTML content, replyTo headers |
| `pdf-utils.test.ts` | PDF generation for event booking lists |
| `public-chat-tools.test.ts` | All `executePublicTool` cases in `src/lib/public-chat-tools.ts` |
| `search-lib.test.ts` | `src/lib/search.ts` — full-text query building |
| `search-route.test.ts` | `GET /api/search` — query params, result shapes |
| `tokens.test.ts` | `generateActivationToken`, `tokenExpiresAt`, `isTokenExpired` |
| `validation.test.ts` | All 10 Zod schemas in `src/lib/validation.ts` |

### Coverage (tracked files)
| Metric | Coverage |
|--------|----------|
| Statements | 99.48% |
| Branches | 97.19% |
| Functions | 98.27% |
| Lines | 100% |

Coverage is scoped to the files listed in `vitest.config.ts` (`coverage.include`). The accessibility test file uses `// @vitest-environment jsdom`; all other tests run in the default node environment.

### Accessibility (Section 508 / WCAG 2.1 AA)
Key patterns enforced across all interactive components:

- **Skip link** — `href="#main-content"` in `layout.tsx`; visually hidden, revealed on focus
- **Dialog panels** (`PublicChatPanel`, `AdminChatPanel`, `FormsSection` modal) — `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, focus trap (Tab/Shift+Tab), Escape key, focus return to trigger button on close
- **Navigation dropdowns** — `aria-expanded`, `aria-haspopup="menu"`, `role="menu"`, `role="menuitem"`, Escape key closes
- **Chat message log** — `role="log"`, `aria-live="polite"`
- **Typing indicator / spinners** — `role="status"`, `aria-label`
- **Icon-only buttons** — always have `aria-label`; decorative icons always have `aria-hidden="true"`
- **Form fields** — `<label htmlFor>` associated with every input via `FormField`'s `htmlFor` prop; `<fieldset>`/`<legend>` for grouped person fields in BookingForm
- **Room counters** — `aria-label` on `+`/`−` buttons; `aria-live="polite"` on value display
- **Button loading state** — `aria-busy="true"` when `loading` prop is set

## Notes

- Repository is on GitHub: `MichaelBiermann/wsc81`
- Vercel project: `michbier-6077s-projects/wsc81`
- `npm run build` is broken (`.bin` shim issue) — use `node node_modules/next/dist/bin/next build` directly or deploy via Vercel CLI
