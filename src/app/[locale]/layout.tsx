import { NextIntlClientProvider } from "next-intl";
import { getMessages, getLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import AuthProvider from "@/components/AuthProvider";
import PublicChatPanel from "@/components/PublicChatPanel";
import SponsorsStrip from "@/components/SponsorsStrip";
import ScrollToTop from "@/components/ScrollToTop";
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
    <AuthProvider>
      <NextIntlClientProvider messages={messages}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded focus:bg-white focus:px-4 focus:py-2 focus:text-[#4577ac] focus:font-semibold focus:shadow-lg"
        >
          {locale === "en" ? "Skip to main content" : "Zum Hauptinhalt springen"}
        </a>
        <ScrollToTop />
        <Nav />
        <main id="main-content" className="min-h-screen">{children}</main>
        <Footer />
        <SponsorsStrip />
        <PublicChatPanel />
      </NextIntlClientProvider>
    </AuthProvider>
  );
}
