export default function WelcomeBlock({ locale }: { locale: string }) {
  const isDE = locale === "de";
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 text-center">
      <h2 className="text-2xl font-bold text-[#4577ac] mb-4">
        {isDE ? "Herzlich Willkommen!" : "Welcome!"}
      </h2>
      <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
        {isDE
          ? "Der Walldorfer Ski-Club 81 e.V. bietet das ganze Jahr über vielfältige Aktivitäten für alle Altersgruppen – von Skifreizeiten im Winter bis hin zu Nordic Walking und Fitnessgymnastik das ganze Jahr. Werden Sie Teil unserer Gemeinschaft!"
          : "Walldorfer Ski-Club 81 e.V. offers a wide range of activities for all age groups throughout the year – from ski trips in winter to Nordic Walking and fitness gymnastics all year round. Become part of our community!"}
      </p>
    </section>
  );
}
