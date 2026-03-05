import { getLocale } from "next-intl/server";

export default async function SatzungPage() {
  const locale = await getLocale();
  const isDE = locale === "de";

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 pt-20">
      <h1 className="text-3xl font-bold text-[#4577ac] mb-4">
        {isDE ? "Satzung des WSC 81 e.V." : "Articles of Association"}
      </h1>
      <p className="text-gray-600 mb-8">
        {isDE
          ? "Die Satzung des Walldorfer Ski-Club 81 e.V. steht als PDF-Dokument zum Download bereit."
          : "The articles of association of Walldorfer Ski-Club 81 e.V. are available as a PDF download."}
      </p>

      <a
        href="/documents/satzung.pdf"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded bg-[#4577ac] px-5 py-3 text-sm font-semibold text-white hover:bg-[#2d5a8a] transition-colors"
      >
        <span>📄</span>
        <span>{isDE ? "Satzung als PDF herunterladen" : "Download Articles of Association (PDF)"}</span>
      </a>

      <div className="bg-[#eef3f9] rounded-lg p-5 mt-10 text-sm text-gray-700">
        <p className="font-semibold text-[#4577ac] mb-2">{isDE ? "Kontakt" : "Contact"}</p>
        <p>Walldorfer Ski-Club 81 e.V.</p>
        <p>Postfach 1426, 69185 Walldorf</p>
        <p><a href="mailto:vorstand@wsc81.de" className="text-[#4577ac] hover:underline">vorstand@wsc81.de</a></p>
      </div>
    </div>
  );
}
