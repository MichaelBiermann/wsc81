# WSC 81 — Walldorfer Ski-Club 81 e.V.

Homepage for **Walldorfer Ski-Club 81 e.V.**, built with Next.js 16 (App Router), PostgreSQL/Prisma, Tailwind CSS, and next-intl (DE/EN).

![WSC 81 Homepage](public/screenshot.png)

![WSC 81 Admin UI](public/screenshot-admin.png)

## Features

- **Public homepage** — hero slider, events calendar, news, sponsors, contact, downloadable forms
- **Event booking** — up to 10 participants, per-person pricing, Stripe Checkout, confirmation email
- **Membership application** — up to 10 persons, SEPA bank details (AES-256-GCM encrypted), 7-day activation token
- **User accounts** — register, email verification, profile editor, avatar, booking history
- **Full-text search** — PostgreSQL tsvector across events, news, recaps and pages
- **Rückblicke** — event recap reports with photo galleries
- **Admin area** — manage events, memberships, bookings (PDF export), newsletter, content, sponsors, settings
- **Support tickets** — logged-in users submit bug reports / feature requests at `/support`; admin reads and replies at `/admin/support`; email thread uses `replyTo` so replies stay in normal inboxes
- **AI assistants** — public chat panel + admin chat panel (Claude API with tool use)
- **Accessibility** — Section 508 / WCAG 2.1 AA: skip link, focus traps, ARIA roles, keyboard navigation

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| Database | PostgreSQL (Neon serverless) + Prisma ORM v7 |
| Auth | NextAuth v5 beta (Credentials — two providers) |
| Email | SendGrid (`@sendgrid/mail`) |
| Payments | Stripe Checkout |
| i18n | next-intl (DE default, EN) |
| Styling | Tailwind CSS |
| Icons | Material Symbols Rounded |
| Rich text | TipTap |
| AI | Anthropic Claude API (`claude-sonnet-4-6`) |
| Storage | Vercel Blob (avatars) |
| Testing | Vitest + jest-axe + @testing-library/react |
| Deployment | Vercel |

## Getting Started

```bash
npm install
cp .env.example .env.local   # fill in DATABASE_URL, SENDGRID_*, ANTHROPIC_API_KEY, etc.
npx prisma migrate dev
npm run dev                  # http://localhost:3000
```

Default admin login: `admin@wsc81.de` / `admin123` (change after first login).

## Testing & Quality

```bash
npm test                # run all 377 tests
npm run test:coverage   # with coverage report
```

### Coverage (tracked files)

| Metric | Coverage |
|--------|----------|
| Statements | 99.48% |
| Branches | 97.19% |
| Functions | 98.27% |
| **Lines** | **100%** |

### Test files

| File | What it covers |
|------|----------------|
| `accessibility.test.tsx` | Section 508 / WCAG 2.1 AA — ARIA contracts, focus-trap logic, dialog/menu/live-region patterns (jest-axe) |
| `admin-chat-route.test.ts` | Admin chat API — auth, tool-use loop, navigation |
| `admin-chat-tools.test.ts` | All admin chat tool handlers (`src/lib/chat-tools.ts`) |
| `admin-image-upload.test.ts` | Image upload/delete API |
| `chat-route.test.ts` | Public chat API — tool-use loop, locale, navigation |
| `crypto.test.ts` | AES-256-GCM IBAN encryption/decryption |
| `forms-events-route.test.ts` | Forms events API |
| `mailer.test.ts` | All 13 `send*` functions — DE/EN subjects, HTML content, replyTo headers |
| `pdf-utils.test.ts` | Booking PDF generation |
| `public-chat-tools.test.ts` | All public chat tool handlers (`src/lib/public-chat-tools.ts`) |
| `search-lib.test.ts` | Full-text search query building |
| `search-route.test.ts` | Search API route |
| `tokens.test.ts` | Activation token generation and expiry logic |
| `validation.test.ts` | All 10 Zod schemas |

### Accessibility (Section 508 / WCAG 2.1 AA)

Key patterns enforced across all interactive components:

- **Skip link** — visible on focus, targets `#main-content`
- **Dialog panels** — `role="dialog"`, `aria-modal`, `aria-labelledby`, focus trap (Tab/Shift+Tab), Escape key, focus return to trigger on close
- **Navigation dropdowns** — `aria-expanded`, `aria-haspopup="menu"`, `role="menu"` / `role="menuitem"`, Escape key
- **Chat log** — `role="log"`, `aria-live="polite"`; typing indicator uses `role="status"`
- **Icon-only buttons** — always have `aria-label`; decorative icons always have `aria-hidden="true"`
- **Form fields** — `<label htmlFor>` wired via `FormField` component; `<fieldset>`/`<legend>` for grouped inputs
- **Counter controls** — `aria-label` on `+`/`−` buttons; `aria-live="polite"` on value display
- **Loading state** — `aria-busy="true"` on buttons when submitting
