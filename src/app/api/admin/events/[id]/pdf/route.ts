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

async function requireAdmin() {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;
  return !!(session && user?.role === "admin");
}

/** Strip HTML tags and decode basic entities */
function stripHtml(html: string): string {
  return html
    .replace(/<\/p>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?(li|tr|td|th|h[1-6]|div|blockquote)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function fmt(date: Date | string | null | undefined): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("de-DE");
}

const styles = StyleSheet.create({
  page: { fontSize: 10, fontFamily: "Helvetica", padding: 40, color: "#1a1a1a" },
  header: { marginBottom: 20, borderBottomWidth: 1, borderBottomColor: "#4577ac", paddingBottom: 10 },
  title: { fontSize: 18, fontFamily: "Helvetica-Bold", color: "#4577ac", marginBottom: 4 },
  subtitle: { fontSize: 11, color: "#555" },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 12, fontFamily: "Helvetica-Bold", color: "#4577ac", marginBottom: 6, borderBottomWidth: 0.5, borderBottomColor: "#c8d9ec", paddingBottom: 2 },
  row: { flexDirection: "row", marginBottom: 3 },
  label: { width: 130, color: "#666" },
  value: { flex: 1 },
  description: { lineHeight: 1.5, color: "#333" },
  bookingCard: { marginBottom: 10, padding: 8, backgroundColor: "#f7f9fb", borderRadius: 3, borderWidth: 0.5, borderColor: "#d0dce8" },
  bookingHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  bookingTitle: { fontFamily: "Helvetica-Bold", fontSize: 10 },
  bookingMeta: { fontSize: 9, color: "#666" },
  participantRow: { flexDirection: "row", marginBottom: 2, fontSize: 9 },
  participantNum: { width: 20, color: "#888" },
  participantName: { width: 160 },
  participantDob: { width: 80, color: "#555" },
  contactRow: { flexDirection: "row", marginTop: 4, fontSize: 9, color: "#555" },
  contactLabel: { width: 40 },
  remarksText: { fontSize: 9, color: "#666", marginTop: 3, fontStyle: "italic" },
  footer: { position: "absolute", bottom: 28, left: 40, right: 40, fontSize: 8, color: "#aaa", textAlign: "center" },
  memberBadge: { color: "#2563eb" },
  noBookings: { color: "#888", fontStyle: "italic" },
  summary: { flexDirection: "row", gap: 20, marginBottom: 12 },
  summaryItem: { flexDirection: "row", gap: 4 },
  summaryLabel: { color: "#666" },
  summaryValue: { fontFamily: "Helvetica-Bold" },
});

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

  const totalParticipants = event.bookings.reduce((sum, b) => {
    return sum + [
      b.person1Name, b.person2Name, b.person3Name, b.person4Name, b.person5Name,
      b.person6Name, b.person7Name, b.person8Name, b.person9Name, b.person10Name,
    ].filter(Boolean).length;
  }, 0);

  const memberCount = event.bookings.filter((b) => b.isMember).length;

  const doc = React.createElement(
    Document,
    { title: event.titleDe },
    React.createElement(
      Page,
      { size: "A4", style: styles.page },

      // Header
      React.createElement(
        View,
        { style: styles.header },
        React.createElement(Text, { style: styles.title }, event.titleDe),
        React.createElement(Text, { style: styles.subtitle }, event.titleEn !== event.titleDe ? event.titleEn : "")
      ),

      // Event details
      React.createElement(
        View,
        { style: styles.section },
        React.createElement(Text, { style: styles.sectionTitle }, "Veranstaltungsdetails"),
        React.createElement(
          View, { style: styles.row },
          React.createElement(Text, { style: styles.label }, "Ort:"),
          React.createElement(Text, { style: styles.value }, event.location)
        ),
        React.createElement(
          View, { style: styles.row },
          React.createElement(Text, { style: styles.label }, "Zeitraum:"),
          React.createElement(Text, { style: styles.value }, `${fmt(event.startDate)} – ${fmt(event.endDate)}`)
        ),
        React.createElement(
          View, { style: styles.row },
          React.createElement(Text, { style: styles.label }, "Anmeldeschluss:"),
          React.createElement(Text, { style: styles.value }, fmt(event.registrationDeadline))
        ),
        React.createElement(
          View, { style: styles.row },
          React.createElement(Text, { style: styles.label }, "Anzahlung / Gesamt:"),
          React.createElement(Text, { style: styles.value }, `€ ${Number(event.depositAmount).toFixed(2)} / € ${Number(event.totalAmount).toFixed(2)}`)
        ),
        event.maxParticipants
          ? React.createElement(
              View, { style: styles.row },
              React.createElement(Text, { style: styles.label }, "Max. Teilnehmer:"),
              React.createElement(Text, { style: styles.value }, String(event.maxParticipants))
            )
          : null,
      ),

      // Description
      stripHtml(event.descriptionDe)
        ? React.createElement(
            View,
            { style: styles.section },
            React.createElement(Text, { style: styles.sectionTitle }, "Beschreibung"),
            React.createElement(Text, { style: styles.description }, stripHtml(event.descriptionDe))
          )
        : null,

      // Bookings summary
      React.createElement(
        View,
        { style: styles.section },
        React.createElement(Text, { style: styles.sectionTitle },
          `Anmeldungen (${event.bookings.length})`
        ),
        React.createElement(
          View, { style: styles.summary },
          React.createElement(
            View, { style: styles.summaryItem },
            React.createElement(Text, { style: styles.summaryLabel }, "Buchungen:"),
            React.createElement(Text, { style: styles.summaryValue }, String(event.bookings.length))
          ),
          React.createElement(
            View, { style: styles.summaryItem },
            React.createElement(Text, { style: styles.summaryLabel }, "Teilnehmer gesamt:"),
            React.createElement(Text, { style: styles.summaryValue }, String(totalParticipants))
          ),
          React.createElement(
            View, { style: styles.summaryItem },
            React.createElement(Text, { style: styles.summaryLabel }, "davon Mitglieder:"),
            React.createElement(Text, { style: styles.summaryValue }, String(memberCount))
          ),
        ),

        event.bookings.length === 0
          ? React.createElement(Text, { style: styles.noBookings }, "Noch keine Anmeldungen.")
          : event.bookings.map((b, idx) => {
              const persons: { name: string; dob: Date | null }[] = [
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

              return React.createElement(
                View,
                { key: b.id, style: styles.bookingCard },

                // Booking header row
                React.createElement(
                  View, { style: styles.bookingHeader },
                  React.createElement(
                    Text, { style: styles.bookingTitle },
                    `#${idx + 1} – ${b.person1Name}${b.isMember ? "  ✦ Mitglied" : ""}`
                  ),
                  React.createElement(
                    Text, { style: styles.bookingMeta },
                    `Gebucht: ${fmt(b.createdAt)}`
                  )
                ),

                // Participants
                ...persons.map((p, pi) =>
                  React.createElement(
                    View, { key: pi, style: styles.participantRow },
                    React.createElement(Text, { style: styles.participantNum }, `${pi + 1}.`),
                    React.createElement(Text, { style: styles.participantName }, p.name),
                    React.createElement(Text, { style: styles.participantDob }, p.dob ? fmt(p.dob) : "")
                  )
                ),

                // Contact
                React.createElement(
                  View, { style: styles.contactRow },
                  React.createElement(Text, { style: styles.contactLabel }, "E-Mail:"),
                  React.createElement(Text, {}, b.email)
                ),
                React.createElement(
                  View, { style: styles.contactRow },
                  React.createElement(Text, { style: styles.contactLabel }, "Tel:"),
                  React.createElement(Text, {}, b.phone || "—")
                ),
                React.createElement(
                  View, { style: styles.contactRow },
                  React.createElement(Text, { style: styles.contactLabel }, "Adresse:"),
                  React.createElement(Text, {}, `${b.street}, ${b.postalCode} ${b.city}`)
                ),

                b.remarks
                  ? React.createElement(Text, { style: styles.remarksText }, `Hinweis: ${b.remarks}`)
                  : null,

                (b.roomsSingle > 0 || b.roomsDouble > 0)
                  ? React.createElement(
                      View, { style: styles.contactRow },
                      React.createElement(Text, { style: styles.contactLabel }, "Zimmer:"),
                      React.createElement(Text, {}, [
                        b.roomsSingle > 0 ? `EZ: ${b.roomsSingle}` : "",
                        b.roomsDouble > 0 ? `DZ: ${b.roomsDouble}` : "",
                      ].filter(Boolean).join("  ·  "))
                    )
                  : null
              );
            })
      ),

      // Footer
      React.createElement(
        Text,
        { style: styles.footer, fixed: true },
        `WSC 81 – ${event.titleDe} – Erstellt am ${fmt(new Date())}`
      )
    )
  );

  const buffer = await renderToBuffer(doc);
  const uint8 = new Uint8Array(buffer);

  const safeName = event.titleDe.replace(/[^a-zA-Z0-9äöüÄÖÜß\s-]/g, "").replace(/\s+/g, "_").slice(0, 60);

  return new NextResponse(uint8, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="WSC81_${safeName}.pdf"`,
    },
  });
}
