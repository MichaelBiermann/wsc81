import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import ProfileEditor from "@/components/ProfileEditor";
import EmailEditor from "@/components/EmailEditor";

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

      {/* Profile summary */}
      <section className="rounded-lg border border-gray-200 bg-white p-6 mb-6">
        <h2 className="font-semibold text-lg mb-3">{t("profile")}</h2>
        <dl className="grid grid-cols-2 gap-2 text-sm mb-4">
          <dt className="text-gray-500">{t("fields.name")}</dt>
          <dd>{user.firstName} {user.lastName}</dd>
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

      {/* Membership status */}
      <section className="rounded-lg border border-gray-200 bg-white p-6 mb-6">
        <h2 className="font-semibold text-lg mb-3">{t("memberStatus")}</h2>
        {role === "member" && user.member ? (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
              {t("statusMember")}
            </span>
            <span className="text-sm text-gray-500">{t("memberNumber", { number: user.member.memberNumber })}</span>
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

      {/* Booking history */}
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="font-semibold text-lg mb-3">{t("bookings")}</h2>
        {user.bookings.length === 0 ? (
          <p className="text-sm text-gray-500">{t("noBookings")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="pb-2 text-left font-medium text-gray-500">{t("bookingEvent")}</th>
                  <th className="pb-2 text-left font-medium text-gray-500">{t("bookingDate")}</th>
                  <th className="pb-2 text-left font-medium text-gray-500">{t("bookingParticipants")}</th>
                </tr>
              </thead>
              <tbody>
                {user.bookings.map((booking) => {
                  const participants = [booking.person1Name, booking.person2Name, booking.person3Name, booking.person4Name, booking.person5Name].filter(Boolean);
                  const eventTitle = locale === "de" ? booking.event.titleDe : booking.event.titleEn;
                  return (
                    <tr key={booking.id} className="border-b border-gray-100 last:border-0">
                      <td className="py-2 pr-4">{eventTitle}</td>
                      <td className="py-2 pr-4 text-gray-500">
                        {booking.event.startDate.toLocaleDateString(locale === "de" ? "de-DE" : "en-GB")}
                      </td>
                      <td className="py-2 text-gray-500">{participants.length}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="mt-6">
        <form action={`/api/auth/signout`} method="POST">
          <button type="submit" className="text-sm text-gray-500 hover:text-gray-700 hover:underline">
            {t("signOut")}
          </button>
        </form>
      </div>
    </div>
  );
}
