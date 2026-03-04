import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import ProfileEditor from "@/components/ProfileEditor";
import EmailEditor from "@/components/EmailEditor";
import AvatarUpload from "@/components/AvatarUpload";

export default async function AccountPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ emailChange?: string }>;
}) {
  const { locale } = await params;
  const { emailChange } = await searchParams;
  const session = await auth();

  if (!session?.user || (session.user as { role?: string }).role === "admin") {
    redirect(`/${locale}/login`);
  }

  const userId = session.user.id!;
  const t = await getTranslations("Account");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      bookings: {
        include: { event: true },
        orderBy: { createdAt: "desc" },
      },
      member: true,
    },
  });

  if (!user) redirect(`/${locale}/login`);

  const role = (session.user as { role?: string }).role;
  const isDE = locale === "de";

  const categoryLabels: Record<string, { de: string; en: string }> = {
    FAMILIE:     { de: "Familie",                   en: "Family" },
    ERWACHSENE:  { de: "Erwachsene",                en: "Adults" },
    JUGENDLICHE: { de: "Jugendliche / Schüler",     en: "Youth / Students" },
    SENIOREN:    { de: "Senioren",                  en: "Seniors" },
    GDB:         { de: "GdB ab 50 %",               en: "Disability ≥ 50 %" },
  };

  const categoryFees: Record<string, number> = {
    FAMILIE: 47, ERWACHSENE: 32, JUGENDLICHE: 17, SENIOREN: 27, GDB: 22,
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 pt-20">
      <h1 className="text-2xl font-bold text-[#4577ac] mb-6">{t("pageTitle")}</h1>

      {/* Email change status banner */}
      {emailChange === "success" && (
        <div className="mb-4 rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
          {t("emailChange.success")}
        </div>
      )}
      {emailChange === "expired" && (
        <div className="mb-4 rounded-md bg-yellow-50 border border-yellow-200 px-4 py-3 text-sm text-yellow-800">
          {t("emailChange.expired")}
        </div>
      )}
      {emailChange === "invalid" && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
          {t("emailChange.invalid")}
        </div>
      )}

      {/* ── Personal data ──────────────────────────────────────────────── */}
      <section className="rounded-lg border border-gray-200 bg-white p-6 mb-6">
        <h2 className="font-semibold text-lg mb-4">{t("profile")}</h2>

        {/* Avatar row */}
        <div className="mb-4">
          <AvatarUpload
            currentUrl={user.avatarUrl}
            liveUpload={true}
            labels={{
              upload: t("avatar.upload"),
              change: t("avatar.change"),
              remove: t("avatar.remove"),
              invalidType: t("avatar.invalidType"),
              tooLarge: t("avatar.tooLarge"),
              error: t("avatar.error"),
            }}
          />
        </div>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-4">
          <dt className="text-gray-500">{t("fields.name")}</dt>
          <dd className="font-medium">{user.firstName} {user.lastName}</dd>

          <dt className="text-gray-500">{t("fields.dob")}</dt>
          <dd>{user.dob.toLocaleDateString(isDE ? "de-DE" : "en-GB")}</dd>

          <dt className="text-gray-500">{t("fields.email")}</dt>
          <dd>
            <EmailEditor
              email={user.email}
              pendingEmail={user.pendingEmail}
              labels={{
                edit: t("emailChange.edit"),
                newEmail: t("emailChange.newEmail"),
                save: t("emailChange.save"),
                cancel: t("emailChange.cancel"),
                cancelPending: t("emailChange.cancelPending"),
                pendingBanner: t("emailChange.pendingBanner"),
                sent: t("emailChange.sent"),
                emailTaken: t("emailChange.emailTaken"),
                error: t("emailChange.error"),
              }}
            />
          </dd>
        </dl>

        <ProfileEditor
          street={user.street}
          postalCode={user.postalCode}
          city={user.city}
          phone={user.phone}
          labels={{
            street: t("fields.street"),
            postalCode: t("fields.postalCode"),
            city: t("fields.city"),
            phone: t("fields.phone"),
            address: t("fields.address"),
            edit: t("edit"),
            save: t("save"),
            cancel: t("cancel"),
            saved: t("saved"),
          }}
        />
      </section>

      {/* ── Membership ─────────────────────────────────────────────────── */}
      <section className="rounded-lg border border-gray-200 bg-white p-6 mb-6">
        <h2 className="font-semibold text-lg mb-4">{t("memberStatus")}</h2>

        {role === "member" && user.member ? (
          <div className="space-y-4">
            {/* Status row */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                {t("statusMember")}
              </span>
              <span className="text-sm text-gray-500">
                {t("memberNumber", { number: user.member.memberNumber })}
              </span>
              {user.member.feesPaid ? (
                <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                  {t("feesPaid")}
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-800">
                  {t("feesPending")}
                </span>
              )}
            </div>

            {/* Membership details */}
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <dt className="text-gray-500">{t("membership.category")}</dt>
              <dd>{isDE ? categoryLabels[user.member.category]?.de : categoryLabels[user.member.category]?.en}</dd>

              <dt className="text-gray-500">{t("membership.fee")}</dt>
              <dd>€ {categoryFees[user.member.category] ?? "—"} / {isDE ? "Jahr" : "year"}</dd>

              <dt className="text-gray-500">{t("membership.activatedAt")}</dt>
              <dd>{user.member.activatedAt.toLocaleDateString(isDE ? "de-DE" : "en-GB")}</dd>

              <dt className="text-gray-500">{t("membership.persons")}</dt>
              <dd>
                <ul className="space-y-0.5">
                  {[
                    user.member.person1Name,
                    user.member.person2Name,
                    user.member.person3Name,
                    user.member.person4Name,
                    user.member.person5Name,
                  ]
                    .filter(Boolean)
                    .map((name, i) => (
                      <li key={i}>{name}</li>
                    ))}
                </ul>
              </dd>

              <dt className="text-gray-500">{t("membership.bank")}</dt>
              <dd>
                <span>{user.member.bankName}</span><br />
                <span className="font-mono text-xs text-gray-600">
                  IBAN ···· {user.member.ibanLast4}
                  {user.member.bic ? ` · BIC ${user.member.bic}` : ""}
                </span>
              </dd>
            </dl>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600">
              {t("statusUser")}
            </span>
            <Link href={`/${locale}/membership`} className="text-sm text-[#4577ac] hover:underline">
              {t("applyForMembership")}
            </Link>
          </div>
        )}
      </section>

      {/* ── Booked events ──────────────────────────────────────────────── */}
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="font-semibold text-lg mb-4">{t("bookings")}</h2>

        {user.bookings.length === 0 ? (
          <p className="text-sm text-gray-500">{t("noBookings")}</p>
        ) : (
          <div className="space-y-4">
            {user.bookings.map((booking: typeof user.bookings[number]) => {
              const participants = [
                booking.person1Name,
                booking.person2Name,
                booking.person3Name,
                booking.person4Name,
                booking.person5Name,
              ].filter(Boolean) as string[];

              const eventTitle = isDE ? booking.event.titleDe : booking.event.titleEn;
              const startDate = booking.event.startDate.toLocaleDateString(isDE ? "de-DE" : "en-GB");
              const endDate = booking.event.endDate.toLocaleDateString(isDE ? "de-DE" : "en-GB");
              const bookedOn = booking.createdAt.toLocaleDateString(isDE ? "de-DE" : "en-GB");

              return (
                <div key={booking.id} className="rounded-md border border-gray-100 bg-gray-50 p-4 text-sm">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="font-medium text-gray-900">{eventTitle}</p>
                    <span className="shrink-0 text-xs text-gray-400">
                      {t("bookedOn", { date: bookedOn })}
                    </span>
                  </div>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <dt className="text-gray-500">{t("bookingDate")}</dt>
                    <dd>{startDate} – {endDate}</dd>

                    <dt className="text-gray-500">{t("bookingLocation")}</dt>
                    <dd>{booking.event.location}</dd>

                    <dt className="text-gray-500">{t("bookingParticipants")}</dt>
                    <dd>{participants.join(", ")}</dd>

                    {booking.remarks && (
                      <>
                        <dt className="text-gray-500">{t("bookingRemarks")}</dt>
                        <dd className="text-gray-600">{booking.remarks}</dd>
                      </>
                    )}
                  </dl>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div className="mt-6">
        <form action="/api/auth/signout" method="POST">
          <button type="submit" className="text-sm text-gray-500 hover:text-gray-700 hover:underline">
            {t("signOut")}
          </button>
        </form>
      </div>
    </div>
  );
}
