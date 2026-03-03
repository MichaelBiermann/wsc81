import { getLocale } from "next-intl/server";

const SUPPORTERS = [
  { role: "Homepage-Kontakt", roleEn: "Website contact", name: "Birgit Lehment-Oelert", email: "birgit.lehment@wsc81.de" },
  { role: "Kassenprüfer", roleEn: "Financial Auditor", name: "Christine Wirth", email: null },
  { role: "Kassenprüfer", roleEn: "Financial Auditor", name: "Christiane Fischer", email: null },
];

export default async function UnterstuetzerPage() {
  const locale = await getLocale();
  const isDE = locale === "de";

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 pt-20">
      <h1 className="text-3xl font-bold text-[#4577ac] mb-2">
        {isDE ? "Unsere Unterstützer" : "Our Supporters"}
      </h1>
      <p className="text-gray-500 mb-8">
        {isDE
          ? "Personen, die den WSC 81 ehrenamtlich unterstützen"
          : "People who support WSC 81 on a voluntary basis"}
      </p>

      <div className="grid gap-4 sm:grid-cols-2 mb-10">
        {SUPPORTERS.map((s) => (
          <div key={s.name} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#4577ac] mb-1">
              {isDE ? s.role : s.roleEn}
            </p>
            <p className="font-semibold text-gray-900">{s.name}</p>
            {s.email && (
              <p className="text-sm mt-1">
                <a href={`mailto:${s.email}`} className="text-[#4577ac] hover:underline">{s.email}</a>
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="border-t border-gray-200 pt-8">
        <h2 className="text-xl font-bold text-[#4577ac] mb-4">
          {isDE ? "Unsere Sponsoren" : "Our Sponsors"}
        </h2>
        <p className="text-gray-700 mb-4">
          {isDE
            ? "Der WSC 81 wird von lokalen Unternehmen aus Walldorf und Umgebung unterstützt."
            : "WSC 81 is supported by local businesses from Walldorf and the surrounding area."}
        </p>
        <a
          href={`/${locale}/sponsoren`}
          className="inline-block rounded bg-[#4577ac] px-4 py-2 text-sm font-medium text-white hover:bg-[#2d5a8a] transition-colors"
        >
          {isDE ? "Alle Sponsoren ansehen" : "View all sponsors"}
        </a>
      </div>

      <div className="bg-[#eef3f9] rounded-lg p-5 mt-8 text-sm text-gray-700">
        <p className="font-semibold text-[#4577ac] mb-2">{isDE ? "Kontakt" : "Contact"}</p>
        <p>Walldorfer Ski-Club 81 e.V.</p>
        <p>Postfach 1426, 69185 Walldorf</p>
        <p><a href="mailto:vorstand@wsc81.de" className="text-[#4577ac] hover:underline">vorstand@wsc81.de</a></p>
      </div>
    </div>
  );
}
