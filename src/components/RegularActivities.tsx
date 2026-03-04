const ACTIVITIES = [
  {
    icon: "downhill_skiing",
    titleDe: "Ski- und Fitnessgymnastik",
    titleEn: "Ski & Fitness Gymnastics",
    descDe: "Ganzjähriges Fitnesstraining zur Ski-Vorbereitung und allgemeinen Kondition – für alle Alters- und Fitnessgruppen. Mit Hanteln, Steppern, Therabändern und mehr.",
    descEn: "Year-round fitness training for ski preparation and general conditioning — for all ages and fitness levels. Using hand weights, steppers, resistance tubes and more.",
    detailsDe: [
      { icon: "schedule", text: "Jeden Mittwoch, 19:45 Uhr" },
      { icon: "location_on", text: "Alte Turnhalle der Schillerschule, Walldorf" },
      { icon: "person", text: "Übungsleiterin: Rita Merklinger-Beilharz" },
    ],
    detailsEn: [
      { icon: "schedule", text: "Every Wednesday, 7:45 PM" },
      { icon: "location_on", text: "Old gymnasium, Schillerschule Walldorf" },
      { icon: "person", text: "Instructor: Rita Merklinger-Beilharz" },
    ],
  },
  {
    icon: "nordic_walking",
    titleDe: "Nordic Walking",
    titleEn: "Nordic Walking",
    descDe: "Geführte Nordic-Walking-Touren mit zertifizierter Übungsleiterin. Anfänger können Stöcke ausleihen. Ganzheitliches Training für Herz-Kreislauf, Muskulatur und Wohlbefinden.",
    descEn: "Guided Nordic walking tours with a certified instructor. Beginners can borrow poles. Full-body workout for cardiovascular health, muscle strength and well-being.",
    detailsDe: [
      { icon: "schedule", text: "Jeden Sonntag, 10:00 Uhr" },
      { icon: "location_on", text: "Pforte der Waldschule, Walldorf" },
      { icon: "mail", text: "astrid.lundschien@wsc81.de" },
    ],
    detailsEn: [
      { icon: "schedule", text: "Every Sunday, 10:00 AM" },
      { icon: "location_on", text: "Gate of Waldschule, Walldorf" },
      { icon: "mail", text: "astrid.lundschien@wsc81.de" },
    ],
  },
  {
    icon: "directions_run",
    titleDe: "Lauftreff",
    titleEn: "Running Group",
    descDe: "Lockerer Zusammenschluss von Hobbyläufern – Fitness erhalten, soziale Kontakte pflegen, gemeinsam Spaß haben. Strecken von 5–10 km auf Waldwegen, Tempo nach Wunsch.",
    descEn: "A casual group of recreational runners — keep fit, socialise and have fun together. Routes of 5–10 km on forest paths, pace to suit everyone.",
    detailsDe: [
      { icon: "schedule", text: "Jeden Dienstag, 18:00 Uhr" },
      { icon: "location_on", text: "Schranke am Spielplatz unterhalb der Waldschule" },
      { icon: "phone", text: "Birgit Tretschock: 0151 / 59464914" },
    ],
    detailsEn: [
      { icon: "schedule", text: "Every Tuesday, 6:00 PM" },
      { icon: "location_on", text: "Barrier at the playground below the Waldschule" },
      { icon: "phone", text: "Birgit Tretschock: +49 151 59464914" },
    ],
  },
  {
    icon: "emoji_events",
    titleDe: "Deutsches Sportabzeichen",
    titleEn: "German Sports Badge",
    descDe: "Prüfungen für das Deutsche Sportabzeichen in Bronze, Silber und Gold. Disziplinen: Leichtathletik, Radfahren, Schwimmen und Nordic Walking.",
    descEn: "Tests for the German Sports Badge in Bronze, Silver and Gold. Disciplines: athletics, cycling, swimming and Nordic walking.",
    detailsDe: [
      { icon: "calendar_month", text: "Leichtathletik: 26. Juli & 27. Sep., 10 Uhr – Waldstadion Walldorf" },
      { icon: "pool", text: "Schwimmen: 5. & 26. Juni, 19 Uhr – Freibad Walldorf" },
      { icon: "mail", text: "sportabzeichen@wsc81.de" },
    ],
    detailsEn: [
      { icon: "calendar_month", text: "Athletics: Jul 26 & Sep 27, 10 AM – Waldstadion Walldorf" },
      { icon: "pool", text: "Swimming: Jun 5 & 26, 7 PM – Freibad Walldorf" },
      { icon: "mail", text: "sportabzeichen@wsc81.de" },
    ],
  },
];

export default function RegularActivities({ locale }: { locale: string }) {
  const isDE = locale === "de";

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {ACTIVITIES.map((a) => {
        const title = isDE ? a.titleDe : a.titleEn;
        const desc = isDE ? a.descDe : a.descEn;
        const details = isDE ? a.detailsDe : a.detailsEn;

        return (
          <div key={a.titleDe} className="rounded-lg border border-gray-200 bg-white shadow-sm p-5 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-rounded text-[#4577ac]" style={{ fontSize: "24px" }}>{a.icon}</span>
              <h3 className="font-bold text-gray-900 text-sm leading-tight">{title}</h3>
            </div>
            <p className="text-sm text-gray-600 flex-1">{desc}</p>
            <ul className="space-y-1.5">
              {details.map((d, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-gray-500">
                  <span className="material-symbols-rounded shrink-0 text-[#4577ac]" style={{ fontSize: "14px" }}>{d.icon}</span>
                  <span>{d.text}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
