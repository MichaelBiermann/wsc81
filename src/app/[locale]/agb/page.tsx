import { getLocale } from "next-intl/server";

export default async function AgbPage() {
  const locale = await getLocale();
  const isDE = locale === "de";

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 pt-20">
      {isDE ? (
        <>
          <h1 className="text-3xl font-bold text-[#4577ac] mb-8">Allgemeine Geschäftsbedingungen</h1>

          <div className="prose prose-sm max-w-none text-gray-700 space-y-6">
            <section>
              <h2 className="text-lg font-bold text-[#4577ac]">1. Anmeldung</h2>
              <p>Die Anmeldung zu Veranstaltungen erfolgt schriftlich mit den offiziellen Formularen. Die Anzahlung ist zahlbar an die Volksbank Kraichgau (IBAN: DE27 6729 2200 0010 3294 00). Die Restzahlung ist spätestens 4 Wochen vor Veranstaltungsbeginn fällig.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#4577ac]">2. Absage durch den WSC</h2>
              <p>Der WSC behält sich das Recht vor, Veranstaltungen bei nicht ausreichender Teilnehmerzahl abzusagen. In diesem Fall werden alle Zahlungen vollständig erstattet.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#4577ac]">3. Rücktritt des Teilnehmers</h2>
              <p>Bei Stornierungen mehr als 30 Tage vor Veranstaltungsbeginn fällt eine Bearbeitungsgebühr an. Bei Stornierungen innerhalb von 30 Tagen sind zusätzliche Kosten zu tragen, sofern der Platz nicht neu besetzt werden kann.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#4577ac]">4. Kostenerhöhungen</h2>
              <p>Der WSC behält sich vor, Preiserhöhungen infolge von Transport- oder Wechselkursänderungen weiterzugeben.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#4577ac]">5. Reisedokumente</h2>
              <p>Die Teilnehmer müssen für internationale Reisen gültige Ausweisdokumente vorweisen. Kosten bei Zurückweisung aufgrund fehlender Dokumente gehen zu Lasten des Teilnehmers.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#4577ac]">6. Versicherungen</h2>
              <p>Mitglieder sind über den Badischen Sportbund versichert, sofern ihre Mitgliedsbeiträge aktuell sind. Eine DSV-Versicherung (inkl. Ausrüstungsschäden) wird empfohlen.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#4577ac]">7. Haftungsausschluss</h2>
              <p>Die Teilnahme an allen Veranstaltungen des WSC 81 erfolgt auf eigene Gefahr. Der Verein übernimmt keine Haftung für Verletzungen oder Sachschäden.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#4577ac]">8. Jugendfreizeiten</h2>
              <p>Bei Verstößen gegen die Verhaltensregeln kann ein Ausschluss ohne Rückerstattung erfolgen. Gesundheitliche Einschränkungen sind bei der Anmeldung anzugeben.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#4577ac]">9. Bildrechte</h2>
              <p>Teilnehmer erklären sich damit einverstanden, dass Fotos auf der Vereinswebsite und in Pressematerialien verwendet werden dürfen.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#4577ac]">10. Höhere Gewalt</h2>
              <p>Kosten, die durch Streiks, Unwetter oder andere unvorhersehbare Ereignisse entstehen, gehen zu Lasten der Teilnehmer.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#4577ac]">11. Salvatorische Klausel</h2>
              <p>Sollten einzelne Bestimmungen dieser AGB unwirksam sein, so bleiben die übrigen Bestimmungen davon unberührt. Die unwirksame Bestimmung wird durch eine rechtswirksame ersetzt, die dem wirtschaftlichen Zweck am nächsten kommt.</p>
            </section>
          </div>
        </>
      ) : (
        <>
          <h1 className="text-3xl font-bold text-[#4577ac] mb-8">General Terms and Conditions</h1>

          <div className="prose prose-sm max-w-none text-gray-700 space-y-6">
            <section>
              <h2 className="text-lg font-bold text-[#4577ac]">1. Registration</h2>
              <p>Registration for events must be submitted in writing using the official forms. A deposit is payable to Volksbank Kraichgau (IBAN: DE27 6729 2200 0010 3294 00). The remaining balance is due at least 4 weeks before the event.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#4577ac]">2. Cancellation by WSC</h2>
              <p>WSC reserves the right to cancel events if minimum participation is not reached. In this case all payments will be fully refunded.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#4577ac]">3. Withdrawal by Participant</h2>
              <p>Cancellations more than 30 days before the event incur a processing fee. Cancellations within 30 days may incur additional costs if the spot cannot be reassigned.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#4577ac]">4. Price Increases</h2>
              <p>WSC reserves the right to pass on price increases due to transport costs or exchange rate changes.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#4577ac]">5. Travel Documents</h2>
              <p>Participants must present valid identification for international travel. Costs arising from rejection due to missing documents are borne by the participant.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#4577ac]">6. Insurance</h2>
              <p>Members are covered by Badischer Sportbund insurance when membership fees are current. DSV insurance (including equipment damage) is recommended.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#4577ac]">7. Liability Disclaimer</h2>
              <p>Participation in all WSC 81 events is at the participant&apos;s own risk. The club assumes no liability for injuries or property damage.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#4577ac]">8. Youth Activities</h2>
              <p>Violations of behavioral rules may result in dismissal without refund. Health conditions must be disclosed at registration.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#4577ac]">9. Image Rights</h2>
              <p>Participants consent to photographs being used on the club website and in press materials.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#4577ac]">10. Force Majeure</h2>
              <p>Costs arising from strikes, severe weather or other unforeseeable events are borne by participants.</p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#4577ac]">11. Severability</h2>
              <p>Should any provision of these terms be invalid, the remaining provisions remain unaffected. The invalid provision shall be replaced by a legally effective one that most closely achieves the intended purpose.</p>
            </section>
          </div>
        </>
      )}

      <div className="bg-[#eef3f9] rounded-lg p-5 mt-10 text-sm text-gray-700">
        <p className="font-semibold text-[#4577ac] mb-2">{isDE ? "Kontakt" : "Contact"}</p>
        <p>Walldorfer Ski-Club 81 e.V.</p>
        <p>Postfach 1426, 69185 Walldorf</p>
        <p><a href="mailto:vorstand@wsc81.de" className="text-[#4577ac] hover:underline">vorstand@wsc81.de</a></p>
      </div>
    </div>
  );
}
