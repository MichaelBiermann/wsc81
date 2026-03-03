# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Homepage for **Walldorfer Ski-Club 81 e.V. (WSC 81)**. Modelled after the existing site at wsc81.de — same layout, sections, and blue/white color scheme (`#4577ac`). The site presents club information, events, news, and allows membership applications and event bookings.

- **Primary language:** German (default)
- **Secondary language:** English (alternative)

## Key Features

### 1. Public Homepage (matching wsc81.de)
- Sticky navigation: WSC 81 · Veranstaltungen · Rückblicke · Formulare · Allgemeines
- Hero image slider (Arlberg ski scenes)
- Welcome text block
- Upcoming events calendar with **"Jetzt buchen"** (Book now) button per event
- News block
- Contact info (address + email)
- Weather widget
- Footer: social media icons, legal links

### 2. Event Booking (Anmeldung für eine Freizeit)
One booking form per event, covering up to 5 participants (same family structure as membership).

**People fields (up to 5 slots):**
- Person 1: Name (primary participant)
- Person 2: PartnerIn (partner) — optional
- Persons 3–5: Kind (child) — optional
- Date of birth for each person entered

**Shared contact (one per booking):**
- Straße (street + house number)
- PLZ (5-digit postal code)
- Stadt (city)
- Telefon (phone)
- eMail

**Additional fields:**
- WSC81 member? (Ja / Nein checkbox — pre-ticked if user is logged in as `member`)
- Bemerkungen (free-text remarks/notes)

**Pricing surcharge:**
- Non-members pay an extra **€40.00** on top of the event's base price
- This surcharge is waived automatically once a user holds the `member` role (i.e. membership application activated **and** yearly fee paid)
- The booking form shows the applicable total clearly before submission

**Payment:** Bank transfer to Volksbank Wiesloch (IBAN DE27 6729 2200 0010 3294 00, BIC: GENODE61WIE)
- Deposit (Anzahlung) due immediately
- Remaining balance (Restbetrag) due at least 4 weeks before trip start
- Each event defines its own amounts in its Ausschreibung (event description)

**Terms:** By submitting, participants accept the WSC81 Reisebedingungen (travel terms). Registration deadline per event must be respected.

**Process:**
- Booking is tied to a specific event (selected from the event calendar)
- On submit: save booking, send confirmation email to the provided address
- Club admin receives notification of new booking

### 3. Membership Application (Beitrittserklärung)
Based on the official form (Formular 5.4.2014). One application covers a family unit of up to 5 people.

**People fields (up to 5 slots):**
- Person 1: Name (primary member)
- Person 2: PartnerIn (partner) — optional
- Persons 3–5: Kind (child) — optional
- Date of birth for each person entered

**Shared address/contact (one per application):**
- Straße (street + house number)
- PLZ (5-digit postal code)
- Wohnort (city)
- Telefon (phone)
- eMail

**Membership category (select one, annual fee by SEPA direct debit only):**
| Category | Fee/year |
|---|---|
| Familien (adults + children up to age 25) | €47.00 |
| Erwachsene (adults) | €32.00 |
| Jugendliche (up to age 17) + Schüler/Studenten (with ID) | €17.00 |
| GDB ab 50% (disability ≥50%) | €22.00 |
| Senioren (with official ID) | €27.00 |

Note: from age 25, youth fees convert automatically to adult or student fees unless cancelled.

**Bank details (SEPA direct debit):**
- Kreditinstitut (bank name)
- IBAN
- BIC

**Consent checkboxes (all required):**
1. Consent to electronic data storage
2. Agreement that cancellation fees caused to WSC are charged to the member
3. Acknowledgement of the club's Satzung (bylaws)

**Process:**
- On submit: save as pending, send confirmation email with activation link
- Unactivated applications are automatically deleted after 7 days
- Fiscal year: 1 July – 30 June

### 4. Full-Text Search
Google-like search experience to find any content on the site — events, news, club info pages, Rückblicke (recaps), etc.

- Search bar prominently placed in the header/navigation area
- Results page shows ranked matches with title, excerpt/snippet, and link
- Searches across: events, news posts, static page content, Rückblicke
- Supports both German and English content
- Fast, incremental results preferred (search-as-you-type or on submit)
- Implementation: PostgreSQL full-text search (`tsvector` / `plainto_tsquery` with `german` dictionary)

### 5. Sponsors Page (`/sponsoren`)
Dedicated subpage showing all club sponsors, one image per sponsor, each linking to the sponsor's website. Images sourced from the existing wsc81.de site.

| # | Name | Image URL | Website |
|---|------|-----------|---------|
| 1 | Bauunternehmung Michael Schneider | https://daten.verwaltungsportal.de/dateien//mypage/1/7/2/5/5/0/4/Bauunternehmnung_Schneider.png | http://www.schneider-walldorf.de/ |
| 2 | Weine und Genuss | https://daten.verwaltungsportal.de/dateien//mypage/1/7/2/5/5/0/6/Wein_Genuss_Logo.png | https://www.weine-und-genuss.de/weinladen_walldorf.html |
| 3 | Metzgerei Pütz | https://daten.verwaltungsportal.de/dateien//mypage/1/7/2/5/5/0/8/Metzgerei_P_tz.jpg | https://www.metzgerei-walldorf.de |
| 4 | StefanMayerreisen | https://daten.verwaltungsportal.de/dateien//mypage/1/7/2/5/5/1/0/StefanMayer_2.webp | https://stefan-mayer-reisen.de/ |
| 5 | Getränke Wipfler Walldorf | https://daten.verwaltungsportal.de/dateien//mypage/1/7/2/5/5/1/2/Wipfler.jpg | https://www.getraenke-wipfler.de |
| 6 | Der Brillenladen | https://daten.verwaltungsportal.de/dateien//mypage/1/7/2/5/5/1/4/Brillentante_Logo.png | https://www.derbrillenladen-walldorf.de/ |
| 7 | Sparkasse | https://daten.verwaltungsportal.de/dateien//mypage/1/7/2/5/5/3/0/Sparkasse_NEW.png | https://www.sparkasse-heidelberg.de |
| 8 | Volksbank Kraichgau | https://daten.verwaltungsportal.de/dateien//mypage/1/7/2/5/5/3/2/Volksbank_Kraichgau.jpg | https://www.vbkraichgau.de |
| 9 | Tari Bikes | https://daten.verwaltungsportal.de/dateien//mypage/1/7/2/5/5/3/4/Tari_Bikes-001.jpg | https://www.tari-bikes.de/ |
| 10 | Pfälzer Hof | https://daten.verwaltungsportal.de/dateien//mypage/1/7/2/5/5/3/6/Pf_lzer_Hof-001.jpg | https://www.pfaelzerhofwalldorf.de/ |
| 11 | Astoria Apotheke | https://daten.verwaltungsportal.de/dateien//mypage/1/7/2/5/5/3/8/Apotheke.jpg | https://www.central-apotheke-walldorf.de |

Layout: responsive image grid, each sponsor is a linked image card. Linked from navigation under WSC 81 → Unsere Sponsoren.

## User Roles

| Role | Description |
|------|-------------|
| `user` | Unauthenticated visitor or registered-but-not-yet-member. Can browse the site, apply for membership, book events. |
| `member` | Activated club member. Same public access as `user` plus any future member-only areas. |
| `admin` | Content administrator. Full access to all public features plus the admin area. |

## Admin Features (`/admin` — role `admin` only)

All admin routes are protected: unauthenticated or non-admin requests redirect to the login page.

### Event Management
- **List** all events (past and upcoming) in a table
- **Create** new event: title (DE + EN), description (DE + EN), location, start/end date, deposit amount, total amount, max participants, registration deadline
- **Edit** existing event: all fields editable
- **Delete** event (with confirmation dialog; also removes associated bookings)
- **View bookings** per event: list of all bookings with participant names, contact details, member status, remarks

### Sponsor Management
- **List** all sponsors in order
- **Add** sponsor: upload image, enter name, website URL, display order
- **Edit** sponsor: replace image, update name/URL/order
- **Remove** sponsor (with confirmation dialog)
- Images stored on Vercel Blob (or local `/public/sponsors/` for dev)

### Club Settings Management
Admin can maintain global club settings:

**WSC81 Bank Account (for incoming SEPA direct debits):**
- Kreditinstitut (bank name)
- IBAN
- BIC

**Annual Fee Collection:**
- Collection day (1–28) and month (1–12) — the day of year on which the yearly membership fee is collected via SEPA direct debit from all active members
- Example: day 1, month 10 = every year on 1 October

These settings are stored in a single-row `ClubSettings` table in the database and editable only by admins.

### Newsletter Management
Admin can compose and send HTML newsletters to all active members.

**Workflow:**
- Admin creates a newsletter with a subject line and rich-text body (DE and/or EN)
- Newsletter can be **saved as draft** at any time and resumed later
- When ready, admin clicks **Send** — emails go out immediately to all members with `feesPaid = true`
- Sent newsletters are archived and viewable in the admin area

**Editor:**
- Rich text editor (TipTap) supporting: headings, bold, italic, bullet lists, links, images
- Preview mode shows how the email will look before sending

**Email delivery:**
- One email per member, sent in the member's preferred locale (de/en)
- Both HTML and plain-text versions sent for deliverability
- From address: club SMTP sender (same as transactional emails)

**Newsletter model (`Newsletter`):**
- `id`, `subjectDe`, `subjectEn`, `bodyDe`, `bodyEn` (rich HTML)
- `status`: `DRAFT` | `SENT`
- `sentAt` (nullable), `createdAt`, `updatedAt`
- `recipientCount` (stored at send time for record-keeping)

### Content Editor (News Articles & Static Pages)
Admin can create and manage two types of content using a rich text editor with AI assistance.

**Content types:**
- **News articles** (`NewsPost`) — appear in the homepage news block and have their own detail pages (`/news/[slug]`)
- **Static pages** (`Page`) — general content pages like "Über uns", "Satzung", "Impressum" etc., reachable via nav or direct URL (`/seite/[slug]`)

**Editor features (TipTap):**
- Headings, bold, italic, underline, bullet/numbered lists, links, images, horizontal rule
- Both DE and EN versions of title and body per content item
- Save as draft or publish immediately
- Slug auto-generated from title, editable manually

**AI-assisted actions (Claude API — `claude-sonnet-4-6`):**
Triggered by selecting text in the editor and choosing an action from a floating toolbar:

| Action | Description |
|--------|-------------|
| **Rephrase / rewrite** | Rewrites selected text in a clearer or different tone |
| **Shorten** | Makes selected text more concise |
| **Expand** | Elaborates selected text with more detail |
| **Fix grammar** | Corrects spelling and grammar errors |
| **Translate DE ↔ EN** | Translates selected text to the other language |

AI suggestions appear inline as a diff/preview — admin can **Accept**, **Retry**, or **Dismiss**.

**API route:** `POST /api/admin/ai/rephrase`
- Body: `{ text, action, locale }`
- Calls Claude API with a system prompt tailored to the action
- Returns `{ suggestion: string }`
- Protected: admin role required

**Models:**
```
NewsPost:  id, slug, titleDe, titleEn, bodyDe, bodyEn (HTML), status (DRAFT|PUBLISHED), publishedAt, createdAt, updatedAt, searchVector
Page:      id, slug, titleDe, titleEn, bodyDe, bodyEn (HTML), status (DRAFT|PUBLISHED), publishedAt, createdAt, updatedAt
```

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL 14+ running locally or via cloud

### Setup
```bash
npm install
cp .env.example .env.local   # fill in DATABASE_URL, SMTP_*, ANTHROPIC_API_KEY, etc.
npx prisma migrate dev        # create DB schema
npm run db:seed               # seed sponsors + default admin user
```

### Development
```bash
npm run dev        # start dev server at http://localhost:3000
```

### Default admin credentials (change after first login!)
- Email: `admin@wsc81.de`
- Password: `admin123`

### Build commands
```bash
npm run build          # production build
npm run db:migrate     # run DB migrations
npm run db:seed        # seed initial data
npm run db:generate    # regenerate Prisma client
```



- **Framework:** Next.js 14+ (App Router)
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** NextAuth.js (credentials provider for admin; email confirmation for members)
- **Email:** Nodemailer (SMTP)
- **i18n:** next-intl (de default, en alternative)
- **Styling:** Tailwind CSS
- **Validation:** Zod
- **Rich text editor:** TipTap (used in newsletter editor, content editor, event descriptions)
- **AI:** Anthropic Claude API (`claude-sonnet-4-6`) for content rephrasing actions
- **File storage:** Vercel Blob (sponsor images, editor image uploads)
- **Deployment:** Vercel

## Conventions

- All user-facing text must support both German and English
- German is the default/fallback language
- IBAN stored encrypted (AES-256-GCM); only last 4 digits in plaintext
- Activation tokens: 384-bit entropy, 7-day expiry, single-use

## Notes

- This repository is not yet initialized as a git repository
- Update this file as the project evolves with actual commands, architecture, and conventions
