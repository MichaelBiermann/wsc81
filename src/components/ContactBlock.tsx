export default function ContactBlock() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <h2 className="text-2xl font-bold text-[#4577ac] mb-4">Kontakt</h2>
      <div className="rounded-lg border border-gray-200 bg-white p-6 max-w-sm shadow-sm">
        <p className="text-gray-700 leading-relaxed">
          <strong>Walldorfer Ski-Club 81 e.V.</strong><br />
          Postfach 1234<br />
          69190 Walldorf<br /><br />
          <a href="mailto:vorstand@wsc81.de" className="text-[#4577ac] hover:underline">
            vorstand@wsc81.de
          </a>
        </p>
      </div>
    </section>
  );
}
