export default async function BarrierefreiheitPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isDE = locale !== "en";

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 pt-20">
      <h1 className="text-2xl font-bold text-[#4577ac] mb-8">
        {isDE ? "Erklärung zur Barrierefreiheit" : "Accessibility Statement"}
      </h1>

      <div className="prose prose-sm max-w-none text-gray-700 space-y-6">

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {isDE ? "Stand der Vereinbarkeit" : "Compliance Status"}
          </h2>
          <p>
            {isDE
              ? "Der Walldorfer Ski-Club 81 e.V. ist bemüht, seine Website barrierefrei zugänglich zu machen. Diese Website orientiert sich an den Anforderungen der Web Content Accessibility Guidelines (WCAG) 2.1, Stufe AA."
              : "Walldorfer Ski-Club 81 e.V. is committed to making its website accessible. This website is developed in accordance with the Web Content Accessibility Guidelines (WCAG) 2.1, Level AA."}
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {isDE ? "Technische Umsetzung" : "Technical Implementation"}
          </h2>
          <p>
            {isDE
              ? "Die Barrierefreiheit der Website wird durch folgende Maßnahmen unterstützt:"
              : "Accessibility of the website is supported by the following measures:"}
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>{isDE ? "Semantisches HTML und ARIA-Rollen für alle interaktiven Elemente" : "Semantic HTML and ARIA roles for all interactive elements"}</li>
            <li>{isDE ? "Vollständige Tastaturnavigation (Tab, Escape, Pfeiltasten)" : "Full keyboard navigation (Tab, Escape, arrow keys)"}</li>
            <li>{isDE ? "Fokusrahmen bei Tastaturbedienung sichtbar" : "Visible focus indicators for keyboard navigation"}</li>
            <li>{isDE ? "Kontrastverhältnis ≥ 4,5:1 für Texte (WCAG AA)" : "Contrast ratio ≥ 4.5:1 for text (WCAG AA)"}</li>
            <li>{isDE ? "Alternatexte für alle informativen Bilder" : "Alt texts for all informative images"}</li>
            <li>{isDE ? "Beschriftungen für alle Formularfelder" : "Labels for all form fields"}</li>
            <li>{isDE ? "Überschriftenhierarchie (h1–h3) auf allen Seiten" : "Heading hierarchy (h1–h3) on all pages"}</li>
            <li>{isDE ? "Skip-Link zum Hauptinhalt" : "Skip link to main content"}</li>
            <li>{isDE ? "Dialogfenster mit Fokusfalle und Escape-Schließen" : "Dialog panels with focus trap and Escape key to close"}</li>
            <li>{isDE ? "Live-Regionen für dynamische Inhalte (z.B. Chat)" : "Live regions for dynamic content (e.g. chat)"}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {isDE ? "Bekannte Einschränkungen" : "Known Limitations"}
          </h2>
          <p>
            {isDE
              ? "Einige eingebettete Inhalte von Drittanbietern (z.B. Zahlungsformulare von Stripe) unterliegen der Barrierefreiheit des jeweiligen Anbieters und können durch uns nicht direkt beeinflusst werden."
              : "Some embedded third-party content (e.g. Stripe payment forms) is subject to the accessibility standards of the respective provider and cannot be directly influenced by us."}
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {isDE ? "Feedback und Kontakt" : "Feedback and Contact"}
          </h2>
          <p>
            {isDE
              ? "Wenn Sie auf Barrieren stoßen oder Verbesserungsvorschläge haben, wenden Sie sich bitte an:"
              : "If you encounter barriers or have suggestions for improvement, please contact us at:"}
          </p>
          <p className="mt-2">
            <strong>Walldorfer Ski-Club 81 e.V.</strong><br />
            <a href="mailto:vorstand@wsc81.de" className="text-[#4577ac] hover:underline">vorstand@wsc81.de</a>
          </p>
          <p className="mt-2">
            {isDE
              ? "Wir werden Ihre Anfrage so schnell wie möglich bearbeiten."
              : "We will process your request as quickly as possible."}
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {isDE ? "Datum dieser Erklärung" : "Date of This Statement"}
          </h2>
          <p>März 2026</p>
        </section>

      </div>
    </div>
  );
}
