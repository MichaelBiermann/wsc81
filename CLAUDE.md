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
- **AI:** Anthropic Claude API (`claude-sonnet-4-6`) — actions: rephrase, shorten, expand, fix grammar, translate DE↔EN, optimize_event (event descriptions only)
- **File storage:** Vercel Blob (avatars, sponsor images)
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
- Sticky navigation, hero image slider, events calendar, news block, contact, weather widget, footer
- Pages: `/verein`, `/vorstand`, `/uebungsleiter`, `/sponsoren`, `/satzung`, `/agb`, `/datenschutz`, `/impressum`
- Full-text search via PostgreSQL `tsvector` / `plainto_tsquery`

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
- Up to **10 participants** per booking, contact fields, member checkbox, remarks
- Non-member surcharge: **€40** added automatically
- Surcharge waived if `user.member` exists and `feesPaid = true`
- Booking form pre-filled from user account when logged in
- On submit: confirmation email to user + admin notification
- Admin can delete bookings → cancellation email sent to user
- Admin can **download PDF** per event (`GET /api/admin/events/[id]/pdf`) — includes event details + full booking list with all participants, DOB, contact info
- Bookings queried by `userId OR email` (legacy support)

### 4. Membership Application
- Form covers up to **10 persons**, contact, IBAN (AES-256-GCM encrypted), SEPA consent
- Submitted → `PendingMembership` row + confirmation email with 7-day activation token
- **User token link** or **admin "Aktivieren" button** → creates `Member` row, links `User.memberId`, sends welcome email
- Expired pending applications cleaned up by cron at 03:00 UTC
- `feesPaid` flag toggled by admin on Memberships page (clickable badge)

### 5. Rückblicke (Event Reports)
- Public list at `/[locale]/rueckblicke`, detail at `/[locale]/rueckblicke/[slug]`
- "Rückblicke" dropdown in nav (desktop + mobile) links to all 7 items + overview
- 7 recaps seeded: "Auf nach Lenggries…", "Der WSC in den Dolomiten", "Ski-Club Wochenende am Arlberg", "Saisoneröffnung mit Oli in Kühtai", "Walldorfer Weihnachtsmarkt", "Winterlicher Hüttenzauber" (full content), "Wandern im Kraichgau"
- Admin UI at `/admin/recaps` — CRUD with TipTap rich text editor + AI actions
- API: `GET/POST /api/admin/recaps`, `GET/PUT/DELETE /api/admin/recaps/[id]`
- Recap slugs must be `[a-z0-9-]` only (no umlauts) — e.g. `saisonoeffnung-mit-oli-in-kuehtai`

### 6. Admin Area (`/admin`)
Protected by `role === "admin"`. All i18n via `src/lib/admin-i18n.ts` (DE + EN).

- **Dashboard** — counts with Material Symbols icons: Events, Memberships, Pending Applications, Newsletter Drafts
- **Events** — CRUD + view/delete bookings per event
- **Memberships** — list activated members, toggle `feesPaid` per member
- **Pending Applications** — list + **Activate** button (creates Member, links User, sends welcome email) + Delete button
- **Users** — list registered user accounts, delete
- **Sponsors** — CRUD with Vercel Blob image upload
- **Newsletter** — compose DE+EN rich-text newsletters, save draft, delete, use as template; send to **members only** (feesPaid=true) or **all users** (members + verified Users, deduplicated by email)
- **Content** — create/edit News articles and static Pages with TipTap + AI rephrase (`POST /api/admin/ai`)
- **Rückblicke** — create/edit event recap reports with TipTap + AI actions; `eventDate` and `imageUrl` optional
- **Settings** — club bank account (IBAN encrypted), annual fee collection day/month

## Database Models

| Model | Purpose |
|-------|---------|
| `AdminUser` | Admin login (email + bcrypt password) |
| `User` | Public user accounts (email + bcrypt, email verification, avatar, `memberId` FK) |
| `PendingMembership` | Unactivated membership applications (7-day token) |
| `Member` | Activated club members (IBAN encrypted, `feesPaid`) |
| `Event` + `EventBooking` | Events and bookings (up to 10 persons) |
| `Sponsor` | Club sponsors (image via Vercel Blob) |
| `Newsletter` | Draft/sent newsletters |
| `NewsPost` + `Page` | CMS content with tsvector full-text search |
| `Recap` | Event recap reports (slug, title/body DE+EN, eventDate, imageUrl, status) |
| `ClubSettings` | Single-row global settings (bank account, fee day/month) |

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
| Recaps (public) | `src/app/[locale]/rueckblicke/` |
| Recaps (admin) | `src/app/admin/recaps/` |

## Conventions

- All user-facing text supports DE + EN; German is default
- Admin area uses its own i18n system (`admin-i18n.ts`) — not next-intl
- IBAN stored AES-256-GCM encrypted; only last 4 digits in plaintext
- Activation/verification tokens: 48-byte hex, single-use
- Membership tokens expire after 7 days; user email verification after 24 hours
- Email always via SendGrid (`src/lib/mailer.ts`); `SENDGRID_API_KEY` required
- Material Symbols Rounded loaded globally in `src/app/layout.tsx`
- Avatar images stored in Vercel Blob store `wsc81-avatars`
- TipTap AI: selection read via `editor.state.selection` at click time (not React state) to avoid selection-cleared-on-click race condition
- `optimize_event` AI action returns HTML; all other actions return plain text — `RichTextEditor` uses `aiSuggestionIsHtml` flag to handle both

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
ANTHROPIC_API_KEY              # Claude API for content AI actions
```

## Notes

- Repository is on GitHub: `MichaelBiermann/wsc81`
- Vercel project: `michbier-6077s-projects/wsc81`
- `npm run build` is broken (`.bin` shim issue) — use `node node_modules/next/dist/bin/next build` directly or deploy via Vercel CLI
