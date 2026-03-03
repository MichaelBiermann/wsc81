import { getTranslations } from "next-intl/server";

export default async function ImpressumPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isDE = locale !== "en";

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 pt-20">
      <h1 className="text-2xl font-bold text-[#4577ac] mb-8">
        {isDE ? "Impressum" : "Legal Notice"}
      </h1>

      <div className="prose prose-sm max-w-none text-gray-700 space-y-6">

        {/* Organisation */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {isDE ? "Angaben gemäß § 5 TMG" : "Information according to § 5 TMG"}
          </h2>
          <p>
            <strong>Walldorfer Ski-Club 81 e.V.</strong><br />
            Postfach 1426<br />
            69185 Walldorf
          </p>
          <p className="mt-2">
            <strong>{isDE ? "Ansprechpartnerin" : "Contact person"}:</strong> Birgit Lehment<br />
            <strong>E-Mail:</strong>{" "}
            <a href="mailto:vorstand@wsc81.de" className="text-[#4577ac] hover:underline">
              vorstand@wsc81.de
            </a><br />
            <strong>{isDE ? "Telefon" : "Phone"}:</strong>{" "}
            {isDE
              ? "Auf Anfrage per E-Mail"
              : "Available upon request via email"}
          </p>
        </section>

        {/* Haftungsausschluss */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {isDE ? "Haftungsausschluss" : "Liability Disclaimer"}
          </h2>
          <p>
            {isDE
              ? "Der Herausgeber übernimmt keinerlei Gewähr für die Aktualität, Korrektheit, Vollständigkeit oder Qualität der bereitgestellten Informationen. Haftungsansprüche gegen den Herausgeber, die sich auf Schäden materieller oder ideeller Art beziehen, die durch die Nutzung oder Nichtnutzung der dargebotenen Informationen bzw. durch die Nutzung fehlerhafter und unvollständiger Informationen verursacht wurden, sind grundsätzlich ausgeschlossen, sofern seitens des Herausgebers kein nachweislich vorsätzliches oder grob fahrlässiges Verschulden vorliegt. Der Herausgeber behält es sich ausdrücklich vor, Teile der Seiten oder das gesamte Angebot ohne gesonderte Ankündigung zu verändern, zu ergänzen, zu löschen oder die Veröffentlichung zeitweise oder endgültig einzustellen."
              : "The publisher provides no warranty regarding the timeliness, accuracy, completeness, or quality of the information provided. Liability claims against the publisher relating to material or immaterial damages caused by the use or non-use of the information provided, or by the use of incorrect or incomplete information, are fundamentally excluded, unless the publisher can be shown to have acted with intent or gross negligence. The publisher expressly reserves the right to modify, supplement, delete, or temporarily or permanently discontinue publication of parts of the pages or the entire offering without prior notice."}
          </p>
        </section>

        {/* Externe Links */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {isDE ? "Externe Links" : "External Links"}
          </h2>
          <p>
            {isDE
              ? "Dieses Webangebot enthält Verknüpfungen zu Websites Dritter (externe Links). Diese Websites unterliegen der Haftung der jeweiligen Betreiber. Der Herausgeber hat bei der erstmaligen Verknüpfung der externen Links die fremden Inhalte daraufhin überprüft, ob etwaige Rechtsverstöße bestehen. Zu dem Zeitpunkt waren keine Rechtsverstöße ersichtlich. Der Herausgeber hat keinerlei Einfluss auf die aktuelle und zukünftige Gestaltung und auf die Inhalte der verknüpften Seiten. Das Setzen von externen Links bedeutet nicht, dass sich der Herausgeber die hinter dem Verweis oder Link liegenden Inhalte zu eigen macht. Eine ständige Kontrolle dieser externen Links ist für den Herausgeber ohne konkrete Hinweise auf Rechtsverstöße nicht zumutbar. Bei Kenntnis von Rechtsverstößen werden jedoch derartige externe Links unverzüglich gelöscht."
              : "This website contains links to third-party websites (external links). These websites are subject to the liability of their respective operators. At the time of initial linking, the publisher checked the external content for possible legal violations. At that time, no legal violations were apparent. The publisher has no influence over the current or future design and content of linked pages. The inclusion of external links does not imply that the publisher endorses the content behind the link. Constant monitoring of external links is not reasonable without specific indications of legal violations. However, upon becoming aware of legal violations, such external links will be deleted immediately."}
          </p>
        </section>

        {/* Urheberrecht */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {isDE ? "Urheberrecht" : "Copyright"}
          </h2>
          <p>
            {isDE
              ? "Die durch den Herausgeber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers. Downloads und Kopien dieser Seite sind nur für den privaten, nicht kommerziellen Gebrauch gestattet. Soweit die Inhalte auf dieser Seite nicht vom Betreiber erstellt wurden, werden die Urheberrechte Dritter beachtet. Insbesondere werden Inhalte Dritter als solche gekennzeichnet. Sollten Sie trotzdem auf eine Urheberrechtsverletzung aufmerksam werden, bitten wir um einen entsprechenden Hinweis. Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Inhalte umgehend entfernen."
              : "The content and works created by the publisher on these pages are subject to German copyright law. Reproduction, editing, distribution, and any kind of use beyond the limits of copyright law require the written consent of the respective author or creator. Downloads and copies of this site are permitted only for private, non-commercial use. Where content on this site was not created by the operator, the copyrights of third parties are respected. In particular, third-party content is identified as such. Should you nevertheless become aware of a copyright infringement, please notify us accordingly. Upon becoming aware of such violations, we will remove the relevant content immediately."}
          </p>
        </section>

        {/* Website-Erstellung */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {isDE ? "Website-Erstellung" : "Website Creation"}
          </h2>
          <p>
            {isDE
              ? "Diese Website wurde im Rahmen des Ausbildungsförderungsprogramms \u201eAzubi-Projekte\u201c kostenlos erstellt."
              : "This website was created free of charge through the apprenticeship support program \u201cAzubi-Projekte\u201d."}          </p>
        </section>

      </div>
    </div>
  );
}
