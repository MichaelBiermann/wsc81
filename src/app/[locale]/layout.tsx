import { NextIntlClientProvider } from "next-intl";
import { getMessages, getLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import AuthProvider from "@/components/AuthProvider";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Walldorfer Ski-Club 81 e.V.",
  description: "Homepage des Walldorfer Ski-Club 81 e.V.",
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as "de" | "en")) notFound();

  const messages = await getMessages();

  return (
    <html lang={locale}>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&icon_names=calendar_month,close,location_on,menu,search"
        />
      </head>
      <body>
        <AuthProvider>
          <NextIntlClientProvider messages={messages}>
            <Nav />
            <main className="min-h-screen">{children}</main>
            <Footer />
          </NextIntlClientProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
