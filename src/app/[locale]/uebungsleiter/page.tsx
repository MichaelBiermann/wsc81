import { getLocale } from "next-intl/server";

const INSTRUCTORS = [
  { name: "Rita Merklinger-Beilharz", area: "Skigymnastik / Fitness", areaEn: "Ski gymnastics / Fitness", phone: "06227/9544" },
  { name: "Oliver Steinbach", area: "Skilehrer", areaEn: "Ski Instructor", phone: "06224/171467" },
  { name: "Astrid Lundschien", area: "Nordic Walking", areaEn: "Nordic Walking", phone: "06227/64565" },
  { name: "Birgit Böhli-Tretschock", area: "Lauftreff", areaEn: "Running Group", phone: "06227/9041" },
  { name: "Thomas Collet", area: "Stützpunktleiter, Sportabzeichen", areaEn: "Base coordinator, Sports Badge", phone: "06227/539884" },
  { name: "Kerstin Hagmann", area: "Sportabzeichen Prüferin", areaEn: "Sports Badge Examiner", phone: "06227/380800" },
  { name: "Petra Maurer", area: "Sportabzeichen Prüferin", areaEn: "Sports Badge Examiner", phone: "06227/539884" },
];

export default async function UebungsleiterPage() {
  const locale = await getLocale();
  const isDE = locale === "de";

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 pt-20">
      <h1 className="text-3xl font-bold text-[#4577ac] mb-2">
        {isDE ? "Übungsleiter" : "Instructors"}
      </h1>
      <p className="text-gray-500 mb-8">
        {isDE
          ? "Unsere qualifizierten Übungsleiter und Trainer"
          : "Our qualified instructors and trainers"}
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {INSTRUCTORS.map((i) => (
          <div key={i.name} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#4577ac] mb-1">
              {isDE ? i.area : i.areaEn}
            </p>
            <p className="font-semibold text-gray-900">{i.name}</p>
            <p className="text-sm text-gray-500 mt-1">📞 {i.phone}</p>
          </div>
        ))}
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
