import { getLocale } from "next-intl/server";
import Image from "next/image";

export default async function UnserVereinPage() {
  const locale = await getLocale();
  const isDE = locale === "de";

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 pt-20">
      {isDE ? (
        <>
          <h1 className="text-3xl font-bold text-[#4577ac] mb-6">Unser Verein</h1>

          <p className="text-gray-700 mb-4">
            Der Walldorfer Ski-Club 81 e.V. ist ein traditionsreicher Sportverein aus Walldorf, Baden-Württemberg,
            der seit über 30 Jahren aktiv ist. Unser Vereinsleben ist geprägt von sportlicher Vielfalt
            und einem starken Gemeinschaftssinn – sowohl im Winter als auch das ganze Jahr über.
          </p>

          <h2 className="text-xl font-bold text-[#4577ac] mt-8 mb-3">Winterangebote</h2>
          <p className="text-gray-700 mb-3">Unser Herzstück sind die jährlichen Skifreizeiten in die Alpen:</p>
          <ul className="list-disc pl-6 text-gray-700 space-y-1 mb-4">
            <li>Wochenendenausflüge in verschiedene Skigebiete</li>
            <li>Familienfreizeiten in der Ferienzeit</li>
            <li>Mehrtägige Gruppenreisen zu alpinen Destinationen</li>
          </ul>

          <h2 className="text-xl font-bold text-[#4577ac] mt-8 mb-3">Ganzjährige Sportangebote</h2>
          <ul className="list-disc pl-6 text-gray-700 space-y-1 mb-4">
            <li><strong>Skigymnastik / Fitness</strong> – mittwochs</li>
            <li><strong>Lauftreff</strong> – dienstags</li>
            <li><strong>Nordic Walking</strong> – sonntags</li>
            <li><strong>Deutsches Sportabzeichen</strong> – Abnahme und Training</li>
          </ul>

          <h2 className="text-xl font-bold text-[#4577ac] mt-8 mb-3">Geselliges Vereinsleben</h2>
          <p className="text-gray-700 mb-4">
            Neben dem Sport pflegen wir ein aktives Vereinsleben mit Hüttenfesten, Weihnachtsmarktbesuchen
            und anderen geselligen Veranstaltungen – für Mitglieder und ihre Familien.
          </p>

          <h2 className="text-xl font-bold text-[#4577ac] mt-8 mb-3">Mitgliedschaft</h2>
          <p className="text-gray-700 mb-4">
            Ski-Vorkenntnisse sind keine Voraussetzung – wir freuen uns über alle, die Spaß an Bewegung
            und Gemeinschaft haben. Werden Sie jetzt Mitglied!
          </p>

          <div className="bg-[#eef3f9] rounded-lg p-5 mt-8 text-sm text-gray-700">
            <p className="font-semibold text-[#4577ac] mb-2">Kontakt</p>
            <p>Walldorfer Ski-Club 81 e.V.</p>
            <p>Postfach 1426, 69185 Walldorf</p>
            <p><a href="mailto:vorstand@wsc81.de" className="text-[#4577ac] hover:underline">vorstand@wsc81.de</a></p>
          </div>
        </>
      ) : (
        <>
          <h1 className="text-3xl font-bold text-[#4577ac] mb-6">Our Club</h1>

          <p className="text-gray-700 mb-4">
            Walldorfer Ski-Club 81 e.V. is a well-established sports club from Walldorf, Baden-Württemberg,
            active for over 30 years. Club life is defined by sporting variety and a strong sense of community —
            both in winter and throughout the year.
          </p>

          <h2 className="text-xl font-bold text-[#4577ac] mt-8 mb-3">Winter Activities</h2>
          <p className="text-gray-700 mb-3">Our highlight is the annual ski trips to the Alps:</p>
          <ul className="list-disc pl-6 text-gray-700 space-y-1 mb-4">
            <li>Weekend getaways to various ski resorts</li>
            <li>Family trips during school holidays</li>
            <li>Multi-day group tours to Alpine destinations</li>
          </ul>

          <h2 className="text-xl font-bold text-[#4577ac] mt-8 mb-3">Year-Round Sports</h2>
          <ul className="list-disc pl-6 text-gray-700 space-y-1 mb-4">
            <li><strong>Ski gymnastics / Fitness</strong> – Wednesdays</li>
            <li><strong>Running club</strong> – Tuesdays</li>
            <li><strong>Nordic Walking</strong> – Sundays</li>
            <li><strong>German sports badge</strong> – training and certification</li>
          </ul>

          <h2 className="text-xl font-bold text-[#4577ac] mt-8 mb-3">Social Events</h2>
          <p className="text-gray-700 mb-4">
            Beyond sport, we maintain an active social calendar with summer parties, Christmas market visits
            and other events — for members and their families.
          </p>

          <h2 className="text-xl font-bold text-[#4577ac] mt-8 mb-3">Membership</h2>
          <p className="text-gray-700 mb-4">
            No skiing experience required — we welcome everyone who enjoys sport and community. Join us today!
          </p>

          <div className="bg-[#eef3f9] rounded-lg p-5 mt-8 text-sm text-gray-700">
            <p className="font-semibold text-[#4577ac] mb-2">Contact</p>
            <p>Walldorfer Ski-Club 81 e.V.</p>
            <p>Postfach 1426, 69185 Walldorf</p>
            <p><a href="mailto:vorstand@wsc81.de" className="text-[#4577ac] hover:underline">vorstand@wsc81.de</a></p>
          </div>
        </>
      )}

      <div className="mt-10 rounded-lg overflow-hidden">
        <Image
          src="/images/verein/2025_Arlberg_4.webp"
          alt="Arlberg 2025"
          width={1200}
          height={800}
          className="w-full h-auto"
        />
      </div>
    </div>
  );
}
