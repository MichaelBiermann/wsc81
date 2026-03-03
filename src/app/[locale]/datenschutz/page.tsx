export default async function DatenschutzPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isDE = locale !== "en";

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 pt-20">
      <h1 className="text-2xl font-bold text-[#4577ac] mb-8">
        {isDE ? "Datenschutzerklärung" : "Data Protection Policy"}
      </h1>

      <div className="prose prose-sm max-w-none text-gray-700 space-y-6">

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {isDE ? "Verantwortliche Stelle" : "Responsible Party"}
          </h2>
          <p>
            <strong>Walldorfer Ski-Club 81 e.V.</strong><br />
            Postfach 1426<br />
            69185 Walldorf<br />
            <strong>{isDE ? "Ansprechpartnerin" : "Contact person"}:</strong> Birgit Lehment<br />
            <strong>E-Mail:</strong>{" "}
            <a href="mailto:vorstand@wsc81.de" className="text-[#4577ac] hover:underline">
              vorstand@wsc81.de
            </a>
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {isDE ? "Allgemeines" : "General"}
          </h2>
          <p>
            {isDE
              ? "Der Schutz Ihrer persönlichen Daten ist uns ein wichtiges Anliegen. Wir behandeln Ihre personenbezogenen Daten vertraulich und entsprechend der gesetzlichen Datenschutzvorschriften sowie dieser Datenschutzerklärung. Wir empfehlen, diese Erklärung regelmäßig zu lesen, da sie aktualisiert werden kann."
              : "The protection of your personal data is important to us. We treat your personal data confidentially and in accordance with the applicable data protection regulations and this privacy policy. We recommend reviewing this policy periodically, as it may be updated."}
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {isDE ? "Server-Logfiles und Zugriffsdaten" : "Server Logs and Access Data"}
          </h2>
          <p>
            {isDE
              ? "Auf Basis unserer berechtigten Interessen erheben wir beim Besuch unserer Website automatisch Zugriffsinformationen. Dazu gehören IP-Adresse, Browser-Informationen sowie Datum und Uhrzeit der Anfrage. Diese Daten werden für maximal 7 Tage gespeichert und anschließend gelöscht, sofern sie nicht für Sicherheitsuntersuchungen benötigt werden."
              : "Based on our legitimate interests, we automatically collect access information when you visit our website. This includes IP address, browser details, and the date and time of the request. This data is stored for a maximum of 7 days and then deleted, unless it is needed for security investigations."}
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {isDE ? "Cookies" : "Cookies"}
          </h2>
          <p>
            {isDE
              ? "Unsere Website verwendet Cookies mit einer Laufzeit von bis zu 24 Stunden, um die Funktionalität und Navigation zu verbessern. Sie können Cookies in Ihren Browser-Einstellungen deaktivieren. Bitte beachten Sie, dass dies die Funktionsfähigkeit einiger Bereiche der Website beeinträchtigen kann."
              : "Our website uses cookies lasting up to 24 hours to enhance functionality and navigation. You can disable cookies through your browser settings. Please note that this may affect the functionality of certain areas of the website."}
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {isDE ? "Kontaktformulare und personenbezogene Daten" : "Contact Forms and Personal Data"}
          </h2>
          <p>
            {isDE
              ? "Angaben, die Sie über Kontaktformulare übermitteln (Name, E-Mail, Telefon), werden ausschließlich mit Ihrer ausdrücklichen Einwilligung verarbeitet und dienen der Beantwortung Ihrer Anfrage. Eine Weitergabe an Dritte erfolgt ohne Ihre Einwilligung nicht."
              : "Information you submit through contact forms (name, email, phone) is processed only with your explicit consent and is used solely to respond to your inquiry. Data is not shared with third parties without your consent."}
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {isDE ? "Drittanbieter-Dienste" : "Third-Party Services"}
          </h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Google reCAPTCHA:</strong>{" "}
              {isDE
                ? "Wird zur Missbrauchsverhinderung in Formularen eingesetzt. Dabei werden Daten an Google-Server übertragen."
                : "Used to prevent form abuse; data is transferred to Google servers."}
            </li>
            <li>
              <strong>Google Maps:</strong>{" "}
              {isDE
                ? "Kann Standortdaten an Google übermitteln, wenn Kartenfunktionen genutzt werden."
                : "May transmit location data to Google when map features are used."}
            </li>
            <li>
              <strong>Google Web Fonts:</strong>{" "}
              {isDE
                ? "Schriftarten werden lokal geladen, ohne eine Verbindung zu Googles Servern herzustellen."
                : "Fonts are loaded locally without connecting to Google's servers."}
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {isDE ? "Ihre Rechte" : "Your Rights"}
          </h2>
          <p>
            {isDE
              ? "Sie haben das Recht, jederzeit unentgeltlich Auskunft über Ihre gespeicherten personenbezogenen Daten zu erhalten sowie das Recht auf Berichtigung, Einschränkung der Verarbeitung oder Löschung dieser Daten, soweit dem keine gesetzlichen Aufbewahrungspflichten entgegenstehen. Für Anfragen wenden Sie sich bitte an: "
              : "You have the right to request free information about your stored personal data at any time, as well as the right to correct inaccuracies, restrict processing, or request deletion, subject to legal retention requirements. For requests, please contact: "}
            <a href="mailto:vorstand@wsc81.de" className="text-[#4577ac] hover:underline">
              vorstand@wsc81.de
            </a>
          </p>
        </section>

      </div>
    </div>
  );
}
