import Link from "next/link";

export default function WelcomeBlock({ locale }: { locale: string }) {
  const isDE = locale === "de";
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 text-center">
      <h2 className="text-2xl font-bold text-[#4577ac] mb-4">
        {isDE ? "Herzlich Willkommen!" : "Welcome!"}
      </h2>
      <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
        {isDE ? (
          <>
            Der Walldorfer Ski-Club 81 e.V. bietet das ganze Jahr über vielfältige Aktivitäten für alle Altersgruppen – von{" "}
            <Link href={`/${locale}#kommende-veranstaltungen`} className="text-[#4577ac] hover:underline">Skifreizeiten im Winter</Link>
            {" "}bis hin zu{" "}
            <Link href={`/${locale}#veranstaltungen`} className="text-[#4577ac] hover:underline">Nordic Walking</Link>
            {" "}und{" "}
            <Link href={`/${locale}#veranstaltungen`} className="text-[#4577ac] hover:underline">Fitnessgymnastik</Link>
            {" "}das ganze Jahr. Werden Sie Teil unserer Gemeinschaft!
          </>
        ) : (
          <>
            Walldorfer Ski-Club 81 e.V. offers a wide range of activities for all age groups throughout the year – from{" "}
            <Link href={`/${locale}#kommende-veranstaltungen`} className="text-[#4577ac] hover:underline">ski trips in winter</Link>
            {" "}to{" "}
            <Link href={`/${locale}#veranstaltungen`} className="text-[#4577ac] hover:underline">Nordic Walking</Link>
            {" "}and{" "}
            <Link href={`/${locale}#veranstaltungen`} className="text-[#4577ac] hover:underline">fitness gymnastics</Link>
            {" "}all year round. Become part of our community!
          </>
        )}
      </p>
    </section>
  );
}
