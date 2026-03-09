import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import { stripHtml, calcAge } from "@/lib/pdf-utils";

async function requireAdmin() {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;
  return !!(session && user?.role === "admin");
}

function fmt(date: Date | string | null | undefined): string {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("de-DE");
}

const BRAND = "#4577ac";
const BRAND_LIGHT = "#eef3f9";
const GRAY = "#555";
const LIGHT = "#888";

const s = StyleSheet.create({
  page:          { fontSize: 9, fontFamily: "Helvetica", paddingTop: 36, paddingBottom: 48, paddingHorizontal: 40, color: "#1a1a1a" },

  // Header band
  headerBand:    { backgroundColor: BRAND, borderRadius: 4, padding: 14, marginBottom: 16 },
  headerTitle:   { fontSize: 17, fontFamily: "Helvetica-Bold", color: "#fff", marginBottom: 3 },
  headerSub:     { fontSize: 9, color: "#c8d9ec" },
  headerMeta:    { flexDirection: "row", gap: 16, marginTop: 8 },
  headerMetaItem:{ fontSize: 8, color: "#d6e6f5" },

  // Section
  sectionTitle:  { fontSize: 10, fontFamily: "Helvetica-Bold", color: BRAND, borderBottomWidth: 0.5, borderBottomColor: "#c8d9ec", paddingBottom: 3, marginBottom: 6, marginTop: 14 },

  // Key-value rows for event details
  kvRow:         { flexDirection: "row", marginBottom: 2.5 },
  kvLabel:       { width: 110, color: GRAY, fontSize: 8.5 },
  kvValue:       { flex: 1, fontSize: 8.5 },

  // Description
  description:   { lineHeight: 1.55, color: "#333", fontSize: 8.5 },

  // Summary chips
  summaryRow:    { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12, marginTop: 4 },
  chip:          { backgroundColor: BRAND_LIGHT, borderRadius: 3, paddingVertical: 3, paddingHorizontal: 7, flexDirection: "row", gap: 4 },
  chipLabel:     { color: GRAY, fontSize: 8 },
  chipValue:     { fontFamily: "Helvetica-Bold", fontSize: 8 },
  chipValueGreen:{ fontFamily: "Helvetica-Bold", fontSize: 8, color: "#15803d" },
  chipValueAmber:{ fontFamily: "Helvetica-Bold", fontSize: 8, color: "#b45309" },

  // Booking card
  card:          { borderWidth: 0.5, borderColor: "#d0dce8", borderRadius: 3, marginBottom: 8, overflow: "hidden" },
  cardHeader:    { backgroundColor: "#f0f5fb", flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 5, paddingHorizontal: 8 },
  cardName:      { fontFamily: "Helvetica-Bold", fontSize: 9 },
  cardMeta:      { fontSize: 8, color: LIGHT },
  memberBadge:   { fontSize: 7.5, color: "#1d4ed8", fontFamily: "Helvetica-Bold", marginLeft: 6 },
  cardBody:      { padding: 8 },

  // Participant table
  tableHead:     { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#d0dce8", paddingBottom: 2, marginBottom: 3 },
  tableHeadCell: { fontSize: 7.5, color: LIGHT, fontFamily: "Helvetica-Bold" },
  tableRow:      { flexDirection: "row", paddingVertical: 1.5, borderBottomWidth: 0.3, borderBottomColor: "#eef3f9" },
  colNum:        { width: 16 },
  colName:       { flex: 1 },
  colDob:        { width: 68 },
  colAge:        { width: 28 },
  cellText:      { fontSize: 8.5, color: "#222" },
  cellMuted:     { fontSize: 8.5, color: GRAY },

  // Contact section
  contactLine:   { fontSize: 8.5, color: "#333", marginBottom: 2 },

  // Payment row
  paymentRow:    { flexDirection: "row", gap: 6, marginTop: 6, flexWrap: "wrap" },
  payBadgeGreen: { backgroundColor: "#dcfce7", borderRadius: 2, paddingVertical: 2, paddingHorizontal: 5, fontSize: 7.5, color: "#15803d", fontFamily: "Helvetica-Bold" },
  payBadgeAmber: { backgroundColor: "#fef9c3", borderRadius: 2, paddingVertical: 2, paddingHorizontal: 5, fontSize: 7.5, color: "#b45309", fontFamily: "Helvetica-Bold" },
  payBadgeGray:  { backgroundColor: "#f3f4f6", borderRadius: 2, paddingVertical: 2, paddingHorizontal: 5, fontSize: 7.5, color: "#6b7280", fontFamily: "Helvetica-Bold" },

  // Remarks
  remarks:       { fontSize: 8, color: GRAY, fontStyle: "italic", marginTop: 4 },

  // Footer
  footer:        { position: "absolute", bottom: 20, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 0.3, borderTopColor: "#d0dce8", paddingTop: 4 },
  footerText:    { fontSize: 7.5, color: "#aaa" },
});

// Helper to create a key-value row
function KV(label: string, value: string) {
  return React.createElement(View, { style: s.kvRow },
    React.createElement(Text, { style: s.kvLabel }, label),
    React.createElement(Text, { style: s.kvValue }, value),
  );
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const event = await prisma.event.findUnique({
    where: { id },
    include: { bookings: { orderBy: { createdAt: "asc" } } },
  });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const depositAmount = Number(event.depositAmount);
  const totalParticipants = event.bookings.reduce((sum, b) => sum + [
    b.person1Name, b.person2Name, b.person3Name, b.person4Name, b.person5Name,
    b.person6Name, b.person7Name, b.person8Name, b.person9Name, b.person10Name,
  ].filter(Boolean).length, 0);
  const memberBookings = event.bookings.filter((b) => b.isMember).length;
  const totalSingle = event.bookings.reduce((sum, b) => sum + b.roomsSingle, 0);
  const totalDouble = event.bookings.reduce((sum, b) => sum + b.roomsDouble, 0);
  const paidBookings = event.bookings.filter((b) => b.stripePaymentIntentId).length;
  const totalCollected = paidBookings * depositAmount;
  const totalBalanceDue = event.bookings.reduce((sum, b) => {
    const bd = (b as typeof b & { balanceDue?: unknown }).balanceDue;
    return sum + (bd ? Number(bd) : 0);
  }, 0);

  const descText = stripHtml(event.descriptionDe);

  const doc = React.createElement(
    Document,
    { title: event.titleDe },
    React.createElement(Page, { size: "A4", style: s.page },

      // ── Header band ──────────────────────────────────────────────────
      React.createElement(View, { style: s.headerBand },
        React.createElement(Text, { style: s.headerTitle }, event.titleDe),
        event.titleEn && event.titleEn !== event.titleDe
          ? React.createElement(Text, { style: s.headerSub }, event.titleEn)
          : null,
        React.createElement(View, { style: s.headerMeta },
          React.createElement(Text, { style: s.headerMetaItem }, `Zeitraum: ${fmt(event.startDate)} - ${fmt(event.endDate)}`),
          React.createElement(Text, { style: s.headerMetaItem }, `Ort: ${event.location}`),
          event.registrationDeadline
            ? React.createElement(Text, { style: s.headerMetaItem }, `Anmeldeschluss: ${fmt(event.registrationDeadline)}`)
            : null,
        ),
      ),

      // ── Event details ─────────────────────────────────────────────────
      React.createElement(Text, { style: s.sectionTitle }, "Veranstaltungsdetails"),
      KV("Ort:", event.location),
      KV("Zeitraum:", `${fmt(event.startDate)} - ${fmt(event.endDate)}`),
      event.registrationDeadline ? KV("Anmeldeschluss:", fmt(event.registrationDeadline)) : null,
      event.organisation ? KV("Anmeldung / Kontakt:", event.organisation) : null,
      event.organisationEmail ? KV("Kontakt E-Mail:", event.organisationEmail) : null,
      event.organisationPhone ? KV("Kontakt Tel:", event.organisationPhone) : null,
      depositAmount > 0 ? KV("Anzahlung:", `€ ${depositAmount.toFixed(2)}`) : null,
      Number(event.totalAmount) > 0 ? KV("Gesamtpreis:", `€ ${Number(event.totalAmount).toFixed(2)}`) : null,
      event.maxParticipants ? KV("Max. Teilnehmer:", String(event.maxParticipants)) : null,

      // ── Description ───────────────────────────────────────────────────
      descText ? React.createElement(View, null,
        React.createElement(Text, { style: s.sectionTitle }, "Beschreibung"),
        React.createElement(Text, { style: s.description }, descText),
      ) : null,

      // ── Bookings summary ──────────────────────────────────────────────
      React.createElement(Text, { style: s.sectionTitle }, `Anmeldungen (${event.bookings.length})`),
      React.createElement(View, { style: s.summaryRow },
        React.createElement(View, { style: s.chip },
          React.createElement(Text, { style: s.chipLabel }, "Buchungen:"),
          React.createElement(Text, { style: s.chipValue }, String(event.bookings.length)),
        ),
        React.createElement(View, { style: s.chip },
          React.createElement(Text, { style: s.chipLabel }, "Teilnehmer:"),
          React.createElement(Text, { style: s.chipValue }, String(totalParticipants)),
        ),
        React.createElement(View, { style: s.chip },
          React.createElement(Text, { style: s.chipLabel }, "Mitglieder:"),
          React.createElement(Text, { style: s.chipValue }, String(memberBookings)),
        ),
        totalSingle > 0 ? React.createElement(View, { style: s.chip },
          React.createElement(Text, { style: s.chipLabel }, "Einzelzimmer:"),
          React.createElement(Text, { style: s.chipValue }, String(totalSingle)),
        ) : null,
        totalDouble > 0 ? React.createElement(View, { style: s.chip },
          React.createElement(Text, { style: s.chipLabel }, "Doppelzimmer:"),
          React.createElement(Text, { style: s.chipValue }, String(totalDouble)),
        ) : null,
        depositAmount > 0 ? React.createElement(View, { style: s.chip },
          React.createElement(Text, { style: s.chipLabel }, "Anzahlungen:"),
          React.createElement(Text, { style: s.chipValueGreen }, `€ ${totalCollected.toFixed(2)} (${paidBookings}/${event.bookings.length})`),
        ) : null,
        totalBalanceDue > 0 ? React.createElement(View, { style: s.chip },
          React.createElement(Text, { style: s.chipLabel }, "Restbeträge offen:"),
          React.createElement(Text, { style: s.chipValueAmber }, `€ ${totalBalanceDue.toFixed(2)}`),
        ) : null,
      ),

      // ── Booking cards ─────────────────────────────────────────────────
      ...event.bookings.map((b, idx) => {
        const persons = [
          { name: b.person1Name, dob: b.person1Dob },
          { name: b.person2Name ?? "", dob: b.person2Dob ?? null },
          { name: b.person3Name ?? "", dob: b.person3Dob ?? null },
          { name: b.person4Name ?? "", dob: b.person4Dob ?? null },
          { name: b.person5Name ?? "", dob: b.person5Dob ?? null },
          { name: b.person6Name ?? "", dob: b.person6Dob ?? null },
          { name: b.person7Name ?? "", dob: b.person7Dob ?? null },
          { name: b.person8Name ?? "", dob: b.person8Dob ?? null },
          { name: b.person9Name ?? "", dob: b.person9Dob ?? null },
          { name: b.person10Name ?? "", dob: b.person10Dob ?? null },
        ].filter((p) => p.name);

        const balanceDue = (b as typeof b & { balanceDue?: unknown }).balanceDue;
        const rooms = [
          b.roomsSingle > 0 ? `EZ: ${b.roomsSingle}` : "",
          b.roomsDouble > 0 ? `DZ: ${b.roomsDouble}` : "",
        ].filter(Boolean).join("  ·  ");

        return React.createElement(View, { key: b.id, style: s.card, wrap: false },

          // Card header
          React.createElement(View, { style: s.cardHeader },
            React.createElement(View, { style: { flexDirection: "row", alignItems: "center" } },
              React.createElement(Text, { style: s.cardMeta }, `#${idx + 1}  `),
              React.createElement(Text, { style: s.cardName }, b.person1Name),
              b.isMember ? React.createElement(Text, { style: s.memberBadge }, "* Mitglied") : null,
            ),
            React.createElement(Text, { style: s.cardMeta }, `Gebucht: ${fmt(b.createdAt)}`),
          ),

          React.createElement(View, { style: s.cardBody },

            // Participant table header
            React.createElement(View, { style: s.tableHead },
              React.createElement(Text, { style: [s.tableHeadCell, s.colNum] }, "#"),
              React.createElement(Text, { style: [s.tableHeadCell, s.colName] }, "Name"),
              React.createElement(Text, { style: [s.tableHeadCell, s.colDob] }, "Geburtsdatum"),
              React.createElement(Text, { style: [s.tableHeadCell, s.colAge] }, "Alter"),
            ),

            // Participant rows
            ...persons.map((p, pi) =>
              React.createElement(View, { key: pi, style: s.tableRow },
                React.createElement(Text, { style: [s.cellMuted, s.colNum] }, `${pi + 1}.`),
                React.createElement(Text, { style: [s.cellText, s.colName] }, p.name),
                React.createElement(Text, { style: [s.cellMuted, s.colDob] }, p.dob ? fmt(p.dob) : "-"),
                React.createElement(Text, { style: [s.cellMuted, s.colAge] }, calcAge(p.dob)),
              )
            ),

            // Contact info — simple stacked lines
            React.createElement(View, { style: { marginTop: 6 } },
              React.createElement(Text, { style: s.contactLine }, `Email: ${b.email}`),
              React.createElement(Text, { style: s.contactLine }, `Tel: ${b.phone || "-"}`),
              React.createElement(Text, { style: s.contactLine }, `Adresse: ${b.street}, ${b.postalCode} ${b.city}`),
              rooms ? React.createElement(Text, { style: s.contactLine }, `Zimmer: ${rooms}`) : null,
            ),

            // Remarks
            b.remarks ? React.createElement(Text, { style: s.remarks }, `Hinweis: ${b.remarks}`) : null,

            // Payment badges
            React.createElement(View, { style: s.paymentRow },
              b.stripePaymentIntentId
                ? React.createElement(Text, { style: s.payBadgeGreen },
                    `Anzahlung bezahlt: € ${depositAmount.toFixed(2)}`
                  )
                : React.createElement(Text, { style: s.payBadgeGray }, "Kostenlos / keine Zahlung"),
              b.stripePaymentIntentId && balanceDue !== null && Number(balanceDue) > 0
                ? React.createElement(Text, { style: s.payBadgeAmber },
                    `Restbetrag offen: € ${Number(balanceDue).toFixed(2)}`
                  )
                : null,
              b.stripePaymentIntentId && (balanceDue === null || Number(balanceDue) === 0)
                ? React.createElement(Text, { style: s.payBadgeGreen }, "Vollständig bezahlt")
                : null,
            ),
          ),
        );
      }),

      // ── Footer ────────────────────────────────────────────────────────
      React.createElement(View, { style: s.footer, fixed: true },
        React.createElement(Text, { style: s.footerText }, "Walldorfer Ski-Club 81 e.V."),
        React.createElement(Text, { style: s.footerText }, event.titleDe),
        React.createElement(Text, { style: s.footerText }, `Erstellt am ${fmt(new Date())}`),
      ),
    )
  );

  const buffer = await renderToBuffer(doc);
  const safeName = event.titleDe.replace(/[^a-zA-Z0-9äöüÄÖÜß\s-]/g, "").replace(/\s+/g, "_").slice(0, 60);

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="WSC81_${safeName}.pdf"`,
    },
  });
}
