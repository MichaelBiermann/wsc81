export default async function BookingSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ email?: string }>;
}) {
  const { locale } = await params;
  const { email } = await searchParams;
  const isDE = locale === "de";

  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <div className="text-5xl mb-4">✅</div>
      <h1 className="text-2xl font-bold text-green-700 mb-3">
        {isDE ? "Anmeldung eingegangen!" : "Booking received!"}
      </h1>
      <p className="text-gray-600 mb-6">
        {isDE
          ? `Wir haben eine Bestätigungs-E-Mail an ${email} gesendet.`
          : `A confirmation has been sent to ${email}.`}
      </p>
      <a href={`/${locale}`} className="text-[#4577ac] hover:underline">
        {isDE ? "Zurück zur Startseite" : "Back to homepage"}
      </a>
    </div>
  );
}
